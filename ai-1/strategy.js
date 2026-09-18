import {installCompetitors} from './competitors.js';
import {crossfadeCard,installUIMotion} from './ui-motion.js';
import {audioPresentation} from './audio-presentation.js';
import {presentationNotes} from './presentation-notes.js';
import {momentOverview} from './moment-overview.js';
import {experienceDetails} from './experience-details.js';
import {createPresentation} from './presentation.js';
import {setupSequence,momentNames} from './setup-storyboard.js';
import {setup,moments} from './setup-content.js';
import {dialogue,matchingRecording,speechDuration} from './setup-dialogue.js';
import {explanationFor} from './setup-narrative.js';
import {setupCard,cards,deviceScope} from './setup-cards.js';
import {butlerPair,avatarStates} from './setup-avatar.js';
import {icon} from './icons.js';
import {interactions as sourceInteractions} from './strategy-data.js';
import {buildJourneys} from './journey-content.js';
import {nodes} from './nodes.js';
import {roomState,deviceNames} from './room-state.js';
const $=s=>document.querySelector(s);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const manifest=await fetch('./media/setup/manifest.json').then(r=>{if(!r.ok)throw Error('media manifest');return r.json();}).catch(()=>({voices:{},effects:{}}));
const interactions=buildJourneys(sourceInteractions).map(n=>n.id==='N011'?{...n,name:'交互1｜'+setup.title,description:'初始化设置｜'+setup.description,boundary:setup.boundary}:n);
const tasks=[{name:'无感唤醒',goal:'在目标时间内温和醒来，尽量不打扰伴侣，并可随时接管。',pain:'固定强度容易突然惊醒或造成干扰，状态误判可能导致漏叫醒或持续打扰。'}, {name:'起床环境就绪',goal:'醒来前环境已经舒适，过程安静且不过早耗能。',pain:'固定定时难以适应天气、开窗和设备状态，容易过早或过晚。'}, {name:'洗漱用水就绪',goal:'到洗漱间时，温度合适的热水已经备好，减少等待。',pain:'水路较长，需要等待冷水放尽；固定定时难以适应实际用水需求。'}];
const scenes=['AI 晨间唤醒','AI 全屋空气托管','AI 辅助烹饪','AI 家庭洗衣房','全屋设备智能管家','全屋安防智能管家'];
let task=0,selected='N011',moment=0,mode='normal',channel='visual',visual='avatar',phase=0,includeRepeat=true,room=null,activeShot=null;
let muted=false,soundBlocked=false,mediaError='',hasInteracted=false,mediaRevision=0,dragging=false,fitFrame=0,blockingCase=null,lastPlayerKey='';
const voiceAudio=new Audio(),effectAudio=new Audio();voiceAudio.id='demo-narration';effectAudio.id='demo-effect';voiceAudio.hidden=effectAudio.hidden=true;document.body.append(voiceAudio,effectAudio);
const current=()=>interactions.find(n=>n.id===selected);
const isExample=()=>selected==='N011';
const list=()=>interactions.filter(n=>n.task===tasks[task].name);
const group=i=>['初始化设置','行为动作','日志复盘','迭代优化'][i];
const currentMoments=()=>isExample()?moments:current().moments;
let inspectTimepoint=false;
function button(label,fn,active=false){const b=document.createElement('button');b.textContent=label;b.onclick=fn;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));return b;}
function modal(html){$('#modal-body').innerHTML=html;$('#modal').showModal();}
$('#close-modal').onclick=()=>$('#modal').close();$('#modal').onclick=e=>{if(e.target===$('#modal'))$('#modal').close();};
let narrationPending=false,narrationProgressAt=0,narrationPosition=0;
function silence(){mediaRevision++;narrationPending=false;voiceAudio.pause();effectAudio.pause();document.querySelectorAll('#channel-content audio').forEach(a=>a.pause());}
function narrationFinished(){
 if(!narrationPending)return true;
 if(voiceAudio.ended||voiceAudio.error){narrationPending=false;return true;}
 if(voiceAudio.currentTime>narrationPosition+.01){narrationPosition=voiceAudio.currentTime;narrationProgressAt=performance.now();}
 if(performance.now()-narrationProgressAt>15000){narrationPending=false;mediaError='语音加载超时，可重播本时间点';return true;}
 return false;
}
const presentation=createPresentation((shot,offset)=>{
 const changed=moment!==shot.moment;activeShot=shot;moment=shot.moment;
 if(changed){channel='visual';visual=moment?'cards':'avatar';}
 renderMoment();applyShot(shot,offset/shot.duration);playShotAudio(shot,offset);updatePlayer();
},reason=>{
 silence();room?.pauseStoryboard?.();document.body.classList.remove('demo-running');
 if(reason==='complete'){$('#scene-subtitle').textContent='';document.querySelectorAll('.butler').forEach(e=>{if(e.dataset.state==='speaking'){e.dataset.state='waiting';e.querySelector('.butler-caption').textContent='等待回应';e.closest('.butler-pair').querySelector('.butler-pair-state').textContent='等待回应';}});}
 updatePlayer();
},(shot,p,elapsed)=>{
 room?.setStoryboardProgress?.(shot,p);
 const clip=dialogue[shot.voice];$('#scene-subtitle').textContent=clip&&(narrationPending||elapsed<speechDuration(manifest,shot.voice))?(clip.role==='user'?'用户：':'AI：')+clip.text:'';
 document.body.classList.toggle('demo-running',presentation.running);updatePlayer();
},(current,next)=>inspectTimepoint&&current.moment!==next.moment,narrationFinished);
function playShotAudio(shot,offset=0){
 silence();mediaError='';const token=mediaRevision;
 voiceAudio.removeAttribute('src');voiceAudio.load();
 for(const [audio,entry,isVoice] of [[voiceAudio,matchingRecording(manifest,shot.voice),true],[effectAudio,offset<100?manifest.effects?.[shot.effect]:null,false]]){
  if(!entry)continue;audio.src='./media/setup/'+entry.file;audio.muted=muted;audio.volume=isVoice?.9:.65;audio.defaultPlaybackRate=audio.playbackRate=1;
  const start=Math.min(offset/1000,Math.max(0,entry.duration/1000-.01));
  if(isVoice&&offset>=entry.duration)continue;
  const position=()=>{if(token===mediaRevision)audio.currentTime=isVoice?start:0;};
  audio.onloadedmetadata=position;audio.onerror=()=>{if(token===mediaRevision){if(isVoice)narrationPending=false;mediaError='音频未加载，可重播本时间点';updatePlayer();}};
  if(!presentation.running){audio.load();continue;}
  if(isVoice){narrationPending=true;narrationPosition=start;narrationProgressAt=performance.now();audio.onended=()=>{if(token===mediaRevision)narrationPending=false;};}
  audio.play().then(()=>{if(token===mediaRevision){soundBlocked=false;updatePlayer();}}).catch(e=>{
   if(token!==mediaRevision)return;
   if(isVoice)narrationPending=false;
   if(e.name==='AbortError')return;
   if(e.name==='NotAllowedError'&&!muted){soundBlocked=true;updatePlayer();}
   else{mediaError='音频暂不可用';updatePlayer();}
  });
 }
}
function loadSequence(branch='normal'){mode=branch;if(branch==='normal')blockingCase=null;else if(['conditions','lightFailure'].includes(branch))blockingCase=branch;presentation.setSequence(setupSequence(manifest,includeRepeat,branch));renderProgress();}
function startDemo(branch='normal',at=0){if(!room)return;const adjusted=['adjusted','retry'].includes(activeShot?.card);selected='N011';task=0;loadSequence(branch);if(branch==='direct'&&adjusted)presentation.sequence[0].card='adjusted';renderHeader();presentation.start(at);}
function goMoment(i,play=true){
 inspectTimepoint=true;
 if(!isExample()){moment=i;renderMoment();syncGenericRoom();return;}
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
 const categories=n.categories;
 $('#category').innerHTML=[...new Set(categories)].map(c=>`<span class="category-tag">${esc(c)}</span>`).join('');
 $('#interaction-title').textContent=isExample()?setup.title:n.name.split('｜')[1];$('#interaction-description').textContent=n.description.split('｜').slice(1).join('｜');
 $('#intervention-text').innerHTML='<ol class="intervention-points">'+(isExample()?setup.points:n.points).map(([t,d])=>`<li><strong>${esc(t)}</strong><span>${esc(d)}</span></li>`).join('')+'</ol>';
 $('#basis-content').innerHTML=`<p><strong>边界</strong>　${esc(n.boundary)}</p>`+(isExample()?setup.risks:n.risks).map(([t,d])=>`<p><strong>${esc(t)}</strong>　${esc(d)}</p>`).join('');
 $('#timeline').hidden=false;$('#timeline').replaceChildren(...currentMoments().map((m,i)=>{const b=button('',()=>goMoment(i),i===moment);b.innerHTML=`<small>时间点 ${i+1}</small><span>${m.title}</span>`;return b;}));
 $('#phases').replaceChildren(...['信任建立期','协作磨合期','成熟托管期'].map((t,i)=>{const b=button(t,()=>{phase=i;renderChannel();},i===phase);b.disabled=isExample()?i>0:!n.phase?.includes('P'+(i+1));return b;}));
 $('#demo-controls').hidden=!isExample();$('#scene-media').hidden=!isExample();$('#scene-mode').hidden=!isExample();
 const active=$('#steps .active');if(active)$('#steps').scrollLeft=Math.max(0,active.offsetLeft-$('#steps').offsetLeft-20);
}
function renderMoment(){
 const example=isExample(),m=currentMoments()[moment];
 const overview=momentOverview(example,moment,mode,m);
 $('#moment-overview').innerHTML=`<h3>${esc(overview.title)}</h3><dl><div><dt>用户</dt><dd>${esc(overview.user)}</dd></div><div><dt>AI</dt><dd>${esc(overview.ai)}</dd></div></dl>`;
 const comparisonCard=example?(activeShot?.card||['summary','draft','checking','adjusted'][moment]):null;
 const expressionDesign=[
 '视觉：需求整理卡呈现时间、唤醒偏好和免扰要求，供用户核对。\n听觉：聆听用户表达；只对必要缺项追问。\n设备反馈：此时不执行灯光、窗帘或手表动作。',
 '视觉：方案卡呈现目标时间、设备顺序、备用方式和免扰安排，提供体验、调整与确认入口。\n听觉：AI 简短说明推荐安排，邀请用户体验。\n设备反馈：确认体验前不执行。',
 '视觉：准备阶段显示状态反馈控件；体验中通过灯光、窗帘实际变化及设备状态标表达进展。\n听觉：AI 提示体验开始，设备异常时解释问题和下一步；不逐台播报普通检查结果。\n触觉：本次不执行手表振动。',
 '视觉：调整方案卡展示修改前后差异，启用后更新状态并保留调整、停用入口。\n听觉：AI 说明本次改动，保存成功后简短确认，并配合完成提示音。\n设备反馈：仅在用户再次体验时演示调整后的灯光与窗帘。'
 ];
 competitors.update({task,stage:Math.max(0,list().findIndex(n=>n.id===selected)),moment,mode,title:m.title,user:overview.user,ai:overview.ai,expression:example?(['normal','direct'].includes(mode)?expressionDesign[moment]:`${presentationNotes[comparisonCard]?.[1]||'通过语音与文字说明待处理的问题和下一步。'}\n异常分支的视听触表达待按节点进一步整理。`):'当前已整理交互逻辑；具体视觉、声音与设备表达待设计。',artwork:comparisonCard?setupCard(comparisonCard,{compact:true}):''});
 $('#timeline').querySelectorAll('button').forEach((b,i)=>{b.classList.toggle('active',i===moment);b.setAttribute('aria-pressed',String(i===moment));});
 $('#story-number').textContent=String(moment+1).padStart(2,'0');
 $('#user-story').textContent=example?mode==='normal'||mode==='direct'?(activeShot?.bubble?dialogue[activeShot.voice]?.text:m.story):'用户查看问题与受影响范围，选择补充、调整或暂不启用。':m.story;
 $('#branches').hidden=!example;
 $('#scene-case-control').hidden=!example;
 $('#scene-case-select').value=['missing','conditions','lightFailure'].includes(mode)?mode:'normal';
 if(example){
  const alternatives=[['missing','必要信息待补充'],['conditions','条件异常 · 合并说明'],['lightFailure','启用未成功'],null];
  const alternative=alternatives[moment];
  $('#branches').innerHTML=alternative?`<label for="branch-select">情况演示</label><div class="branch-select-wrap"><select id="branch-select"><option value="normal">正常流程</option><option value="${alternative[0]}">${alternative[1]}</option></select>${icon('chevron-down')}</div>`:`<label for="branch-select">情况演示</label><div class="branch-select-wrap"><select id="branch-select"><option value="normal">正常流程</option></select>${icon('chevron-down')}</div>`;
  if(alternative){$('#branch-select').value=alternative[0]===mode?mode:'normal';
  $('#branch-select').onchange=e=>{if(e.target.value==='normal')goMoment(moment,true);else{flashCase();startDemo(e.target.value);}};}
 }
 $('#channels').replaceChildren(...[['visual','视觉'],['audio','听觉'],['haptic','触觉']].map(([v,t])=>{const b=button(t,()=>{channel=v;renderChannel();},channel===v);if(v==='haptic'&&example){b.disabled=true;b.title='本次初始化只演示灯光与窗帘体验，手表为备用说明';}return b;}));
 $('#next').innerHTML=(moment<currentMoments().length-1?'下一时间点':'下一交互')+icon('arrow-right');
 $('#replay').hidden=!example;$('#channels').hidden=!example;$('#phases').hidden=!example;
 renderChannel();renderSceneMedia();
}
const voiceIds=[['request','incomplete','clarify','clarifyReply'],['recommend','choose','backup','conflict'],['experience','retry','lightFailure','stop'],['feedback','adjust','retryUser','confirm','enabled','saved','disabled']];
const paths=['聆听 → 整理需求 → 关联设备','生成方案 → 解释理由 → 等待选择','检查设备 → 灯光体验 → 窗帘体验 → 恢复环境','聆听反馈 → 定向修改 → 可选再体验 → 确认启用'];
function renderChannel(){
 const area=$('#channel-content'),example=isExample(),m=moments[moment];
 $('#channels').querySelectorAll('button').forEach((b,i)=>{b.classList.toggle('active',['visual','audio','haptic'][i]===channel);b.setAttribute('aria-pressed',String(['visual','audio','haptic'][i]===channel));});
 $('#visual-tabs').hidden=channel!=='visual'||!example;
 if(!example){const point=currentMoments()[moment];area.innerHTML=`<section class="setup-context"><h3>${esc(point.title)}</h3><p>${esc(point.ai)}</p></section><h4>用户行为</h4><p>${esc(point.story)}</p><h4>分支与边界</h4><p>${esc(point.condition)}</p><p class="source-note">本轮仅整理交互逻辑；具体视觉、声音和模型分镜待设计。</p>`;return;}
 if(moment!==2&&visual==='lights')visual='avatar';
 $('#visual-tabs').replaceChildren(...[['avatar','管家形象'],['cards','信息呈现'],['lights','设备体验']].map(([v,t])=>{const b=button(t,()=>{visual=v;renderChannel();},visual===v);b.disabled=v==='lights'&&moment!==2;return b;}));
 const context='';
 if(channel==='audio'){
  area.innerHTML=audioPresentation(manifest,moment,mode,voiceIds[moment]);
  area.querySelectorAll('audio').forEach(a=>{a.onplay=()=>{area.querySelectorAll('audio').forEach(b=>{if(b!==a)b.pause();});voiceAudio.volume=effectAudio.volume=0;};const restore=()=>{voiceAudio.volume=.9;effectAudio.volume=.65;};a.onpause=restore;a.onended=restore;});return;
 }
 if(visual==='avatar'){
  area.innerHTML=context+butlerPair(activeShot?.state||'waiting')+`<p class="semantic-path">${paths[moment]}</p><div class="avatar-state-picks" aria-label="查看形象状态"></div><p class="channel-note">两套形象是设计备选，并非两位管家。对照展示同一状态；聆听时不抢话，说明后收束等待。</p>`;
  $('.avatar-state-picks').replaceChildren(...Object.entries(avatarStates).map(([v,t])=>button(t,()=>{area.querySelectorAll('.butler').forEach(el=>{el.dataset.state=v;el.setAttribute('aria-label',`${el.dataset.shape==='line'?'Dynamic Line':'Layered Glass'} · ${t}`);el.querySelector('.butler-caption').textContent=t;el.classList.add('reference-motion');});area.querySelector('.butler-pair-state').textContent=t;},activeShot?.state===v)));return;
 }
 if(visual==='lights'){
  area.innerHTML=experienceDetails();bindActions();return;
 }
 const card=activeShot?.card||['summary','draft','checking','adjusted'][moment];
 const note=presentationNotes[card]||['呈现方式','此阶段通过模型动作、设备状态标与语音字幕表达，不额外叠加信息框。'];
 area.innerHTML=setupCard(card)+`<section class="presentation-explanation"><h3>${esc(note[0])}</h3><p><strong>作用与信息</strong> ${esc(note[1])}</p>${note[2]?`<p><strong>出现时机</strong> ${esc(note[2])}</p>`:''}</section>`;
 bindActions();
}
function playFrom(id){loadSequence();const i=presentation.sequence.findIndex(s=>s.id===id);presentation.start(i<0?0:i);}
function bindActions(){document.querySelectorAll('[data-setup-action]').forEach(b=>b.onclick=()=>{
 const a=b.dataset.setupAction;
 if(a==='体验一下'||a==='体验可用设备'){if(mode==='conditions'){const shots=setupSequence(manifest,false).filter(s=>s.moment===2);presentation.setSequence(shots);renderProgress();presentation.start();}else playFrom('experienceIntro');return;}
 if(a==='再次体验'){if(blockingCase){startDemo(blockingCase);return;}includeRepeat=true;playFrom('retryIntro');return;}
 if(a==='停止体验'||a==='结束体验'){startDemo('stop');return;}
 if(a==='确认启用'){if(blockingCase){modal('<h2>当前条件尚未解决</h2><p>需要先确认设备、备用与免扰范围，不能直接显示启用成功。可在“情况演示”切回正常流程，查看条件满足时的方案。</p>');return;}startDemo('direct');return;}
 if(a==='停用'){startDemo('disabled');return;}
 if(a==='查看方案'){goMoment(1);return;}
 if(['调整方案','继续调整','返回调整'].includes(a)){showEditor();return;}
 if(a==='仅明天'){startDemo('missing',2);return;}
 if(a==='每个工作日'){modal('<h2>重复安排</h2><p>已选择工作日（演示）。完整主线当前演示“明天一次性唤醒”，工作日版本需另行确认，不会自动启用。</p>');return;}
 if(a==='重新检查'||a==='重试'){startDemo(mode==='conditions'?'conditions':'lightFailure');return;}
});}
function showEditor(){
 modal(`<h2>调整唤醒方案</h2><p>用体验语言调整，也可以直接选择参数。仅修改演示方案，不控制真实设备。</p><form id="setup-editor"><label>灯光体验<select id="edit-light"><option value="gentle">更柔和，渐亮更慢</option><option value="base">保持首次体验</option></select></label><label>窗帘安排<select id="edit-curtain"><option value="keep">保持受限开启</option><option value="closed">保持关闭</option></select></label><p class="channel-note">起床时间、音箱免扰和已授权备用范围不变。</p><button type="submit" class="primary">查看修改后的体验</button></form>`);
 $('#setup-editor').onsubmit=e=>{e.preventDefault();const gentle=$('#edit-light').value==='gentle',closed=$('#edit-curtain').value==='closed';$('#modal').close();includeRepeat=true;
  const level=gentle?.19:.30;const shots=setupSequence(manifest,true).filter(s=>['retryIntro','retryDark','retryLight','retryCurtain','retryEnd'].includes(s.id)).map(s=>({...s,voice:closed||!gentle?undefined:s.voice,duration:s.id==='retryLight'&&!gentle?6500:s.duration,light:s.id==='retryLight'?[0,level]:s.id==='retryCurtain'?[level,level]:s.id==='retryEnd'?[level,.06]:s.light,curtain:closed?[.03,.03]:s.curtain,card:closed||!gentle?'custom':s.card}));
  cards.custom={title:'自定义体验',status:'体验 · 未启用',rows:[['灯光',gentle?'更柔和，渐亮更慢':'保持首次体验'],['窗帘',closed?'保持关闭':'保持受限开启']],actions:['调整方案','查看方案'],note:'未确认前不启用；返回主线将恢复演示预设'};
  mode='custom';presentation.setSequence(shots);renderProgress();presentation.start();
 };
}
function applyShot(shot,p){
 $('.room-frame').dataset.shot=shot.id;$('#scene-time').textContent='初始化设置';$('#scene-stage').textContent=shot.label;
 $('#scene-ai-action').hidden=false;$('#scene-ai-action').textContent=explanationFor(shot);
 if(!room)return;
 const node=nodes.find(n=>n.id==='N011');room.setState({...roomState(node),storyboard:'setup',setupPhase:shot.id,setupMoment:moment,active:['lamp','curtain'],haptic:false});room.setView(shot.view,!presentation.running);room.setStoryboardProgress(shot,p);
 if(!presentation.running)room.pauseStoryboard();
 document.querySelectorAll('[data-view]').forEach(b=>{const active=b.dataset.view===(shot.id==='overview'?'overview':'focus');b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
}
function syncGenericRoom(){const n=nodes.find(n=>n.id==='N011');if(n){room?.setState({...roomState(n),nodeNumber:11,active:[]});room?.setView('overview');}$('#scene-time').textContent=current().stage;$('#scene-stage').textContent=currentMoments()[moment].title;$('#scene-subtitle').textContent='';$('#scene-ai-action').hidden=false;$('#scene-ai-action').textContent='流程内容已整理，模型分镜待设计。';}
function renderSceneMedia(){
 const media=$('#scene-media'),shot=activeShot;
 media.hidden=!isExample()||!shot||['overview','walking'].includes(shot.id);
 if(media.hidden)return;
 const nextKey=shot.card&&setupCard(shot.card,{compact:true})?shot.card:'';
 const transition=media.dataset.cardKey!==nextKey?crossfadeCard(media,media.querySelector('.scene-card-fit')):null;
 media.dataset.cardKey=nextKey;
 media.innerHTML=butlerPair(shot.state,true)+(shot.card&&setupCard(shot.card,{compact:true})?`<div class="scene-card-fit"><div class="scene-card-inner">${setupCard(shot.card,{compact:true})}</div></div>`:'');
 transition?.();
 cancelAnimationFrame(fitFrame);fitFrame=requestAnimationFrame(fitSceneCard);
}
function fitSceneCard(){
 const wrap=$('.scene-card-fit'),inner=$('.scene-card-inner');if(!wrap||!inner)return;
 const pair=$('#scene-media .butler-pair'),available=Math.max(60,$('#scene-media').clientHeight-pair.offsetHeight-8),natural=inner.scrollHeight;const scale=Math.min(1,available/Math.max(1,natural));
 inner.style.transform=`scale(${scale})`;wrap.style.height=natural*scale+'px';
 pair.style.width=scale*100+'%';
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
// Storyboard annotation is not a spoken subtitle or part of the product card.
$('.room-top>div').insertAdjacentHTML('beforeend','<p id="scene-ai-action" aria-label="AI 行动说明"></p>');
// A click toggles playback; camera drags, wheel gestures and controls do not.
let scenePress=null;
const sceneSurface=$('.room-frame');
sceneSurface.addEventListener('pointerdown',e=>{scenePress=e.isPrimary&&e.button===0?{x:e.clientX,y:e.clientY,moved:false}:null;});
sceneSurface.addEventListener('pointermove',e=>{if(scenePress&&Math.hypot(e.clientX-scenePress.x,e.clientY-scenePress.y)>6)scenePress.moved=true;});
sceneSurface.addEventListener('pointercancel',()=>{scenePress=null;});
sceneSurface.addEventListener('wheel',()=>{scenePress=null;},{passive:true});
function resumeContinuous(){
 inspectTimepoint=false;
 if(mode==='normal'){
  const full=setupSequence(manifest,includeRepeat),shot=presentation.shot;
  if(shot&&presentation.sequence.length!==full.length){
   const at=presentation.elapsed-presentation.sequence.slice(0,presentation.sequence.indexOf(shot)).reduce((sum,s)=>sum+s.duration,0);
   const index=full.findIndex(s=>s.id===shot.id);
   if(index>=0){presentation.setSequence(full);renderProgress();presentation.seek(full.slice(0,index).reduce((sum,s)=>sum+s.duration,0)+at);}
  }
 }
 presentation.resume();
}
sceneSurface.addEventListener('click',e=>{const press=scenePress;scenePress=null;if(!isExample()||!press||press.moved||e.target.closest('button,select,input,label,a,summary,audio,.hotspot'))return;if(presentation.running)presentation.stop();else resumeContinuous();});
// Stable controls are kept outside re-rendered scene overlays.
const frame=$('.room-frame');frame.insertAdjacentHTML('beforeend','<p id="scene-subtitle" aria-live="off"></p><aside id="scene-media" aria-label="当前时间点呈现"></aside><span id="scene-mode">交互设计演示</span><div id="demo-controls"><div class="seek-track"><div class="seek-marks" aria-hidden="true"></div><input id="demo-progress" type="range" aria-label="播放进度" min="0" max="1" step="50" value="0"></div><button id="demo-play" aria-label="播放"></button><button id="demo-restart" title="重播完整流程" aria-label="重播完整流程">'+icon('rotate-ccw')+'</button><button id="demo-sound" aria-label="静音"></button></div>');
new ResizeObserver(()=>{cancelAnimationFrame(fitFrame);fitFrame=requestAnimationFrame(fitSceneCard);}).observe($('#scene-media'));
$('#demo-progress').addEventListener('pointerdown',()=>{dragging=true;});$('#demo-progress').addEventListener('input',e=>{presentation.seek(Number(e.target.value));updatePlayer();});window.addEventListener('pointerup',()=>{dragging=false;});
$('#demo-play').onclick=e=>{e.stopPropagation();if(presentation.running)presentation.stop();else resumeContinuous();};
$('#demo-restart').onclick=()=>{inspectTimepoint=false;startDemo();};
$('#demo-sound').onclick=()=>{if(soundBlocked){muted=false;soundBlocked=false;if(presentation.running&&activeShot){const before=presentation.sequence.slice(0,presentation.sequence.indexOf(activeShot)).reduce((n,s)=>n+s.duration,0);playShotAudio(activeShot,presentation.elapsed-before);}else presentation.resume();}else muted=!muted;voiceAudio.muted=effectAudio.muted=muted;updatePlayer();};
$('#replay').onclick=replayMoment;
$('#next').onclick=()=>{if(moment<currentMoments().length-1){goMoment(moment+1);return;}const items=list(),i=items.findIndex(n=>n.id===selected);if(items[i+1])selectNode(items[i+1].id);else modal('<h2>已到本任务最后一个交互</h2><p>可以切换其他任务。</p>');};
const competitors=installCompetitors({pause:()=>{presentation.stop();silence();room?.pauseStoryboard?.();}});
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{room?.setView(b.dataset.view==='focus'?(isExample()?activeShot?.view||'setupInput':task===2?'bath':'bed'):b.dataset.view);document.querySelectorAll('[data-view]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});});
function selectScene(i){presentation.stop();silence();if(i===2){location.href='../ai-3/strategy.html';return;}$('#scene-title').textContent=scenes[i];$('#workspace').hidden=!!i;$('#empty-scene').hidden=!i;$('#scene-detail').hidden=!!i;$('#scenes').querySelectorAll('button').forEach((b,j)=>b.classList.toggle('active',i===j));if(!i)window.dispatchEvent(new Event('resize'));}
$('#scenes').replaceChildren(...scenes.map((s,i)=>button(s+(i&&i!==2?' · 待完善':''),()=>selectScene(i),i===0)));$('#back-morning').onclick=()=>selectScene(0);
// Right-panel selection finishes the current timepoint before pausing.
for(const event of ['pointerdown','click','keydown'])document.addEventListener(event,()=>{hasInteracted=true;},true);
document.addEventListener('visibilitychange',()=>{if(document.hidden)presentation.stop();});
frame.addEventListener('mouseleave',()=>{if($('#demo-controls').contains(document.activeElement))document.activeElement.blur();});
frame.insertAdjacentHTML('beforeend',`<label id="scene-case-control" for="scene-case-select">情况演示<div class="branch-select-wrap"><select id="scene-case-select"><option value="normal">正常流程</option><option value="missing">异常 · 必要信息待补充</option><option value="conditions">异常 · 条件冲突</option><option value="lightFailure">异常 · 启用未成功</option></select>${icon('chevron-down')}</div></label>`);
$('#scene-case-select').onchange=e=>{flashCase();startDemo(e.target.value);};
$('#branches').insertAdjacentHTML('beforebegin','<section id="moment-overview" aria-label="本时间点的人与 AI 交互"></section>');
renderHeader();loadSequence();presentation.show(0);updatePlayer();installUIMotion();
try{
 const {createRoom}=await import('./scene.js');
 room=createRoom($('#scene'),$('#hotspots'),id=>{const names={bed:'智能床',radar:'毫米波雷达',panel:'4寸中控屏',app:'App（手机）',lamp:'灯光',speaker:'音箱',watch:'手表',curtain:'窗帘'};modal(`<h2>${esc(names[id]||deviceNames[id])}</h2>${isExample()?deviceScope():`<p>${esc(roomState(nodes.find(n=>n.id===selected)).devices[id]||'设备情境示意')}</p>`}<p class="source-note">模型状态为演示预置，不代表真实设备回执。</p>`);});
 if(!hasInteracted)startDemo();else if(activeShot)applyShot(activeShot,0);
}catch(e){console.error('Room unavailable',e);$('#scene-error').hidden=false;}
