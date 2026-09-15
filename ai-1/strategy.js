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
 $('#interaction-label').textContent=`交互 ${idx+1} / ${group(idx,list.length)}`;$('#category').textContent=n.category;$('#interaction-title').textContent=n.name.split('｜')[1];$('#interaction-description').textContent=n.description.split('｜').slice(1).join('｜');$('#intervention-text').textContent=n.intervention;
 const phases=['信任建立期','协作磨合期','成熟托管期'];$('#phases').replaceChildren(...phases.map((p,i)=>{const b=button(p,()=>{phase=i;renderMoment();},i===phase);b.disabled=!n.phase?.includes('P'+(i+1));b.title=b.disabled?'本交互暂无该阶段方案':p;return b;}));
 $('#basis-content').innerHTML=`<p><strong>用户需求</strong>　${esc(tasks[task].goal)}</p>${isExample()?'<p><strong>介入方式</strong>　先利用已有偏好和设备能力整理草案。使用者确认个人偏好；管理者确认家庭免扰、共享设备和授权范围。</p><p><strong>表达方式</strong>　睿智：整合信息提供有依据的安排。稳重：视听从容，不突然抢注意力。严谨：区分草案、待确认、执行与完成。理性：说明必要依据，提供选择。</p>':''}<p><strong>边界</strong>　${esc(n.boundary)}</p><p class="source-note">原有依据：场景拆解表 V4 · ${esc(n.source)} · ${n.id}。${isExample()?'时序与多通道设计参考《设计呈现.pdf》；时间点编号为本页整理。':'当前展示原有交互信息，细化的时间点与多通道素材待补充。'}</p>`;
 $('#timeline').hidden=!isExample();$('#timeline').replaceChildren(...['开始配置','草案说明与确认'].map((v,i)=>{const b=button('',()=>{moment=i;branch='normal';editing=false;syncRoom();renderMoment();},moment===i);b.innerHTML=`<small>0${i+1}</small><span>${v}</span>`;return b;}));
 const activeStep=$('#steps .active');if(activeStep)$('#steps').scrollLeft=Math.max(0,activeStep.offsetLeft-$('#steps').offsetLeft-20);
 syncRoom();renderMoment();
}
function syncRoom(){const n=nodes.find(n=>n.id===selected);if(n)room?.setState({...roomState(n),storyboard:isExample()?'setup':undefined,setupMoment:moment});room?.setView(task===2?'bath':isExample()?'setup':'bed');$('#scene-time').textContent=isExample()?'首次配置':n?.time||'任务情境';$('#scene-stage').textContent=isExample()?'中控屏前配置唤醒安排':current().name.split('｜')[1];$('#room-caption').textContent=isExample()?'用户走到中控屏前进行配置；右侧展示对应 App 内容。':'原版设备与人物情境示意 · 时间点表现待细化';}
function renderMoment(){
 const example=isExample(),fault=branch!=='normal';
 $('#timeline').querySelectorAll('button').forEach((b,i)=>{b.classList.toggle('active',i===moment);b.setAttribute('aria-pressed',String(i===moment));});
 $('#phases').querySelectorAll('button').forEach((b,i)=>{b.classList.toggle('active',i===phase);b.setAttribute('aria-pressed',String(i===phase));});
 $('#branches').hidden=!example||moment===0;
 $('#branches').innerHTML='<label for="branch-select">当前情况</label><select id="branch-select">'+[['normal','常规 · 草案生成'],['missing','异常 · 关键缺项'],['conflict','异常 · 家庭规则冲突'],['device','异常 · 设备能力未知']].map(([v,t])=>'<option value="'+v+'" '+(branch===v?'selected':'')+'>'+t+'</option>').join('')+'</select>';$('#branch-select').onchange=e=>{branch=e.target.value;confirmed=false;editing=false;renderMoment();};
 $('#moment-title').textContent=!example?'交互信息已收录，表达设计待补充':moment===0?'描述偏好与权限':fault?{missing:'补齐会影响方案的关键项',conflict:'先确认家庭免扰边界',device:'说明暂不可确认的设备'}[branch]:confirmed?'草案已确认，准备进入联测':'草案已生成，等待你的确认';
 $('#carrier').textContent=example?'当前载体 · App':'任务载体见原有材料';
 $('#moment-note').textContent=!example?'保留原表信息，后续逐交互补充时间点与设计。':moment===0?'先复用已有信息，只补充影响安排的偏好与权限。':fault?'条件分支：处理后更新草案；不视为所有用户必经步骤。':'卡片与草案说明同步出现；说明结束后保持静默，等待用户操作。';
 $('#story-number').textContent=String(moment+1).padStart(2,'0');$('#user-story').textContent=!example?current().description:moment===0?'用户走到中控屏前，唤醒管家并描述起床时间、偏好与权限。':fault?'用户查看具体问题，补充信息或确认本次可用范围。':confirmed?'用户确认本次草案，接下来核验设备能力与执行回执。':'用户在中控屏前核对唤醒安排，选择确认、调整或稍后处理。右侧为对应 App 呈现。';
 $('#channels').replaceChildren(...[['visual','视觉'],['audio','听觉'],['haptic','触觉']].map(([v,t])=>{const b=button(t,()=>{channel=v;renderChannel();},channel===v);if(v==='haptic'&&example){b.disabled=true;b.title='本交互不使用触觉反馈'};return b;}));
 $('#next').textContent=example&&moment===0?'下一时间点 →':'下一交互 →';renderChannel();
}
function renderChannel(){
 $('#channels').querySelectorAll('button').forEach((b,i)=>{const yes=['visual','audio','haptic'][i]===channel;b.classList.toggle('active',yes);b.setAttribute('aria-pressed',String(yes));});
 $('#visual-tabs').hidden=channel!=='visual'||!isExample();$('#visual-tabs').replaceChildren(...[['avatar','管家形象'],['cards','信息卡片'],['lights','灯光灯效']].map(([v,t])=>{const b=button(t,()=>{visual=v;renderChannel();},v===visual);if(v==='lights'){b.disabled=true;b.textContent='灯光光效';b.title='本交互不使用灯光光效';}return b;}));
 const area=$('#channel-content');
 if(!isExample()){area.innerHTML=`<div class="no-channel"><h3>${['信任建立期','协作磨合期','成熟托管期'][phase]}</h3><p>该交互的${{visual:'视觉',audio:'听觉',haptic:'触觉'}[channel]}细化方案待补充。</p></div><p class="source-note">原表：${esc(current().source)}。本页尚未将旧版话术与动效作为新方案接入。</p>`;return;}
 if(channel==='haptic'||visual==='lights'&&channel==='visual'){area.innerHTML=`<div class="no-channel"><h3>本交互不使用${channel==='haptic'?'触觉反馈':'实体灯光灯效'}</h3><p>配置阶段通过 App 呈现草案与选择，不触发床体、手表或灯具进行唤醒。实际设备响应留在后续联测与执行交互。</p></div>`;return;}
 if(channel==='audio'){renderAudio();return;}
 if(visual==='avatar'){renderAvatar();return;}renderPhone();
}
function renderPhone(){
 if(moment===0){$('#channel-content').replaceChildren();return;}
 $('#channel-content').innerHTML=`<p class="card-carrier">载体：中控屏 / App</p>
 <figure class="card-example"><div class="card-crop card-draft"><img src="./media/cards/wakeup-cards-v2.png" alt="渐进唤醒草案：目标起床时间、唤醒顺序、触发条件、待确认状态"></div><figcaption><h4>渐进唤醒方案卡</h4><p><b>功能</b> 查看起床时间、唤醒顺序、触发条件与当前状态；支持确认草案、调整时间／方式／强度，或稍后处理。</p></figcaption></figure>
 <figure class="card-example"><div class="card-crop card-rules"><img src="./media/cards/wakeup-cards-v2.png" alt="规则与设备范围：个人偏好、家庭免扰、参与设备、暂不可确认设备"></div><figcaption><h4>规则与设备范围卡</h4><p><b>功能</b> 使用者核对个人偏好，管理者查看家庭免扰和设备范围；发现冲突时调整规则或查看详情。与方案卡同时出现，无冲突时可默认收起。</p></figcaption></figure>`;
}

