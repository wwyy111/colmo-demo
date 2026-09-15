import {createPresentation,sequence} from './presentation.js';
import {icon} from './icons.js';
import {interactions} from './strategy-data.js';
import {nodes} from './nodes.js';
import {roomState,deviceNames} from './room-state.js';
import {motionAssets} from './motion-assets.js';
const $=s=>document.querySelector(s);
const scenes=['AI 晨间唤醒','AI 全屋空气托管','AI 辅助烹饪','AI 家庭洗衣房','全屋设备智能管家','全屋安防智能管家'];
const tasks=[
 {name:'无感唤醒',goal:'在目标时间内温和醒来，不打扰伴侣，并可随时接管。',pain:'固定强度容易突然晃醒或吵醒，状态误判可能造成漏叫醒或持续打扰。原始访谈还提到生态设备接入复杂、伴侣作息不一致时容易受到干扰。'},
 {name:'起床环境就绪',goal:'醒来前环境已经舒适，过程安静且不过早耗能。',pain:'固定定时难以适应天气、开窗和设备状态，容易过早或过晚。用户也提到卧室空气闷、离开被窝时温差不适。'},
 {name:'洗漱用水就绪',goal:'到洗漱间时，温度合适的热水已经备好，减少等待和浪费。',pain:'水路较长时，需要等待冷水放尽；原有联动能力弱，依赖手动开启或固定定时。'}
];
let task=0,selected='N011',moment=0,branch='normal',channel='visual',visual='avatar',shape='line',phase=0,room=null,confirmed=false,editing=false,clock='07:00',soundAllowed=false,watchAllowed=true,role='user',sceneIndex=0;
const narrationPlayer=new Audio();let audioAttempt=0,soundBlocked=false;
let demoMuted=false;let draggingProgress=false,lastCase=null;
let demoStage='configure',demoAudio=null,audioContext=null,hasInteracted=false;
const faults={
 missing:{title:'关键偏好待补充',detail:'声音提醒还没有设置，要加入吗？',action:'补充偏好后更新草案',voice:'missing'},
 conflict:{title:'家庭免扰规则冲突',detail:'声音提醒与家庭免扰规则冲突，本次先不使用卧室音箱。',action:'由管理者核对家庭免扰规则',voice:'conflict'},
 device:{title:'设备能力待确认',detail:'目前无法确认手表是否支持震动唤醒，这一项暂不加入。',action:'暂不纳入未知设备，保留后续核验',voice:'device'}
};
function silence(){if(demoAudio){demoAudio.pause();}document.querySelectorAll('audio,video').forEach(a=>a.pause());if(audioContext?.state==='running')audioContext.suspend();}
const presentation=createPresentation((stage,offset=0)=>{
 demoStage=stage.id;moment=['overview','walking','request','configure'].includes(stage.id)?0:1;
 branch=faults[stage.id]?stage.id:'normal';channel='visual';visual=moment?'cards':'avatar';
 syncRoom();renderMoment();renderDemo();playStageSound(offset);

},reason=>{silence();room?.pauseStoryboard?.();document.body.classList.remove('demo-running');updatePlayer();});
function renderDemo(){
 renderSceneMedia();
 $('#demo-controls').hidden=!isExample();document.body.classList.toggle('demo-running',presentation.running);
 if(presentation.running){$('#demo-status').textContent=({overview:'全景概览',walking:'走向中控屏',request:'用户描述需求',configure:'开始配置',normal:'正常情况 · 草案生成'}[demoStage]||'异常处理 · '+(Object.keys(faults).indexOf(branch)+1)+' / 3');}
 $('#demo-controls').dataset.stage=demoStage;
}
function playNarration(){
 const attempt=++audioAttempt;
 return narrationPlayer.play().then(()=>{if(attempt===audioAttempt){soundBlocked=false;updatePlayer();}}).catch(error=>{
 if(attempt!==audioAttempt||error.name==='AbortError')return;
 if(error.name==='NotAllowedError'){soundBlocked=true;presentation.stop();updatePlayer();}
 else console.warn('Narration unavailable',error.name);
 });
}
function playStageSound(offset=0){
 audioAttempt++;silence();demoAudio=null;if(['overview','walking','request'].includes(demoStage))return;
 const file=moment===0?null:branch==='normal'?'draft':faults[branch]?.voice;
 if(file){demoAudio=narrationPlayer;demoAudio.src='./media/voice/'+file+'.mp3';demoAudio.muted=demoMuted;const audio=demoAudio;audio.onloadedmetadata=()=>{audio.currentTime=Math.min(offset/1000,audio.duration);};audio.onended=()=>{$('#scene-subtitle').textContent='';};if(presentation.running)playNarration();}
 if(demoMuted||offset>0||['conflict','device'].includes(demoStage))return;
 if(!audioContext)audioContext=new (window.AudioContext||window.webkitAudioContext)();
 audioContext.resume().then(()=>{if(!presentation.running||audioContext.state!=='running'||demoMuted)return;
 const osc=audioContext.createOscillator(),gain=audioContext.createGain(),now=audioContext.currentTime;
 osc.frequency.value=branch==='normal'?660:440;gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.045,now+.03);gain.gain.exponentialRampToValueAtTime(.001,now+.45);osc.connect(gain).connect(audioContext.destination);osc.start(now);osc.stop(now+.5);
 }).catch(()=>{});
}
function beginDemo(){if(!room)return;selected='N011';task=0;render();presentation.start();}
document.addEventListener('click',e=>{hasInteracted=true;if(!e.target.closest('#demo-controls'))presentation.stop();},true);
document.addEventListener('pointerdown',e=>{hasInteracted=true;if(!e.target.closest('#demo-controls'))presentation.stop();},true);
document.addEventListener('keydown',e=>{hasInteracted=true;if(!e.target.closest('#demo-controls'))presentation.stop();},true);
document.addEventListener('visibilitychange',()=>{if(document.hidden)presentation.stop('已暂停');});
const current=()=>interactions.find(n=>n.id===selected);
const isExample=()=>selected==='N011';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function button(label,fn,active=false){const b=document.createElement('button');b.textContent=label;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));b.onclick=fn;return b;}
function modal(html){$('#modal-body').innerHTML=html;$('#modal').showModal();}
$('#close-modal').onclick=()=>$('#modal').close();
$('#modal').onclick=e=>{if(e.target===$('#modal'))$('#modal').close();};
function renderScenes(){ $('#scenes').replaceChildren(...scenes.map((name,i)=>button(name+(i?' · 待完善':''),()=>{sceneIndex=i;$('#scene-title').textContent=name;$('#scene-summary').textContent=i?'场景表达策略 · 待完善':'从自然醒来，到舒适就绪。';$('#workspace').hidden=!!i;$('#empty-scene').hidden=!i;$('#scene-detail').hidden=!!i;renderScenes();if(!i)requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));},i===sceneIndex))); }
$('#back-morning').onclick=()=>$('#scenes button').click();
function group(index,total){return index<2?'初始化设置':index<total-3?'行为动作':index===total-3?'日志复盘':'迭代优化';}
function selectNode(id){selected=id;moment=0;branch='normal';phase=Math.max(0,['P1','P2','P3'].findIndex(p=>interactions.find(n=>n.id===id).phase?.includes(p)));confirmed=false;editing=false;channel='visual';visual='avatar';render();}
function render(){
 const n=current(),list=interactions.filter(n=>n.task===tasks[task].name),idx=list.findIndex(x=>x.id===selected);
 $('#tasks').replaceChildren(...tasks.map((t,i)=>{const b=button('',()=>{task=i;selectNode(interactions.find(n=>n.task===t.name).id);},i===task);b.innerHTML=`<b>0${i+1}</b>${t.name}`;return b;}));
 $('#task-goal').textContent=tasks[task].goal;$('#task-pain').textContent=tasks[task].pain;
 $('#steps').replaceChildren(...list.map((item,i)=>{const b=button('',()=>selectNode(item.id),item.id===selected);b.innerHTML=`<span>${group(i,list.length)} · ${String(i+1).padStart(2,'0')}</span><strong>${esc(item.name.split('｜')[1])}</strong>`;b.title=item.name;return b;}));
 $('#interaction-label').innerHTML=`交互 ${idx+1} <span class="interaction-stage">/ ${group(idx,list.length)}</span>`;$('#category').textContent=n.category;$('#interaction-title').textContent=n.name.split('｜')[1];$('#interaction-description').textContent=n.description.split('｜').slice(1).join('｜');$('#intervention-text').innerHTML=isExample()?'<ol class="intervention-points"><li>理解语音需求，关联已授权的可用设备。</li><li>结合偏好与常用方案，推荐唤醒顺序和强度。</li><li>解释推荐理由，邀请用户确认并体验。</li><li>根据用户反馈，提出方案调整建议。</li><li>识别缺项与冲突，追问或提供替代方案。</li></ol>':esc(n.intervention);
 const phases=['信任建立期','协作磨合期','成熟托管期'];$('#phases').replaceChildren(...phases.map((p,i)=>{const b=button(p,()=>{phase=i;renderMoment();},i===phase);b.disabled=!n.phase?.includes('P'+(i+1));b.title=b.disabled?'本交互暂无该阶段方案':p;return b;}));
 $('#basis-content').innerHTML=`<p><strong>用户需求</strong>　${esc(tasks[task].goal)}</p><p><strong>边界</strong>　${esc(n.boundary)}</p>${isExample()?'<p><strong>介入过多</strong>　反复追问、长段解释或擅自加入设备，会增加配置负担；越过授权与家庭免扰规则，还可能打扰伴侣、削弱信任。</p><p><strong>介入不足</strong>　不提示关键缺项、规则冲突或未知设备能力，会让用户误以为方案完整可用，导致后续唤醒安排不符合预期。</p>':''}`;
 $('#timeline').hidden=!isExample();$('#timeline').replaceChildren(...['开始配置','草案说明与确认'].map((v,i)=>{const b=button('',()=>{moment=i;branch='normal';editing=false;syncRoom();renderMoment();},moment===i);b.innerHTML=`<small>时间点 ${i+1}</small><span>${v}</span>`;return b;}));
 const activeStep=$('#steps .active');if(activeStep)$('#steps').scrollLeft=Math.max(0,activeStep.offsetLeft-$('#steps').offsetLeft-20);
 syncRoom();renderMoment();
}
function syncRoom(){const n=nodes.find(n=>n.id===selected);if(n)room?.setState({...roomState(n),storyboard:isExample()?'setup':undefined,setupMoment:moment,setupPhase:presentation.running?demoStage:'configure'});room?.setView(task===2?'bath':isExample()?(presentation.running&&demoStage==='overview'?'overview':'focusInput'):'bed');$('#scene-time').textContent=isExample()?'首次配置':n?.time||'任务情境';$('#scene-stage').textContent=isExample()?'中控屏前配置唤醒安排':current().name.split('｜')[1];document.querySelectorAll('[data-view]').forEach(b=>{const active=b.dataset.view===(presentation.running&&demoStage==='overview'?'overview':'focus');b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});renderDemo();$('#room-caption').textContent=isExample()?'用户走到中控屏前进行配置；右侧展示对应 App 内容。':'原版设备与人物情境示意 · 时间点表现待细化';}
function renderMoment(){
 renderSceneMedia();
 const example=isExample(),fault=branch!=='normal';
 $('#timeline').querySelectorAll('button').forEach((b,i)=>{b.classList.toggle('active',i===moment);b.setAttribute('aria-pressed',String(i===moment));});
 $('#phases').querySelectorAll('button').forEach((b,i)=>{b.classList.toggle('active',i===phase);b.setAttribute('aria-pressed',String(i===phase));});
 $('#branches').hidden=!example||moment===0;
 $('#branches').innerHTML='<label for="branch-select">情况演示</label><select id="branch-select">'+[['exceptions','异常处理 · 3 项'],['normal','正常情况 · 草案生成']].map(([v,t])=>'<option value="'+v+'" '+((fault?'exceptions':'normal')===v?'selected':'')+'>'+t+'</option>').join('')+'</select>'+(fault?'<div class="exception-tabs" role="group" aria-label="异常处理中的问题">'+Object.entries(faults).map(([id,f],i)=>'<button data-fault="'+id+'" aria-pressed="'+(id===branch)+'" class="'+(id===branch?'active':'')+'">'+(i+1)+' '+f.title+'</button>').join('')+'</div>':'');$('#branch-select').onchange=e=>{branch=e.target.value==='exceptions'?'missing':'normal';renderMoment();};document.querySelectorAll('[data-fault]').forEach(b=>b.onclick=()=>{branch=b.dataset.fault;renderMoment();});
 $('#moment-title').textContent=!example?'交互信息已收录，表达设计待补充':moment===0?'描述偏好与权限':fault?{missing:'补齐会影响方案的关键项',conflict:'先确认家庭免扰边界',device:'说明暂不可确认的设备'}[branch]:confirmed?'草案已确认，准备进入联测':'草案已生成，等待你的确认';
 $('#carrier').textContent=example?'当前载体 · App':'任务载体见原有材料';
 $('#moment-note').textContent=!example?'保留原表信息，后续逐交互补充时间点与设计。':moment===0?'先复用已有信息，只补充影响安排的偏好与权限。':fault?'条件分支：处理后更新草案；不视为所有用户必经步骤。':'卡片与草案说明同步出现；说明结束后保持静默，等待用户操作。';
 $('#story-number').textContent=String(moment+1).padStart(2,'0');$('#user-story').textContent=!example?current().description:moment===0?'用户走到中控屏前，唤醒管家并描述起床时间、偏好与权限。':fault?'用户查看具体问题，补充信息或确认本次可用范围。':confirmed?'用户确认本次草案，接下来核验设备能力与执行回执。':'用户在中控屏前核对唤醒安排，选择确认、调整或稍后处理。';
 $('#channels').replaceChildren(...[['visual','视觉'],['audio','听觉'],['haptic','触觉']].map(([v,t])=>{const b=button(t,()=>{channel=v;renderChannel();},channel===v);if(v==='haptic'&&example){b.disabled=true;b.title='本交互不使用触觉反馈'};return b;}));
 $('#next').innerHTML=(example&&moment===0?'下一时间点':'下一交互')+icon('arrow-right');renderChannel();
}
function renderChannel(){
 document.querySelectorAll('#channel-content audio').forEach(a=>{a.pause();a.currentTime=0;});
 if(isExample()&&moment===0&&visual==='cards')visual='avatar';
 $('#channels').querySelectorAll('button').forEach((b,i)=>{const yes=['visual','audio','haptic'][i]===channel;b.classList.toggle('active',yes);b.setAttribute('aria-pressed',String(yes));});
 $('#visual-tabs').hidden=channel!=='visual'||!isExample();$('#visual-tabs').replaceChildren(...[['avatar','管家形象'],['cards','信息卡片'],['lights','灯光灯效']].map(([v,t])=>{const b=button(t,()=>{visual=v;renderChannel();},v===visual);if(v==='cards'&&moment===0){b.disabled=true;b.title='此时间点尚未生成卡片';}if(v==='lights'){b.disabled=true;b.textContent='灯光光效';b.title='本交互不使用灯光光效';}return b;}));
 const area=$('#channel-content');
 if(presentation.running&&['overview','walking','request'].includes(demoStage)){area.innerHTML=`<p class="channel-note">${demoStage==='overview'?'先概览参与本次唤醒安排的终端。':demoStage==='request'?'用户正在向管家描述起床时间、偏好与权限。':'用户走向中控屏，镜头逐渐聚焦。'}聚焦后同步呈现管家、卡片与声音。</p>`;return;}
 if(!isExample()){area.innerHTML=`<div class="no-channel"><h3>${['信任建立期','协作磨合期','成熟托管期'][phase]}</h3><p>该交互的${{visual:'视觉',audio:'听觉',haptic:'触觉'}[channel]}细化方案待补充。</p></div><p class="source-note">原表：${esc(current().source)}。本页尚未将旧版话术与动效作为新方案接入。</p>`;return;}
 if(channel==='haptic'||visual==='lights'&&channel==='visual'){area.innerHTML=`<div class="no-channel"><h3>本交互不使用${channel==='haptic'?'触觉反馈':'实体灯光灯效'}</h3><p>配置阶段通过 App 呈现草案与选择，不触发床体、手表或灯具进行唤醒。实际设备响应留在后续联测与执行交互。</p></div>`;return;}
 if(channel==='audio'){renderAudio();return;}
 if(visual==='avatar'){renderAvatar();return;}renderPhone();
}
function renderPhone(){
 if(branch!=='normal'){$('#channel-content').innerHTML='<figure class="card-example"><div class="card-image"><img src="./media/cards/exceptions.svg" alt="三项异常合并卡片"></div><figcaption>方案生成异常 · 关键缺项、家庭规则冲突、设备能力未知</figcaption></figure>';return;}
 if(moment===0){$('#channel-content').replaceChildren();return;}
 $('#channel-content').innerHTML=`<p class="card-carrier">载体：中控屏 / App</p>
 <figure class="card-example"><div class="card-image"><img src="./media/cards/wakeup-draft.svg" alt="渐进唤醒草案：目标起床时间、唤醒顺序、触发条件、待确认状态"></div><figcaption><h4><span class="card-index">01</span>渐进唤醒方案卡</h4><p><b>功能</b> 查看起床时间、唤醒顺序、触发条件与当前状态；支持确认草案、调整时间／方式／强度，或稍后处理。</p></figcaption></figure>
 <figure class="card-example"><div class="card-image"><img src="./media/cards/rules-scope.svg" alt="规则与设备范围：个人偏好、家庭免扰、参与设备、暂不可确认设备"></div><figcaption><h4><span class="card-index">02</span>规则与设备范围卡</h4><p><b>功能</b> 使用者核对个人偏好，管理者查看家庭免扰和设备范围；发现冲突时调整规则或查看详情。与方案卡同时出现，无冲突时可默认收起。</p></figcaption></figure>`;
}

