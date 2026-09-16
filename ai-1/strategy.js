import {createPresentation} from './presentation.js';
import {setupSequence,momentNames} from './setup-storyboard.js';
import {setup,moments} from './setup-content.js';
import {dialogue} from './setup-dialogue.js';
import {setupCard,cards,deviceScope} from './setup-cards.js';
import {butler,avatarStates} from './setup-avatar.js';
import {icon} from './icons.js';
import {interactions as sourceInteractions} from './strategy-data.js';
import {nodes} from './nodes.js';
import {roomState,deviceNames} from './room-state.js';
const $=s=>document.querySelector(s);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const manifest=await fetch('./media/setup/manifest.json').then(r=>{if(!r.ok)throw Error('media manifest');return r.json();}).catch(()=>({voices:{},effects:{}}));
const interactions=sourceInteractions.filter(n=>n.id!=='N012').map(n=>n.id==='N011'?{...n,name:'交互1｜'+setup.title,description:'初始化设置｜'+setup.description,boundary:setup.boundary}:n);
const tasks=[{name:'无感唤醒',goal:'在目标时间内温和醒来，尽量不打扰伴侣，并可随时接管。',pain:'固定强度容易突然惊醒或造成干扰，状态误判可能导致漏叫醒或持续打扰。'}, {name:'起床环境就绪',goal:'醒来前环境已经舒适，过程安静且不过早耗能。',pain:'固定定时难以适应天气、开窗和设备状态，容易过早或过晚。'}, {name:'洗漱用水就绪',goal:'到洗漱间时，温度合适的热水已经备好，减少等待。',pain:'水路较长，需要等待冷水放尽；固定定时难以适应实际用水需求。'}];
const scenes=['AI 晨间唤醒','AI 全屋空气托管','AI 辅助烹饪','AI 家庭洗衣房','全屋设备智能管家','全屋安防智能管家'];
let task=0,selected='N011',moment=0,mode='normal',channel='visual',visual='avatar',shape='line',phase=0,includeRepeat=true,room=null,activeShot=null;
let muted=false,soundBlocked=false,mediaError='',hasInteracted=false,mediaRevision=0,dragging=false,fitFrame=0,blockingCase=null,lastPlayerKey='';
const voiceAudio=new Audio(),effectAudio=new Audio();voiceAudio.id='demo-narration';effectAudio.id='demo-effect';voiceAudio.hidden=effectAudio.hidden=true;document.body.append(voiceAudio,effectAudio);
const current=()=>interactions.find(n=>n.id===selected);
const isExample=()=>selected==='N011';
const list=()=>interactions.filter(n=>n.task===tasks[task].name);
const group=(i,total)=>i<(task===0?1:2)?'初始化设置':i<total-3?'行为动作':i===total-3?'日志复盘':'迭代优化';
function button(label,fn,active=false){const b=document.createElement('button');b.textContent=label;b.onclick=fn;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));return b;}
function modal(html){$('#modal-body').innerHTML=html;$('#modal').showModal();}
$('#close-modal').onclick=()=>$('#modal').close();$('#modal').onclick=e=>{if(e.target===$('#modal'))$('#modal').close();};
function silence(){mediaRevision++;voiceAudio.pause();effectAudio.pause();document.querySelectorAll('#channel-content audio').forEach(a=>a.pause());}
const presentation=createPresentation((shot,offset)=>{
 const changed=moment!==shot.moment;activeShot=shot;moment=shot.moment;
 if(changed){channel='visual';visual=moment?'cards':'avatar';}
 renderMoment();applyShot(shot,offset/shot.duration);playShotAudio(shot,offset);updatePlayer();
},reason=>{
 silence();room?.pauseStoryboard?.();document.body.classList.remove('demo-running');
 if(reason==='complete'){$('#scene-subtitle').textContent='';document.querySelectorAll('.butler').forEach(e=>{if(e.dataset.state==='speaking'){e.dataset.state='waiting';e.querySelector('.butler-caption').textContent='等待回应';}});}
 updatePlayer();
},(shot,p,elapsed)=>{
 room?.setStoryboardProgress?.(shot,p);
 const clip=dialogue[shot.voice];$('#scene-subtitle').textContent=clip&&elapsed<(manifest.voices?.[shot.voice]?.duration||shot.duration)?(clip.role==='user'?'用户：':'AI：')+clip.text:'';
 document.body.classList.toggle('demo-running',presentation.running);updatePlayer();
});
function playShotAudio(shot,offset=0){
 silence();mediaError='';const token=mediaRevision;
 for(const [audio,entry,isVoice] of [[voiceAudio,manifest.voices?.[shot.voice],true],[effectAudio,offset<100?manifest.effects?.[shot.effect]:null,false]]){
  if(!entry)continue;audio.src='./media/setup/'+entry.file;audio.muted=muted;audio.volume=isVoice?.9:.65;
  const start=Math.min(offset/1000,Math.max(0,entry.duration/1000-.01));
  if(isVoice&&offset>=entry.duration)continue;
  const position=()=>{if(token===mediaRevision)audio.currentTime=isVoice?start:0;};
  audio.onloadedmetadata=position;audio.onerror=()=>{if(token===mediaRevision){mediaError='音频未加载，可在素材清单中检查';updatePlayer();}};
  if(!presentation.running){audio.load();continue;}
  audio.play().then(()=>{if(token===mediaRevision){soundBlocked=false;updatePlayer();}}).catch(e=>{
   if(token!==mediaRevision||e.name==='AbortError')return;
   if(e.name==='NotAllowedError'&&!muted){soundBlocked=true;presentation.stop('blocked');}
   else{mediaError='音频暂不可用';updatePlayer();}
  });
 }
}
function loadSequence(branch='normal'){mode=branch;if(branch==='normal')blockingCase=null;else if(['conditions','lightFailure','enableFailure'].includes(branch))blockingCase=branch;presentation.setSequence(setupSequence(manifest,includeRepeat,branch));renderProgress();}
function startDemo(branch='normal',at=0){if(!room)return;const adjusted=['adjusted','retry'].includes(activeShot?.card);selected='N011';task=0;loadSequence(branch);if(branch==='direct'&&adjusted)presentation.sequence[0].card='adjusted';renderHeader();presentation.start(at);}
function goMoment(i,play=false){
 silence();loadSequence('normal');moment=i;channel='visual';visual=i?'cards':'avatar';
 const id=['request','recommend','experienceIntro','feedback'][i],index=presentation.sequence.findIndex(s=>s.id===id);
 if(play)presentation.start(index);else presentation.show(index);
}
function replayMoment(){
 if(!isExample()){syncGenericRoom();return;}
 const branch=mode==='normal'?'normal':mode;
 const full=setupSequence(manifest,includeRepeat,branch);const shots=branch==='normal'?full.filter(s=>s.moment===moment&&!['overview','walking','retryUser'].includes(s.id)):full;
 presentation.setSequence(shots);renderProgress();presentation.start();
}
function selectNode(id){presentation.stop();silence();selected=id;moment=0;mode='normal';phase=Math.max(0,['P1','P2','P3'].findIndex(p=>current().phase?.includes(p)));channel='visual';visual='avatar';activeShot=null;renderHeader();if(isExample()){loadSequence();presentation.show(0);}else{renderMoment();syncGenericRoom();}}
function renderHeader(){
 const n=current(),items=list(),idx=items.findIndex(x=>x.id===selected);
 $('#tasks').replaceChildren(...tasks.map((t,i)=>{const b=button('',()=>{task=i;selectNode(interactions.find(n=>n.task===t.name).id);},i===task);b.innerHTML=`<b>0${i+1}</b>${t.name}`;return b;}));
 $('#task-goal').textContent=isExample()?setup.goal:tasks[task].goal;$('#task-pain').textContent=isExample()?setup.pain:tasks[task].pain;
 $('#steps').replaceChildren(...items.map((n,i)=>{const b=button('',()=>selectNode(n.id),n.id===selected);b.innerHTML=`<span>${group(i,items.length)} · ${String(i+1).padStart(2,'0')}</span><strong>${esc(n.name.split('｜')[1])}</strong>`;return b;}));
 $('#interaction-label').innerHTML=`交互 ${idx+1} <span class="interaction-stage">/ ${group(idx,items.length)}</span>`;
 $('#category').textContent=isExample()?'方案推荐 · 体验验证':n.category;
 $('#interaction-title').textContent=isExample()?setup.title:n.name.split('｜')[1];$('#interaction-description').textContent=n.description.split('｜').slice(1).join('｜');
 $('#intervention-text').innerHTML=isExample()?'<ol class="intervention-points">'+setup.points.map(([t,d])=>`<li><strong>${t}</strong><span>${d}</span></li>`).join('')+'</ol>':esc(n.intervention);
 $('#basis-content').innerHTML=`<p><strong>边界</strong>　${esc(n.boundary)}</p>`+(isExample()?setup.risks.map(([t,d])=>`<p><strong>${t}</strong>　${d}</p>`).join(''):'');
 $('#timeline').hidden=!isExample();$('#timeline').replaceChildren(...momentNames.map((t,i)=>{const b=button('',()=>goMoment(i),i===moment);b.innerHTML=`<small>时间点 ${i+1}</small><span>${t}</span>`;return b;}));
 $('#phases').replaceChildren(...['信任建立期','协作磨合期','成熟托管期'].map((t,i)=>{const b=button(t,()=>{phase=i;renderChannel();},i===phase);b.disabled=isExample()?i>0:!n.phase?.includes('P'+(i+1));return b;}));
 $('#demo-controls').hidden=!isExample();$('#scene-options').hidden=!isExample();$('#scene-media').hidden=!isExample();$('#scene-mode').hidden=!isExample();
 const active=$('#steps .active');if(active)$('#steps').scrollLeft=Math.max(0,active.offsetLeft-$('#steps').offsetLeft-20);
}
function renderMoment(){
 const example=isExample(),m=moments[moment];
 $('#timeline').querySelectorAll('button').forEach((b,i)=>{b.classList.toggle('active',i===moment);b.setAttribute('aria-pressed',String(i===moment));});
 $('#story-number').textContent=String(moment+1).padStart(2,'0');
 $('#user-story').textContent=example?mode==='normal'||mode==='direct'?(activeShot?.bubble?dialogue[activeShot.voice]?.text:m.story):'用户查看问题与受影响范围，选择补充、调整或暂不启用。':current().description;
 $('#branches').hidden=!example;
 if(example){
  const alternatives=[['missing','必要信息待补充'],['conditions','条件异常 · 合并说明'],['lightFailure','灯光未响应'],['enableFailure','启用未成功']];
  $('#branches').innerHTML=`<label for="branch-select">情况演示</label><select id="branch-select"><option value="normal">正常流程</option><option value="${alternatives[moment][0]}">${alternatives[moment][1]}</option></select>`;
  $('#branch-select').value=alternatives[moment][0]===mode?mode:'normal';
  $('#branch-select').onchange=e=>{if(e.target.value==='normal')goMoment(moment,true);else{flashCase();startDemo(e.target.value);}};
 }
 $('#channels').replaceChildren(...[['visual','视觉'],['audio','听觉'],['haptic','触觉']].map(([v,t])=>{const b=button(t,()=>{channel=v;renderChannel();},channel===v);if(v==='haptic'&&example){b.disabled=true;b.title='本次初始化只演示灯光与窗帘体验，手表为备用说明';}return b;}));
 $('#next').innerHTML=(example&&moment<3?'下一时间点':'下一交互')+icon('arrow-right');
 renderChannel();renderSceneMedia();
}
const voiceIds=[['request','incomplete','clarify','clarifyReply'],['recommend','choose','backup','conflict'],['experience','retry','lightFailure','stop'],['feedback','adjust','retryUser','confirm','enabled','enableFailure','saved','disabled']];
const paths=['聆听 → 整理需求 → 关联设备','生成方案 → 解释理由 → 等待选择','检查设备 → 灯光体验 → 窗帘体验 → 恢复环境','聆听反馈 → 定向修改 → 可选再体验 → 确认启用'];
function renderChannel(){
 const area=$('#channel-content'),example=isExample(),m=moments[moment];
 $('#channels').querySelectorAll('button').forEach((b,i)=>{b.classList.toggle('active',['visual','audio','haptic'][i]===channel);b.setAttribute('aria-pressed',String(['visual','audio','haptic'][i]===channel));});
 $('#visual-tabs').hidden=channel!=='visual'||!example;
 if(!example){area.innerHTML=`<h3>${['信任建立期','协作磨合期','成熟托管期'][phase]}</h3><p>${esc(current().intervention)}</p><p class="source-note">本交互保留原拆解信息，尚未制作完整分镜。${esc(current().source)}</p>`;return;}
 if(moment===0&&visual==='cards')visual='avatar';if(moment!==2&&visual==='lights')visual='avatar';
 $('#visual-tabs').replaceChildren(...[['avatar','管家形象'],['cards','信息卡片'],['lights','设备体验']].map(([v,t])=>{const b=button(t,()=>{visual=v;renderChannel();},visual===v);b.disabled=v==='cards'&&moment===0||v==='lights'&&moment!==2;return b;}));
 const context=`<section class="setup-context"><h3>${m.title}</h3><p>${m.ai}</p></section>`;
 if(channel==='audio'){
  area.innerHTML=context+`<p class="channel-note">${m.sound}</p>`+voiceIds[moment].map(id=>`<div class="audio-block"><h4>${dialogue[id].role==='user'?'用户':'AI 管家'} · ${esc(id)}</h4><p>${dialogue[id].text}</p><audio controls preload="metadata" data-clip="${id}" src="./media/setup/${manifest.voices?.[id]?.file||id+'.mp3'}" aria-label="播放${dialogue[id].role==='user'?'用户':'AI'}话术"></audio></div>`).join('')+`<details class="setup-rules"><summary>提示音与素材说明</summary>${Object.entries(manifest.effects||{}).map(([id,a])=>`<p>${({enter:'进入提示',generate:'方案生成',complete:'启用完成',exception:'异常提示'})[id]}</p><audio controls preload="metadata" src="./media/setup/${a.file}" aria-label="${id}提示音"></audio>`).join('')}<p>当前为本地合成语音与原创短音，可逐句替换。异常短音在每次异常案例开始时只响一次。</p></details>`;
  area.querySelectorAll('audio').forEach(a=>a.onplay=()=>{presentation.stop();area.querySelectorAll('audio').forEach(b=>{if(b!==a)b.pause();});});return;
 }
 if(visual==='avatar'){
  area.innerHTML=context+'<div id="shape-tabs" class="subtabs"></div>'+butler(shape,activeShot?.state||'waiting')+`<p class="semantic-path">${paths[moment]}</p><div class="avatar-state-picks" aria-label="查看形象状态"></div><p class="channel-note">两套形象使用同一状态语义。聆听时不抢话，说明后柔和收束；异常时保留等待，不提前显示完成。</p>`;
  $('#shape-tabs').replaceChildren(...[['line','Dynamic Line'],['glass','Layered Glass']].map(([v,t])=>button(t,()=>setShape(v),shape===v)));
  $('.avatar-state-picks').replaceChildren(...Object.entries(avatarStates).map(([v,t])=>button(t,()=>{const el=area.querySelector('.butler');el.dataset.state=v;el.querySelector('.butler-caption').textContent=t;el.classList.add('reference-motion');},activeShot?.state===v)));return;
 }
 if(visual==='lights'){
  area.innerHTML=context+`<h4>灯光与窗帘 · 短时体验</h4><p>先让使用者侧灯光柔和渐亮，再让窗帘在受限范围内开启。音箱、智能床与手表不执行。</p><p>反馈后的再体验降低灯光亮度、放慢节奏，窗帘保持原安排。</p><div class="setup-actions"><button data-setup-action="体验一下">播放首次体验</button><button data-setup-action="再次体验">播放调整后体验</button></div><p class="channel-note">模型展示模拟效果，不代表实际亮度、开度或唤醒成功率。</p>`;bindActions();return;
 }
 const card=activeShot?.card||['summary','draft','checking','adjusted'][moment];
 area.innerHTML=context+setupCard(card)+(moment===1?deviceScope():'')+`<p class="source-note">交互设计演示，卡片中的设备状态与启用结果均为预置示例。</p>`;
 bindActions();
}
function setShape(v){shape=v;$('#shape-select').value=v;renderChannel();renderSceneMedia();}
function playFrom(id){loadSequence();const i=presentation.sequence.findIndex(s=>s.id===id);presentation.start(i<0?0:i);}
function bindActions(){document.querySelectorAll('[data-setup-action]').forEach(b=>b.onclick=()=>{
 const a=b.dataset.setupAction;
 if(a==='体验一下'||a==='体验可用设备'){if(mode==='conditions'){const shots=setupSequence(manifest,false).filter(s=>s.moment===2);presentation.setSequence(shots);renderProgress();presentation.start();}else playFrom('experienceIntro');return;}
 if(a==='再次体验'){if(blockingCase){startDemo(blockingCase);return;}includeRepeat=true;$('#include-repeat').checked=true;playFrom('retryIntro');return;}
 if(a==='停止体验'||a==='结束体验'){startDemo('stop');return;}
 if(a==='确认启用'){if(blockingCase){modal('<h2>当前条件尚未解决</h2><p>需要先确认设备、备用与免扰范围，不能直接显示启用成功。可在“情况演示”切回正常流程，查看条件满足时的方案。</p>');return;}startDemo('direct');return;}
 if(a==='停用'){startDemo('disabled');return;}
 if(a==='查看方案'){goMoment(1);return;}
 if(['调整方案','继续调整','返回调整'].includes(a)){showEditor();return;}
 if(a==='仅明天'){startDemo('missing',2);return;}
 if(a==='每个工作日'){modal('<h2>重复安排</h2><p>已选择工作日（演示）。完整主线当前演示“明天一次性唤醒”，工作日版本需另行确认，不会自动启用。</p>');return;}
 if(a==='重新检查'||a==='重试'){startDemo(mode==='enableFailure'?'enableFailure':mode==='conditions'?'conditions':'lightFailure');return;}
});}
function showEditor(){
 modal(`<h2>调整唤醒方案</h2><p>用体验语言调整，也可以直接选择参数。仅修改演示方案，不控制真实设备。</p><form id="setup-editor"><label>灯光体验<select id="edit-light"><option value="gentle">更柔和，渐亮更慢</option><option value="base">保持首次体验</option></select></label><label>窗帘安排<select id="edit-curtain"><option value="keep">保持受限开启</option><option value="closed">保持关闭</option></select></label><p class="channel-note">起床时间、音箱免扰和已授权备用范围不变。</p><button type="submit" class="primary">查看修改后的体验</button></form>`);
 $('#setup-editor').onsubmit=e=>{e.preventDefault();const gentle=$('#edit-light').value==='gentle',closed=$('#edit-curtain').value==='closed';$('#modal').close();includeRepeat=true;$('#include-repeat').checked=true;
  const level=gentle?.19:.30;const shots=setupSequence(manifest,true).filter(s=>['retryIntro','retryLight','retryCurtain','retryEnd'].includes(s.id)).map(s=>({...s,voice:closed||!gentle?undefined:s.voice,duration:s.id==='retryLight'&&!gentle?6500:s.duration,light:s.id==='retryLight'?[.06,level]:s.id==='retryCurtain'?[level,level]:s.id==='retryEnd'?[level,.06]:s.light,curtain:closed?[.03,.03]:s.curtain,card:closed||!gentle?'custom':s.card}));
  cards.custom={title:'自定义体验',status:'体验 · 未启用',rows:[['灯光',gentle?'更柔和，渐亮更慢':'保持首次体验'],['窗帘',closed?'保持关闭':'保持受限开启']],actions:['调整方案','查看方案'],note:'未确认前不启用；返回主线将恢复演示预设'};
  mode='custom';presentation.setSequence(shots);renderProgress();presentation.start();
 };
}
function applyShot(shot,p){
 $('.room-frame').dataset.shot=shot.id;$('#scene-time').textContent='初始化设置';$('#scene-stage').textContent=shot.label;
 if(!room)return;
 const node=nodes.find(n=>n.id==='N011');room.setState({...roomState(node),storyboard:'setup',setupPhase:shot.id,setupMoment:moment,active:['lamp','curtain'],haptic:false});room.setView(shot.view,!presentation.running);room.setStoryboardProgress(shot,p);
 if(!presentation.running)room.pauseStoryboard();
 document.querySelectorAll('[data-view]').forEach(b=>{const active=b.dataset.view===(shot.id==='overview'?'overview':'focus');b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
}
function syncGenericRoom(){const n=nodes.find(n=>n.id===selected);if(n){room?.setState(roomState(n));room?.setView(task===2?'bath':'bed');}$('#scene-time').textContent='任务情境';$('#scene-stage').textContent=current().name.split('｜')[1];$('#scene-subtitle').textContent='';}
function renderSceneMedia(){
 const media=$('#scene-media'),shot=activeShot;
 media.hidden=!isExample()||!shot||['overview','walking'].includes(shot.id);
 if(media.hidden)return;
 media.innerHTML=butler(shape,shot.state,true)+(shot.card?`<div class="scene-card-fit"><div class="scene-card-inner">${setupCard(shot.card,{compact:true})}</div></div>`:'');
 cancelAnimationFrame(fitFrame);fitFrame=requestAnimationFrame(fitSceneCard);
}
function fitSceneCard(){
 const wrap=$('.scene-card-fit'),inner=$('.scene-card-inner');if(!wrap||!inner)return;
 const available=Math.max(60,$('#scene-media').clientHeight-82),natural=inner.scrollHeight;const scale=Math.min(1,available/Math.max(1,natural));
 inner.style.transform=`scale(${scale})`;wrap.style.height=natural*scale+'px';
}
function flashCase(){const frame=$('.room-frame');frame.classList.remove('scene-cut');void frame.offsetWidth;frame.classList.add('scene-cut');}
function renderProgress(){if(!$('#demo-progress'))return;$('#demo-progress').max=presentation.total||1;let offset=0;$('.seek-marks').innerHTML=presentation.sequence.map(s=>{const x=offset/Math.max(1,presentation.total)*100;offset+=s.duration;return `<i style="left:${x}%" title="${s.label}"></i>`;}).join('');}
function updatePlayer(){
 if(!$('#demo-play'))return;const playing=presentation.running;
 if(!dragging)$('#demo-progress').value=presentation.elapsed;
 const key=[playing,muted,soundBlocked,mediaError,activeShot?.id].join('|');if(key===lastPlayerKey)return;lastPlayerKey=key;
 $('#demo-play').innerHTML=icon(playing?'pause':'play');$('#demo-play').setAttribute('aria-label',playing?'暂停':'播放');$('#demo-play').title=playing?'暂停':'播放';
 $('#demo-sound').innerHTML=icon(muted?'volume-x':'volume-2');$('#demo-sound').setAttribute('aria-pressed',String(!muted));$('#demo-sound').setAttribute('aria-label',soundBlocked?'开启声音并继续':muted?'开启声音':'静音');$('#demo-sound').title=soundBlocked?'浏览器需要点击后开启声音':muted?'开启声音':'静音';$('#demo-sound').classList.toggle('sound-blocked',soundBlocked);
 $('#demo-progress').setAttribute('aria-valuetext',activeShot?.label||'全景概览');
 document.body.classList.toggle('demo-running',playing);$('#scene-mode').textContent=mediaError||'交互设计演示';
}
function showMaterials(){
 modal(`<h2>素材清单</h2><p>本版已生成两套实时管家动效、模型分镜、${Object.keys(manifest.voices||{}).length} 句语音和 ${Object.keys(manifest.effects||{}).length} 类短音效。以下内容可以继续替换，不影响当前演示。</p><ul><li><strong>语音：</strong>当前为本地合成音，建议替换为最终品牌音色。逐句文本与文件见听觉页。</li><li><strong>卡片：</strong>当前使用响应式网页组件，完整保留圆角；如需设计师高保真稿，可按现有状态提供 SVG 或源稿。</li><li><strong>管家：</strong>Dynamic Line 与 Layered Glass 已实现全部状态；可用最终品牌动效替换。</li><li><strong>模型：</strong>灯光强度、窗帘开度是演示值，正式设备参数及雷达能力范围需要产品侧确认。</li></ul><p>所有已启用、已响应状态均为设计演示，不连接真实设备。</p><a href="./media/setup/manifest.json" download>下载语音与音效清单</a>`);
}
// Stable controls are kept outside re-rendered scene overlays.
const frame=$('.room-frame');frame.insertAdjacentHTML('beforeend','<p id="scene-subtitle" aria-live="off"></p><aside id="scene-media" aria-label="当前时间点呈现"></aside><span id="scene-mode">交互设计演示</span><div id="demo-controls"><div class="seek-track"><div class="seek-marks" aria-hidden="true"></div><input id="demo-progress" type="range" aria-label="播放进度" min="0" max="1" step="50" value="0"></div><button id="demo-play" aria-label="播放"></button><button id="demo-restart" title="重播完整流程" aria-label="重播完整流程">'+icon('rotate-ccw')+'</button><button id="demo-sound" aria-label="静音"></button></div>');
$('#phases').insertAdjacentHTML('afterend','<div id="scene-options"><label>管家形象<select id="shape-select"><option value="line">Dynamic Line</option><option value="glass">Layered Glass</option></select></label><label class="repeat-option"><input type="checkbox" id="include-repeat" checked>包含再次体验</label><button id="materials">素材清单</button></div>');
$('#materials').onclick=showMaterials;$('#shape-select').onchange=e=>setShape(e.target.value);
$('#include-repeat').onchange=e=>{includeRepeat=e.target.checked;goMoment(moment);};
new ResizeObserver(()=>{cancelAnimationFrame(fitFrame);fitFrame=requestAnimationFrame(fitSceneCard);}).observe($('#scene-media'));
$('#demo-progress').addEventListener('pointerdown',()=>{dragging=true;});$('#demo-progress').addEventListener('input',e=>{presentation.seek(Number(e.target.value));updatePlayer();});window.addEventListener('pointerup',()=>{dragging=false;});
$('#demo-play').onclick=()=>{if(presentation.running)presentation.stop();else presentation.resume();};
$('#demo-restart').onclick=()=>startDemo();
$('#demo-sound').onclick=()=>{if(soundBlocked){muted=false;soundBlocked=false;presentation.resume();}else muted=!muted;voiceAudio.muted=effectAudio.muted=muted;updatePlayer();};
$('#replay').onclick=replayMoment;
$('#next').onclick=()=>{if(isExample()&&moment<3){goMoment(moment+1);return;}const items=list(),i=items.findIndex(n=>n.id===selected);if(items[i+1])selectNode(items[i+1].id);else modal('<h2>已到本任务最后一个交互</h2><p>可以切换其他任务。</p>');};
$('#competitor').onclick=()=>modal('<h2>竞品策略 · 初始化设置</h2><p>依据项目提供的《唤醒场景调研》：语音建场景、可编辑规则、设备测试和状态灯效已是参考基准。</p><h3>本方案重点</h3><p>从用户目标补全设备安排，解释关键理由；将设备响应检查与体感体验结合，按反馈定向修改，减少重复设置。</p><p class="source-note">调研未发现不等于品牌不具备；本演示展示设计目标，不宣称已验证产品优于竞品。</p>');
$('#catalog-button').onclick=()=>{const items=list();modal(`<h2>${tasks[task].name} · 交互路径</h2><div class="catalog-list">${items.map((n,i)=>`${!i||group(i,items.length)!==group(i-1,items.length)?`<h3>${group(i,items.length)}</h3>`:''}<button data-node="${n.id}">${i+1} · ${esc(n.name.split('｜')[1])}<small>${n.id==='N011'?'四时间点完整演示':'原拆解信息，分镜待完善'}</small></button>`).join('')}</div>`);document.querySelectorAll('[data-node]').forEach(b=>b.onclick=()=>{$('#modal').close();selectNode(b.dataset.node);});};
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{room?.setView(b.dataset.view==='focus'?(isExample()?activeShot?.view||'setupInput':task===2?'bath':'bed'):b.dataset.view);document.querySelectorAll('[data-view]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});});
function selectScene(i){presentation.stop();silence();$('#scene-title').textContent=scenes[i];$('#workspace').hidden=!!i;$('#empty-scene').hidden=!i;$('#scene-detail').hidden=!!i;$('#scenes').querySelectorAll('button').forEach((b,j)=>b.classList.toggle('active',i===j));if(!i)window.dispatchEvent(new Event('resize'));}
$('#scenes').replaceChildren(...scenes.map((s,i)=>button(s+(i?' · 待完善':''),()=>selectScene(i),i===0)));$('#back-morning').onclick=()=>selectScene(0);
for(const event of ['pointerdown','click','keydown'])document.addEventListener(event,e=>{hasInteracted=true;if(!e.target.closest('#demo-controls'))presentation.stop();},true);
document.addEventListener('wheel',e=>{if(e.target.closest('.room-frame,.detail-panel'))presentation.stop();},{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden)presentation.stop();});
frame.addEventListener('mouseleave',()=>{if($('#demo-controls').contains(document.activeElement))document.activeElement.blur();});
renderHeader();loadSequence();presentation.show(0);updatePlayer();
try{
 const {createRoom}=await import('./scene.js');
 room=createRoom($('#scene'),$('#hotspots'),id=>{const names={bed:'智能床',radar:'毫米波雷达',panel:'4寸中控屏',app:'App（手机）',lamp:'灯光',speaker:'音箱',watch:'手表',curtain:'窗帘'};modal(`<h2>${esc(names[id]||deviceNames[id])}</h2>${isExample()?deviceScope():`<p>${esc(roomState(nodes.find(n=>n.id===selected)).devices[id]||'设备情境示意')}</p>`}<p class="source-note">模型状态为演示预置，不代表真实设备回执。</p>`);});
 if(!hasInteracted)startDemo();else if(activeShot)applyShot(activeShot,0);
}catch(e){console.error('Room unavailable',e);$('#scene-error').hidden=false;}