function saveInputs(){if($('#wake-input'))clock=$('#wake-input').value||clock;if($('#sound-input'))soundAllowed=$('#sound-input').checked;if($('#watch-input'))watchAllowed=$('#watch-input').checked;}
function renderAudio(){const speech=moment===0?'':({missing:'声音提醒还没有设置，要加入吗？',conflict:'声音提醒与家庭免扰规则冲突，本次先不使用卧室音箱。',device:'目前无法确认手表是否支持震动唤醒，这一项暂不加入。'}[branch]||'我根据你的起床时间和唤醒偏好，整理了一套渐进唤醒安排，确认后再启用。');
 $('#channel-content').innerHTML=`<div class="audio-block"><h4>音效 · ${moment===0?'进入配置':'草案生成完成'}</h4><p>终端：App／中控屏${moment===0?'／音箱':''}</p><p>${moment===0?'一次短促、柔和的单音，表示已进入交互状态。':'一次轻提示音，表示草案已生成，不使用执行成功音。'}</p><small>提示音素材待接入。</small></div>${speech?`<div class="audio-block"><h4>话术 · ${moment===0?'用户输入':branch==='normal'?'草案说明':'条件分支'}</h4><p>${esc(speech)}</p><small>语气：清晰、平稳、从容；说明结束后静默等待。${branch==='conflict'?'冲突话术为根据PDF规则补充的设计提案。':''}</small></div>`:''}`;
}
function renderAvatar(){const state=moment===0?'processing':branch!=='normal'?'statement':'waiting';const names={processing:'聆听 → 处理中',statement:'陈述说明 → 等待回应',waiting:'陈述说明 → 等待回应'};const asset=motionAssets[shape].states[state];
 $('#channel-content').innerHTML=`<div id="shape-tabs" class="subtabs"></div><div class="avatar-slot" data-motion-style="${shape}" data-motion-state="${state}"><span>${shape==='line'?'Dynamic Line':'Layered Glass'}</span><small>动画素材待接入 · ${names[state]}</small></div><p class="semantic-path">${moment===0?'待机 → 入场 → 聆听 → 处理中':branch==='normal'?'处理中 → 陈述说明 → 等待回应 → 返回待机':'处理中 → 问题说明 → 等待回应 → 更新草案'}</p><p class="channel-note">${shape==='line'?'固定竖向光带。生成完成时，右侧光场延伸、边缘趋清晰，轻微回弹后稳定；说明结束后柔和收束，降低亮度等待。':'以层叠玻璃为基础。生成完成时拉开层距；说明结束后收拢，中间层缩小，保持等待状态。退出时层片合拢并轻微回弹。'}</p><p class="source-note">形态与过渡依据《设计呈现》；此处仅预留素材与时序接口，暂无正式动画。</p>`;
 $('#shape-tabs').replaceChildren(...[['line','边缘光效'],['glass','层叠玻璃']].map(([v,t])=>button(t,()=>{shape=v;renderAvatar();},shape===v)));
 if(asset?.src){const v=document.createElement('video');v.muted=true;v.loop=true;v.controls=true;v.playsInline=true;v.poster=asset.poster||'';for(const [src,type] of [[asset.src,'video/webm'],[asset.fallback,'video/mp4']])if(src){const s=document.createElement('source');s.src=src;s.type=type;v.append(s);}$('.avatar-slot').replaceChildren(v);}
}
$('#next').onclick=()=>{if(isExample()&&moment===0){moment=1;syncRoom();renderMoment();return;}const list=interactions.filter(n=>n.task===tasks[task].name),i=list.findIndex(n=>n.id===selected);if(i<list.length-1)selectNode(list[i+1].id);else modal('<h2>已到本任务最后一个交互</h2><p>可以切换其他任务，继续查看表达策略。</p>');};
$('#replay').onclick=()=>{confirmed=false;editing=false;syncRoom();renderMoment();};
$('#competitor').onclick=()=>modal(`<h2>竞品策略 · 待补充</h2><p>当前表达类别：${esc(current().category)}</p><p>此处预留竞品在相同沟通目的下的介入方式、视听触表现与来源资料。</p>`);
$('#catalog-button').onclick=()=>{const list=interactions.filter(n=>n.task===tasks[task].name);modal(`<h2>${tasks[task].name} · ${list.length} 个交互</h2><div class="catalog-list">${list.map((n,i)=>`${i===0||group(i,list.length)!==group(i-1,list.length)?`<h3>${group(i,list.length)}</h3>`:''}<button data-node="${n.id}">${esc(n.name)}<small>${n.id} · ${n.id==='N011'?'完整设计示例':'表达待细化'}</small></button>`).join('')}</div>`);document.querySelectorAll('[data-node]').forEach(b=>b.onclick=()=>{selectNode(b.dataset.node);$('#modal').close();});};
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>room?.setView(b.dataset.view));
renderScenes();render();
try{const {createRoom}=await import('./scene.js');room=createRoom($('#scene'),$('#hotspots'),id=>{const n=nodes.find(n=>n.id===selected),s=roomState(n);modal(`<h2>${esc(deviceNames[id])}</h2><p>${esc(s.devices[id])}</p><p class="source-note">三维设备状态为演示预置，不代表真实回执。</p>`);});syncRoom();}catch(e){console.error('Room unavailable',e);$('#scene-error').hidden=false;}