function saveInputs(){if($('#wake-input'))clock=$('#wake-input').value||clock;if($('#sound-input'))soundAllowed=$('#sound-input').checked;if($('#watch-input'))watchAllowed=$('#watch-input').checked;}
function renderAudio(){const speech=moment===0?'':({missing:'声音提醒还没有设置，要加入吗？',conflict:'声音提醒与家庭免扰规则冲突，本次先不使用卧室音箱。',device:'目前无法确认手表是否支持震动唤醒，这一项暂不加入。'}[branch]||'我根据你的起床时间和唤醒偏好，整理了一套渐进唤醒安排，确认后再启用。');
 $('#channel-content').innerHTML=`<div class="audio-block"><h4>音效 · ${moment===0?'进入配置':'草案生成完成'}</h4><p>终端：App／中控屏${moment===0?'／音箱':''}</p><p>${moment===0?'一次短促、柔和的单音，表示已进入交互状态。':'一次轻提示音，表示草案已生成，不使用执行成功音。'}</p><small>提示音素材待接入。</small></div>${speech?`<div class="audio-block"><h4>话术 · ${moment===0?'用户输入':branch==='normal'?'草案说明':'条件分支'}</h4><p>${esc(speech)}</p>${{normal:"draft",missing:"missing",device:"device"}[branch]?`<audio controls preload="metadata" aria-label="播放本段话术" src="./media/voice/${{normal:"draft",missing:"missing",device:"device"}[branch]}.mp3"></audio>`:""}<small>语气：清晰、平稳、从容；说明结束后静默等待。${branch==='conflict'?'冲突话术为根据PDF规则补充的设计提案。':''}</small></div>`:''}`;
}
function avatarMarkup(){return `<div class="live-avatar" data-shape="${shape}" data-state="${moment?'speaking':'listening'}" aria-label="AI 管家动态占位"><div class="avatar-light"></div><div class="glass-layer"></div><span>AI 管家 · ${moment?'说明与等待':'聆听与整理'}</span><small>动效占位</small></div>`;}
function inlineAudio(){const file=branch==='normal'?'draft':faults[branch]?.voice;return `<div class="synced-audio"><span>${file?'对应话术':'提示音占位 · 正式话术待补充'}</span>${file?`<audio controls preload="metadata" aria-label="播放对应话术" src="./media/voice/${file}.mp3"></audio>`:''}</div>`;}
function renderAvatar(){const state=moment===0?'processing':branch!=='normal'?'statement':'waiting';const names={processing:'聆听 → 处理中',statement:'陈述说明 → 等待回应',waiting:'陈述说明 → 等待回应'};const asset=motionAssets[shape].states[state];
 $('#channel-content').innerHTML=`<div id="shape-tabs" class="subtabs"></div><div class="avatar-slot" data-motion-style="${shape}" data-motion-state="${state}">${avatarMarkup()}</div><p class="semantic-path">${moment===0?'待机 → 入场 → 聆听 → 处理中':branch==='normal'?'处理中 → 陈述说明 → 等待回应 → 返回待机':'处理中 → 问题说明 → 等待回应 → 更新草案'}</p>`;
 $('#shape-tabs').replaceChildren(...[['line','Dynamic Line'],['glass','Layered Glass']].map(([v,t])=>button(t,()=>{shape=v;renderAvatar();},shape===v)));
 if(asset?.src){const v=document.createElement('video');v.muted=true;v.loop=true;v.controls=true;v.playsInline=true;v.poster=asset.poster||'';for(const [src,type] of [[asset.src,'video/webm'],[asset.fallback,'video/mp4']])if(src){const s=document.createElement('source');s.src=src;s.type=type;v.append(s);}$('.avatar-slot').replaceChildren(v);}
}
$('#next').onclick=()=>{if(isExample()&&moment===0){moment=1;syncRoom();renderMoment();return;}const list=interactions.filter(n=>n.task===tasks[task].name),i=list.findIndex(n=>n.id===selected);if(i<list.length-1)selectNode(list[i+1].id);else modal('<h2>已到本任务最后一个交互</h2><p>可以切换其他任务，继续查看表达策略。</p>');};
$('#replay').onclick=()=>{confirmed=false;editing=false;syncRoom();renderMoment();};
$('#competitor').onclick=()=>modal(`<h2>竞品策略 · 待补充</h2><p>当前表达类别：${esc(current().category)}</p><p>此处预留竞品在相同沟通目的下的介入方式、视听触表现与来源资料。</p>`);
$('#catalog-button').onclick=()=>{const list=interactions.filter(n=>n.task===tasks[task].name);modal(`<h2>${tasks[task].name} · ${list.length} 个交互</h2><div class="catalog-list">${list.map((n,i)=>`${i===0||group(i,list.length)!==group(i-1,list.length)?`<h3>${group(i,list.length)}</h3>`:''}<button data-node="${n.id}">${esc(n.name)}<small>${n.id} · ${n.id==='N011'?'完整设计示例':'表达待细化'}</small></button>`).join('')}</div>`);document.querySelectorAll('[data-node]').forEach(b=>b.onclick=()=>{selectNode(b.dataset.node);$('#modal').close();});};
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{const view=b.dataset.view==='focus'?(isExample()?(moment===0?'focusInput':'focusConfirm'):task===2?'bath':'bed'):b.dataset.view;room?.setView(view);document.querySelectorAll('[data-view]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});});
function fitSceneCards(){
 const media=$('#scene-media');if(!media||media.hidden)return;
 const cards=[...media.querySelectorAll('.scene-cards img')];if(!cards.length)return;
 const ratios=cards.map(img=>img.naturalWidth?img.naturalHeight/img.naturalWidth:.76);
 const available=media.clientHeight-66-Math.max(0,cards.length-1)*8;
 const width=Math.max(1,Math.min(media.clientWidth,available/ratios.reduce((a,b)=>a+b,0)));
 cards.forEach(img=>{img.style.width=width+'px';});
}
function renderSceneMedia(){
 const media=$('#scene-media');if(!media)return;
 media.hidden=!isExample()||['overview','walking','request'].includes(demoStage)&&presentation.running;
 if(media.hidden){$('#scene-subtitle').textContent='';return;}
 const fault=faults[branch];
 const caseId=moment?(fault?'exception':'normal'):null;
 if(caseId&&caseId!==lastCase){$('.room-frame').classList.remove('scene-cut');void $('.room-frame').offsetWidth;$('.room-frame').classList.add('scene-cut');}lastCase=caseId;
 $('#scene-subtitle').textContent=moment?(fault?fault.detail:'我根据你的起床时间和唤醒偏好，整理了一套渐进唤醒安排，确认后再启用。'):'';
 media.innerHTML=avatarMarkup()+(moment?(fault?'<div class="scene-cards"><img src="./media/cards/exceptions.svg" alt="方案生成异常：关键缺项、家庭规则冲突、设备能力未知"></div>':'<div class="scene-cards"><img src="./media/cards/wakeup-draft.svg" alt="渐进唤醒方案卡"><img src="./media/cards/rules-scope.svg" alt="规则与设备范围卡"></div>'):'');
 media.querySelectorAll('img').forEach(img=>img.addEventListener('load',fitSceneCards,{once:true}));requestAnimationFrame(fitSceneCards);
}
function updatePlayer(){
 const b=$('#demo-play');if(!b)return;
 const label=presentation.running?'暂停':'播放';b.innerHTML=icon(presentation.running?'pause':'play');b.title=label;b.setAttribute('aria-label',label);
 $('#demo-sound').innerHTML=icon(demoMuted?'volume-x':'volume-2');$('#demo-sound').title=soundBlocked?'点击开启声音并继续':demoMuted?'开启声音':'静音';$('#demo-sound').setAttribute('aria-label',soundBlocked?'开启声音并继续':demoMuted?'开启声音':'静音');$('#demo-sound').setAttribute('aria-pressed',String(!demoMuted));
 if(!draggingProgress)$('#demo-progress').value=Math.min(presentation.total,presentation.elapsed);
 document.body.classList.toggle('demo-running',presentation.running);
}
const subtitle=document.createElement('p');subtitle.id='scene-subtitle';subtitle.setAttribute('aria-live','polite');$('.room-frame').append(subtitle);
const sceneMedia=document.createElement('aside');sceneMedia.id='scene-media';sceneMedia.setAttribute('aria-label','当前时间点视听呈现');$('.room-frame').append(sceneMedia);new ResizeObserver(fitSceneCards).observe(sceneMedia);
const demoControls=document.createElement('div');demoControls.id='demo-controls';let elapsed=0;const marks=sequence.map(stage=>{const mark='<i title="'+stage.label+'" style="left:'+(elapsed/presentation.total*100)+'%"></i>';elapsed+=stage.duration;return mark;}).join('');demoControls.innerHTML='<span id="demo-status" hidden></span><div class="seek-track"><div class="seek-marks" aria-hidden="true">'+marks+'</div><input id="demo-progress" type="range" aria-label="播放进度" min="0" max="'+presentation.total+'" step="100" value="0"></div><button id="demo-play" aria-label="暂停"></button><button id="demo-restart" title="重播" aria-label="重播">'+icon('rotate-ccw')+'</button><button id="demo-sound" aria-label="静音"></button>';$('.room-frame').append(demoControls);
$('#demo-progress').addEventListener('pointerdown',()=>draggingProgress=true);
$('#demo-progress').addEventListener('input',e=>{presentation.seek(Number(e.target.value));updatePlayer();});
window.addEventListener('pointerup',()=>draggingProgress=false);
$('#demo-restart').onclick=beginDemo;
$('#demo-sound').onclick=()=>{if(soundBlocked){demoMuted=false;soundBlocked=false;presentation.resume();room?.resumeStoryboard?.();}else demoMuted=!demoMuted;if(!demoMuted){audioContext??=new (window.AudioContext||window.webkitAudioContext)();audioContext.resume();}if(demoAudio){demoAudio.muted=demoMuted;if(presentation.running)playNarration();}if(demoMuted)audioContext?.suspend();updatePlayer();};
$('#demo-play').onclick=()=>{if(presentation.running)presentation.stop();else {presentation.resume();room?.resumeStoryboard?.();if(demoAudio&&!presentation.completed)playNarration();}updatePlayer();};
$('.room-frame').addEventListener('mouseleave',()=>{if($('#demo-controls').contains(document.activeElement))document.activeElement.blur();});
setInterval(updatePlayer,200);updatePlayer();
renderScenes();render();
try{const {createRoom}=await import('./scene.js');room=createRoom($('#scene'),$('#hotspots'),id=>{const n=nodes.find(n=>n.id===selected),s=roomState(n);modal(`<h2>${esc(({bed:'智能床',radar:'毫米波雷达',panel:'4寸中控屏',app:'App（手机）',lamp:'灯光',speaker:'音箱'}[id]||deviceNames[id]))}</h2><p>${esc(s.devices[id]||'配置阶段仅核对参与范围，不执行唤醒。')}</p><p class="source-note">三维设备状态为演示预置，不代表真实回执。</p>`);});syncRoom();if(!hasInteracted)presentation.start();}catch(e){console.error('Room unavailable',e);$('#scene-error').hidden=false;}
