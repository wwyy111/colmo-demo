import {initFlow} from './flow.js';
import {nodes,chapters,normalRoute,kindNames,clip,motionFor,shouldSpeak} from './nodes.js';
import {roomState,deviceNames} from './room-state.js';
import {Narrator} from './tts.js';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let selected=11,phase=0,status='ready',mode='scene',sound=false,style='line',guided=false,room=null,device=null,timer=null,greenTimer=null,revision=0;
const visited=new Set([11]);const node=()=>nodes[selected-1];
const palette={blue:'171,211,238',amber:'241,184,104',red:'244,116,101',green:'137,211,178'};
const narrator=new Narrator(({status:audioStatus,time=0,duration=0})=>{
 $('#expression').dataset.playback=audioStatus;$('#expression').classList.toggle('speaking',audioStatus==='playing');
 $('#progress').value=duration>0?time/duration:audioStatus==='ended'?1:0;
 $('#audio-state').textContent={idle:sound?'语音已开启':'语音关闭',playing:'正在讲述',loading:'音频加载中',ended:'播报结束',blocked:'点击听本节点以播放',error:'音频不可用 · 可重试'}[audioStatus];
});narrator.setVolume(.65);
function cancelPending(){revision++;clearTimeout(timer);clearTimeout(greenTimer);narrator.stop();}
function syncSound(){ $('#sound').textContent=sound?'♫ 语音开启':'♫ 语音关闭';$('#sound').setAttribute('aria-pressed',String(sound));}
function play(force=false){narrator.stop();if(!sound)return;const n=node();if(!shouldSpeak(n,mode,phase,force)){$('#audio-state').textContent=n.sleeping?'睡眠阶段 · 静默可查':'常规状态 · 静默可查';return;}if(['rejected','restored'].includes(status))return;narrator.play(clip(n,phase,['success','settled'].includes(status)));}
function select(num,{fromRoute=false,scroll=false}={}){cancelPending();if(!fromRoute)guided=false;selected=Math.max(1,Math.min(31,num));status='ready';visited.add(selected);device=null;$('#device-panel').hidden=true;render();play();if(scroll)document.querySelector('main').scrollIntoView({behavior:'smooth',block:'start'});}
function action(label,fn,cls=''){const b=document.createElement('button');b.textContent=label;b.className=cls;b.onclick=fn;return b;}
function perform(){if(status!=='ready')return;narrator.stop();status='pending';render();const token=revision;
 timer=setTimeout(()=>{if(token!==revision)return;status=node().kind==='risk'?'settled':'success';render();play();if(status==='success')greenTimer=setTimeout(()=>{if(token!==revision)return;status='settled';render();},1800);},1400);
}
function reject(){cancelPending();guided=false;status='rejected';render();}
function restore(){cancelPending();guided=false;status='restored';render();}
function advance(){
 if(guided){const i=normalRoute.indexOf(selected);if(i<normalRoute.length-1)select(normalRoute[i+1],{fromRoute:true});else{guided=false;render();$('#route-status').textContent='本次晨间体验已结束，可查看复盘与优化节点';}return;}
 select(Math.min(selected+1,31));
}
function render(){const n=node(),m=motionFor(n,phase,status),s=roomState(n,status);document.body.dataset.node=n.id;document.body.dataset.status=status;
 $('#node-id').textContent=n.id;$('#node-title').textContent=n.title;$('#node-type').textContent=n.subtype;$('#node-kind').textContent=kindNames[n.kind];
 $('#speech-text').textContent=['success','settled'].includes(status)?n.result:n.speech[phase];
 $('#facts').replaceChildren(...n.facts.map(t=>{const el=document.createElement('span');el.textContent=['success','settled'].includes(status)?t.replace('停止雾化：待回执','停止雾化：已核验 · 缺水未解决').replace('执行待回执','轻振已执行 · 清醒未知').replace('停机待核验 / 自动重启禁止','停机已核验 / 异常未解除'):t;return el;}));
 $('#context-note').textContent=['learn','check'].includes(n.kind)?'基于模拟的多次历史 / 试用记录，不把本次体验当作长期习惯。':n.kind==='risk'?'独立异常演练：切换节点只切换样例，不代表异常已解除。':n.sleeping?'此节点发生在睡眠阶段。场景模式保持静默，可手动审听。':guided?'晨间主流程 · 时间已压缩，必要选择由你确认。':'独立节点样例 · 设备初始状态和前置条件为模拟预置。';
 $('#receipt').textContent=status==='pending'?'请求已提交，正在等待模拟设备回执。':status==='rejected'?(['learn','check'].includes(n.kind)?'已保留原规则，本次不应用建议调整。':'本次方案暂不启用，未下发新任务。'):status==='restored'?'原规则已在本次演示中恢复，试用设置已撤回。':status==='settled'||status==='success'?(n.kind==='risk'?'保护动作已核验 · 异常仍未解决':'本节点操作已核验 · 模拟回执'):'';
 const buttons=[];
 if(status==='ready'){
 buttons.push(action(n.action,perform,'primary '+(n.kind==='risk'?'danger':'')));
 if(['setup','suggest','learn'].includes(n.kind))buttons.push(action(['learn'].includes(n.kind)?'保留原规则':'暂不采用',reject));
 if(n.kind==='check')buttons.push(action('恢复原规则',restore));
 }else if(status==='pending')buttons.push(action('回执待确认…',()=>{},'primary'));
 else{
 if(['learn','check'].includes(n.kind)&&!['rejected','restored'].includes(status))buttons.push(action('恢复原规则',restore));
 buttons.push(action(guided?'继续晨间流程 →':selected===31?'回到无感唤醒 →':'查看下一节点 →',()=>selected===31&&!guided?select(11):advance(),'primary'));
 buttons.push(action('重演本节点',()=>select(selected,{fromRoute:guided})));
 }
 $('#actions').replaceChildren(...buttons);if(status==='pending')$('#actions button').disabled=true;
 const expr=$('#expression');expr.dataset.style=style;expr.dataset.layers=m.layers;expr.dataset.color=m.color;
 const root=document.documentElement;Object.entries({'--accent':palette[m.color],'--brightness':m.brightness/100,'--spread':m.spread+'px','--period':m.period+'s','--gap':m.gap+'px','--opacity':m.opacity}).forEach(([k,v])=>root.style.setProperty(k,v));
 $('#level').textContent=`I${m.level} · ${['','轻感知','中介入','强介入'][m.level]}`;
 $('#motion-label').textContent=style==='line'?`${m.brightness}% · ${m.spread}px · ${m.period}s`:`${m.layers} 层 · ${m.gap}px · ${Math.round(m.opacity*100)}%`;
 $('#expression-state').textContent=n.kind==='risk'?'模拟异常 · 未解除':status==='pending'?'已提交 · 等待回执':status==='rejected'?'保持原安排':status==='restored'?'已恢复原规则':status==='ready'?kindNames[n.kind]:'模拟回执已核验';
 $('#ai-presence').textContent=n.kind==='risk'?'关注未解决事项':n.sleeping?'静默守候':'与你协作';
 $('#phase-note').textContent=['P1 · 完整解释，保留确认入口','P2 · 突出变化，减少重复说明','P3 · 常规简短，风险保持必要强度'][phase];
 $('#scene-time').textContent=/^\d/.test(n.clock)?n.clock:'08:15';
 $('#scene-stage').textContent=n.kind==='risk'?'异常尚未解除，先确认保护。':['learn','check'].includes(n.kind)?'历史与试用记录复盘':n.chapter==='environment'?'在醒来之前，准备舒适。':n.chapter==='wake'?'光，比声音先到。':'走到洗漱间，水温刚好。';
 $('#position').textContent=`${String(selected).padStart(2,'0')} / 31`;
 $('#previous').disabled=selected===1||status==='pending';$('#next').disabled=selected===31||status==='pending';
 $('#coverage').textContent=`31 个节点已配置 · 已查看 ${visited.size} / 31`;
 $('#route-status').textContent=guided?`晨间主流程 ${normalRoute.indexOf(selected)+1} / ${normalRoute.length}`:'先准备，再自然唤醒';
 $('#guided').textContent=guided?'退出流程 · 自由查看':'▷ 体验晨间流程';
 $('#source-detail').textContent=`${n.id}｜${n.name}\n原表：节点归类索引，第 ${n.sheetRow} 行\n${n.category} / ${n.subtype}\n${n.expression}\n${n.principle}\n原始定位：${n.source}`;
 $$('#chapters button').forEach(b=>{b.classList.toggle('active',b.dataset.chapter===n.chapter);b.setAttribute('aria-current',b.dataset.chapter===n.chapter?'step':'false');});
 room?.setState(s);updateDevice();renderCatalog();document.dispatchEvent(new CustomEvent('colmo-node-change',{detail:{number:selected}}));
}
function renderCatalog(){const query=$('#search').value.trim().toLowerCase(),filter=$('#filter').value;let count=0;const sections=[];
 for(const chapter of chapters){const matching=nodes.filter(n=>n.chapter===chapter.id&&(filter==='all'||n.kind===filter)&&(!query||[n.id,n.title,n.name,n.subtype,n.category].join(' ').toLowerCase().includes(query)));if(!matching.length)continue;count+=matching.length;
 const section=document.createElement('div');section.className='catalog-chapter';const title=document.createElement('h3');title.textContent=chapter.name;const range=document.createElement('span');range.textContent=`N${String(chapter.start).padStart(3,'0')}—N${String(chapter.end).padStart(3,'0')} / ${chapter.end-chapter.start+1} 个节点`;title.append(range);
 const cards=document.createElement('div');cards.className='node-cards';for(const n of matching){const card=action('',()=>select(n.number,{scroll:true}),'node-card'+(selected===n.number?' active':'')+(visited.has(n.number)?' visited':''));card.dataset.kind=n.kind;card.setAttribute('aria-label',`${n.id} ${n.title}`);const id=document.createElement('span');id.className='id';id.textContent=n.id;const strong=document.createElement('strong');strong.textContent=n.title;const meta=document.createElement('small');meta.textContent=n.subtype.split(' ')[0]+' · '+kindNames[n.kind];card.append(id,strong,meta);cards.append(card);}section.append(title,cards);sections.push(section);}
 $('#node-grid').replaceChildren(...sections);$('#no-results').hidden=count>0;
}
function updateDevice(){if(device)$('#device-text').textContent=roomState(node(),status).devices[device];}
function openDevice(id){device=id;$('#device-title').textContent=deviceNames[id];$('#device-panel').hidden=false;updateDevice();}
$('#chapters').replaceChildren(...chapters.map((c,i)=>{const b=action('',()=>select(c.start));b.dataset.chapter=c.id;b.innerHTML=`<b>0${i+1}</b>${c.name}<small>${c.end-c.start+1} 节点</small>`;return b;}));
$$('[data-phase]').forEach(b=>b.onclick=()=>{phase=Number(b.dataset.phase);$$('[data-phase]').forEach(x=>x.classList.toggle('active',x===b));render();play();});
$$('[data-style]').forEach(b=>b.onclick=()=>{style=b.dataset.style;$$('[data-style]').forEach(x=>x.classList.toggle('active',x===b));render();});
$$('[data-view]').forEach(b=>b.onclick=()=>{room?.setView(b.dataset.view);$$('[data-view]').forEach(x=>x.classList.toggle('active',x===b));});
$('#reset-camera').onclick=()=>{room?.setView('overview');$$('[data-view]').forEach(x=>x.classList.toggle('active',x.dataset.view==='overview'));};
$('#previous').onclick=()=>select(selected-1);$('#next').onclick=()=>select(selected+1);
$('#guided').onclick=()=>{if(guided){guided=false;render();return;}guided=true;sound=true;syncSound();select(normalRoute[0],{fromRoute:true});};
$('#catalog-open').onclick=()=>$('#catalog').scrollIntoView({behavior:'smooth',block:'start'});
$('#search').oninput=renderCatalog;$('#filter').onchange=renderCatalog;
$('#device-close').onclick=()=>{device=null;$('#device-panel').hidden=true;};
$('#reset').onclick=()=>{visited.clear();guided=false;select(11);room?.setView('overview');};
$('#sound').onclick=()=>{sound=!sound;syncSound();sound?play():narrator.stop();};
$('#replay').onclick=()=>{sound=true;syncSound();play(true);};
$('#mode-select').onchange=e=>{mode=e.target.value;if(mode==='narrated'){sound=true;syncSound();}play();};
function openSettings(){$('#settings-dialog').showModal();}
$('#settings').onclick=openSettings;$('#voice-open').onclick=openSettings;$('#settings-close').onclick=()=>$('#settings-dialog').close();
$$('[data-voice]').forEach(b=>b.onclick=()=>{narrator.stop();narrator.voice=b.dataset.voice;$$('[data-voice]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});$('#voice-open').textContent=narrator.voice==='male'?'男声 · 稳重':'女声 · 沉静';});
$('#audition').onclick=()=>{sound=true;syncSound();play(true);};$('#stop-speech').onclick=()=>narrator.stop();$('#rate').onchange=e=>narrator.setRate(Number(e.target.value));$('#volume').oninput=e=>{narrator.setVolume(Number(e.target.value)/100);$('#volume-value').textContent=e.target.value+'%';};
document.addEventListener('visibilitychange',()=>{if(document.hidden)narrator.stop();});
render();
import('./scene.js').then(({createRoom})=>{room=createRoom($('#scene'),$('#hotspots'),openDevice);render();}).catch(e=>{console.error('3D scene unavailable',e);$('#scene-error').hidden=false;});

document.addEventListener('action-preview-start',()=>narrator.stop());

initFlow({navigate(num,settled=false){select(num);if(settled){cancelPending();status='settled';render();}document.querySelector('main').scrollIntoView({behavior:'smooth',block:'start'});},speak(script){sound=true;syncSound();narrator.play(script);}});
$('#flow-open').onclick=()=>$('#flow-experience').scrollIntoView({behavior:'smooth',block:'start'});
