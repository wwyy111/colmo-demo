import {scripts, speechFor} from "./voice-content.js";
import {Narrator} from "./tts.js";
const $=s=>document.querySelector(s);
let phase=0,state='welcome',sound=false,style='line',timers=[],kitchen=null,device=null;
let meal={people:'2',time:'18:30',preference:'少油少盐'};
let returnState='cooking';
const colors={blue:'156,212,249',amber:'242,185,105',red:'247,115,97',green:'132,214,174'};
const stages=['理解需求','确认方案','设备协同','烹饪引导','完成晚餐'];
const deviceNames={fridge:'COLMO 智能冰箱',stove:'COLMO 智能灶具',oven:'COLMO 蒸烤一体机',hood:'COLMO 智能烟机'};
const stageIndex={welcome:0,understand:0,plan:1,starting:2,resuming:2,cooking:2,action:3,finishing:3,finish:4,risk:3,protecting:3,protected:3,recovered:3,takeover:3};
const phaseNotes=['P1 · 解释更完整，每一步都可确认与修改','P2 · 继承已确认条件，只突出本次变化','P3 · 常规状态静默可查，需要你时才提醒'];
function later(fn,ms){timers.push(setTimeout(fn,ms));}
function stopTimers(){timers.forEach(clearTimeout);timers=[];}
function afterNarration(fn,ms){const check=()=>{if(narrator.busy||$("#voice-dialog").open)later(check,300);else fn();};later(check,ms);}
function words(a,b,c){return [a,b,c][phase];}
function config(){const m=meal;return {
 welcome:{title:'今晚，想吃点什么？',text:words('告诉我这餐的安排。我会陪你准备食材、协调设备，在需要你的时候轻声提醒。','今晚仍按已确认的清淡口味准备？你可以告诉我这次的人数与时间。','我在。今晚的安排，还是照常吗？'),node:'AI 辅助烹饪',label:'静候唤醒',level:1,color:'blue',buttons:[['开始有声晚餐 →',()=>{enableSound();go('understand');},'primary'],['修改需求',editMeal]],chips:[],hint:'体验需求：「两个人，六点半吃，清淡一点。」'},
 understand:{title:'明白，这餐为你这样安排。',text:words(`本次是 ${m.people} 人用餐，计划 ${m.time} 开饭，口味${m.preference}。这些条件只用于今晚。请确认，我再为你安排菜单与设备。`,`本次 ${m.people} 人，${m.time} 开饭。保留${m.preference}的要求；有变化可以在这里修改。`,`${m.people} 人，${m.time}，${m.preference}。这次按这个安排？`),node:'N094 · A2 复述本次需求',label:'理解需求 · 待确认',level:2,color:'amber',chips:[`${m.people} 人用餐`,`${m.time} 开饭`,m.preference],buttons:[['理解正确 →',()=>go('plan'),'primary'],['修改',editMeal]],hint:'理解已完成，设备尚未启动。'},
 plan:{title:'三道菜，刚好一起上桌。',text:words(`建议做香煎三文鱼、清蒸时蔬和米饭。先准备米饭，再用蒸烤机做时蔬，最后煎鱼；翻面时需要你配合。预计 ${m.time} 开饭。采用这份安排吗？`,`米饭先行，时蔬随后，最后煎鱼。预计 ${m.time} 上桌，翻面时我会提醒。要采用这份安排吗？`,`按本次菜单协调灶具、烟机与蒸烤机，${m.time} 上桌。翻面请你配合。开始吗？`),node:'N118 · B5 步骤与时间安排',label:'建议已准备 · 等待选择',level:2,color:'amber',chips:['米饭 → 时蔬 → 煎鱼','人工翻面'],buttons:[['采用并开始 →',()=>go('starting'),'primary'],['调整需求',editMeal]],hint:'授权仅限本次模拟烹饪；可随时手动接管。'},
 starting:{title:'正在逐一确认设备。',text:'启动指令已提交。正在等待灶具、烟机与蒸烤机的模拟运行回执；此时还不能确认设备已开始工作。',node:'N119 · C1 提交与执行状态',label:'已提交 · 等待回执',level:3,color:'blue',chips:['灶具 · 待响应','烟机 · 待响应','蒸烤机 · 待响应'],buttons:[],hint:'模拟回执预计 3 秒内返回。'},
 cooking:{title:'火候交给我，你慢慢来。',text:words('模拟回执已确认：灶具正在加热，烟机低档运行，蒸烤机正在处理时蔬。三文鱼下一步需要翻面，我会在合适的时候提醒你。','三台设备均已返回运行回执。时蔬与煎鱼同步进行，下一步等你翻面。','设备运行中。到翻面的时候，我会叫你。'),node:'N120 · C1 整体烹饪进度',label:'烹饪进行中',level:1,color:'blue',chips:['灶具 · 运行中','烟机 · 低档','蒸烤机 · 运行中'],buttons:[['查看下一步 →',()=>go('action'),'primary']],hint:'演示时间已压缩，约 10 秒后提示翻面。',quiet:phase===2},
 action:{title:'现在，请为三文鱼翻面。',text:words('用锅铲轻轻翻面，让另一面均匀受热。完成后点「已翻面」，我再继续本次流程；未确认前，不会把这一步记为完成。','请将三文鱼翻面，完成后告诉我，我再继续后续步骤。','该翻面了。完成后告诉我。'),node:'N122 · C3 当前人工动作',label:'需要你配合',level:2,color:'amber',chips:['待人工确认 · 翻面'],buttons:[['已翻面，继续 →',()=>go('finishing'),'primary']],hint:'设备继续按当前模拟程序运行，等待你的操作确认。'},
 finishing:{title:'收到，接下来我来协调。',text:words('已记录你完成翻面的确认。现在继续剩余烹饪，并等待各设备结束回执；还不能确认这餐已经完成。','已确认翻面。正在等待本轮烹饪结束回执。','收到。完成后告诉你。'),node:'N120 · C1 后续烹饪进度',label:'收尾进行中',level:1,color:'blue',chips:['人工步骤 · 已确认','烹饪结束 · 待回执'],buttons:[],hint:'约 6 秒后展示模拟烹饪结果。',quiet:phase===2},
 finish:{title:'晚餐就绪，享受这一刻。',text:words('模拟回执显示：灶具加热已停止，时蔬程序已结束，米饭已完成；烟机还在延时排烟。请检查实际熟度后装盘，取出时蔬时注意余温。','模拟烹饪程序均已结束，烟机继续延时排烟。实际熟度仍需你检查，取出时蔬时注意余温。','烹饪程序已结束。请检查熟度后装盘，烟机还在延时排烟。'),node:'N136 · E1 结果与未完成项',label:'程序完成 · 模拟回执',level:1,color:'green',chips:['灶具 · 已停止','蒸烤机 · 程序结束','烟机 · 延时排烟'],buttons:[['再体验一次 ↺',restart,'primary']],hint:'一次体验不自动写入长期习惯。'},
 risk:{title:'灶具异常，需要立即处理。',text:'模拟事件：灶具返回过温保护告警，加热关闭状态尚未确认。请立即停止当前烹饪；我会请求停止加热，待回执确认后仍需人工检查。',node:'N127 · D1 高风险提醒',label:'模拟告警 · 尚未解决',level:3,color:'red',chips:['过温保护告警','关闭状态 · 未确认'],buttons:[['请求停止加热 →',()=>go('protecting'),'primary danger']],hint:'异常演练 · 三个信任阶段均保留高强度提醒。'},
 protecting:{title:'停止请求已提交。',text:'正在等待灶具停止加热的模拟回执。关闭状态未确认，异常仍未解决；烟机维持排烟，蒸烤机已收到暂停请求。',node:'N128 · D2 保护动作状态',label:'等待保护回执 · 风险持续',level:3,color:'red',chips:['停止请求 · 已发送','加热关闭 · 待回执'],buttons:[],hint:'发送成功不等于已经停止，保持告警。'},
 protected:{title:'加热已停止，仍需你检查。',text:'模拟回执已确认灶具停止加热、蒸烤机暂停，烟机保持排烟。风险尚未解除，请确认锅具与周围环境已检查；在此之前不会自动恢复烹饪。',node:'N128 · D2 保护与未解决项',label:'保护已执行 · 待人工检查',level:3,color:'red',chips:['加热 · 已停止','人工检查 · 待完成'],buttons:[['模拟确认：已检查 →',()=>go('recovered'),'primary']],hint:'此按钮仅模拟人工检查，不代表任何真实环境已安全。'},
 recovered:{title:'恢复条件已核验。',text:'模拟停机回执与人工检查确认均已具备，本次模拟告警解除。烹饪仍保持暂停，需要你选择是否恢复。',node:'N130 · D4 恢复证据与限制',label:'已核验 · 等待恢复选择',level:2,color:'amber',chips:['停机回执 ✓','人工检查 ✓','烹饪仍暂停'],buttons:[['恢复本次烹饪 →',()=>go('resuming'),'primary'],['结束本次',restart]],hint:'解除提醒不等于自动重新启动。'},
 resuming:{title:'正在核对恢复回执。',text:'恢复请求已发送。正在等待灶具与蒸烤机返回运行状态，确认后继续刚才的步骤。',node:'N124 · C4 继续与生效状态',label:'恢复请求 · 等待回执',level:3,color:'blue',chips:['恢复请求 · 已提交','运行状态 · 待回执'],buttons:[],hint:'模拟核验中，尚未把设备计为已恢复。'},
 takeover:{title:'好的，这一步由你掌握。',text:'模拟回执确认：AI 对灶具与蒸烤机的自动控制已暂停，加热暂停；烟机继续排烟。本次由你接管，选择恢复后才继续协作。',node:'N124 · C4 暂停与接管',label:'已接管 · 自动控制暂停',level:3,color:'blue',chips:['灶具 · 暂停','蒸烤机 · 暂停','烟机 · 排烟'],buttons:[['交回管家，继续 →',()=>go('resuming'),'primary'],['结束本次',restart]],hint:'仅影响本次任务，不改变长期规则。'}
}[state];}
function render(){const c=config();document.body.dataset.state=state;let level=c.level;if(phase===2&&['understand','plan'].includes(state))level=1;
 const values=[null,[.35,12,6,1,4,.35],[.65,40,2.8,2,12,.58],[.95,76,1,3,21,.82]][level];
 if(level===2&&phase===0){values[2]=2.5;values[4]=14;}else if(level===2&&phase===1){values[2]=3;values[4]=10;}
 const root=document.documentElement;root.style.setProperty('--accent',colors[c.color]);['--brightness','--spread','--period','--layers','--gap','--glass-opacity'].forEach((name,i)=>root.style.setProperty(name,values[i]+([1,4].includes(i)?'px':i===2?'s':'')));
 $('#expression-area').dataset.layers=String(values[3]);$('#expression-area').dataset.state=state;$('#expression-area').dataset.style=style;
 $('#state-label').textContent=c.label;$('#intensity').textContent=`I${level} · ${['','轻感知','待确认','强介入'][level]}`;
 $('#motion-caption').textContent=style==='line'?`${Math.round(values[0]*100)}% 亮度 · ${values[1]}px 弥散 · ${values[2]}s 呼吸`:`${values[3]} 层玻璃 · ${values[4]}px 层距 · ${Math.round(values[5]*100)}% 透明度`;
 $('#dialogue-title').textContent=c.title;$('#dialogue-text').textContent=c.text;$('#node-tag').textContent=c.node;$('#user-line').textContent=c.hint;
 $('#condition-chips').replaceChildren(...c.chips.map(t=>{const s=document.createElement('span');s.textContent=t;return s;}));
 $('#action-buttons').replaceChildren(...c.buttons.map(([label,fn,cls])=>{const b=document.createElement('button');b.textContent=label;b.className=cls||'';b.onclick=fn;return b;}));
 $('#presence').innerHTML='<i></i>'+({welcome:'随时为你',understand:'认真理解',plan:'为你安排',risk:'优先守护',protecting:'优先守护',protected:'等待检查',takeover:'等待交回',finish:'晚餐就绪'}[state]||'陪你协作');
 $('#phase-note').textContent=phaseNotes[phase];$('#meal-meta').textContent=`${meal.people} 人晚餐 · ${meal.time} 开饭 · ${meal.preference}`;
 $('#timeline').replaceChildren(...stages.map((t,i)=>{const d=document.createElement('div');d.className='timeline-item '+(i===stageIndex[state]?'active':i<stageIndex[state]?'done':'');d.innerHTML=`<b>0${i+1}</b>${t}`;return d;}));
 const running=['cooking','action','finishing'].includes(state);$('#risk').disabled=!running;$('#takeover').disabled=!running;$('#edit-meal').disabled=!['welcome','understand','plan'].includes(state);
 $('#scene-caption').textContent=['risk','protecting','protected'].includes(state)?'异常保护演练':state==='finish'?'晚餐已就绪':running?'多设备协同中':state==='takeover'?'已由你接管':'晚餐准备中';
 $('#progress-hint').textContent=c.hint;
 kitchen?.setState(state,colors[c.color]);updateDevice();updateVoiceContent();
}
function syncSound(){
 $('#sound').setAttribute('aria-pressed',String(sound));
 $('#sound').title=sound?'关闭语音播报':'开启语音播报';
 $('#sound').innerHTML='♫ <span>'+(sound?'语音开启':'语音关闭')+'</span>';
}
function enableSound(){sound=true;syncSound();}
function stopSpeech(){narrator.stop();}
function speak(force=false){
 stopSpeech();const c=config();
 if(!sound)return;
 if(c.quiet&&!force){$('#speech-status').textContent='常规静默 · 可重播';return;}
 narrator.play(speechFor(state,phase,meal));
}
function go(next){stopTimers();stopSpeech();state=next;render();speak();
 if(next==='starting')afterNarration(()=>{go('cooking');flashSuccess();},3200);
 if(next==='resuming')afterNarration(()=>{go(returnState);flashSuccess();},2600);
 if(next==='cooking')afterNarration(()=>go('action'),10000);
 if(next==='finishing')afterNarration(()=>go('finish'),6500);
 if(next==='protecting')afterNarration(()=>go('protected'),2600);
 if(next==='finish')later(()=>{document.documentElement.style.setProperty('--accent',colors.blue);kitchen?.setState(state,colors.blue);},2200);
}
function flashSuccess(){document.documentElement.style.setProperty('--accent',colors.green);later(()=>document.documentElement.style.setProperty('--accent',colors.blue),1500);}
function editMeal(){$('#people').value=meal.people;$('#dinner-time').value=meal.time;$('#preference').value=meal.preference;$('#meal-dialog').showModal();}
function restart(){device=null;$('#device-popover').hidden=true;go('welcome');kitchen?.setView('overview');}
function updateDevice(){if(!device)return;$('#device-name').textContent=deviceNames[device];const active=['cooking','action','finishing'].includes(state),paused=['protected','recovered','takeover'].includes(state);let text='待机 · 尚未启动';
 if(device==='fridge')text='冷藏室 4°C · 三文鱼、时蔬库存已登记（模拟）';
 else if(state==='starting'||state==='resuming')text='指令已提交 · 等待运行回执';
 else if(['risk','protecting'].includes(state))text=device==='stove'?'过温告警 · 加热关闭状态尚未确认':device==='hood'?'模拟回执：继续排烟':'暂停请求已提交 · 待回执';
 else if(active)text={stove:'模拟回执：正在加热 · 本次煎鱼程序',hood:'模拟回执：低档排烟运行中',oven:'模拟回执：时蔬程序运行中'}[device];
 else if(paused)text=device==='hood'?'模拟回执：继续排烟':'模拟回执：加热暂停 · 不自动恢复';
 else if(state==='finish')text=device==='hood'?'模拟回执：延时排烟中':'模拟回执：烹饪程序已结束';
 $('#device-status').textContent=text;
}
function selectDevice(id){device=id;$('#device-popover').hidden=false;updateDevice();}
$('#sound').onclick=()=>{sound=!sound;syncSound();if(sound)speak(true);else stopSpeech();};
$('#replay').onclick=()=>{if(!sound)$('#sound').click();else speak(true);};
document.querySelectorAll('[data-phase]').forEach(b=>b.onclick=()=>{phase=Number(b.dataset.phase);document.querySelectorAll('[data-phase]').forEach(x=>x.classList.toggle('active',x===b));stopSpeech();render();speak();});
document.querySelectorAll('button[data-style]').forEach(b=>b.onclick=()=>{style=b.dataset.style;document.querySelectorAll('button[data-style]').forEach(x=>x.classList.toggle('active',x===b));render();});
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{kitchen?.setView(b.dataset.view);document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('active',x===b));});
$('#reset-view').onclick=()=>{kitchen?.setView('overview');document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('active',x.dataset.view==='overview'));};
$('#risk').onclick=()=>{returnState=state;go('risk');kitchen?.setView('stove');};$('#takeover').onclick=()=>{returnState=state;go('takeover');};
$('#restart').onclick=restart;$('#edit-meal').onclick=editMeal;$('#about').onclick=()=>$('#about-dialog').showModal();$('#close-device').onclick=()=>{$('#device-popover').hidden=true;device=null;};
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>document.getElementById(b.dataset.close).close());
$('#meal-form').onsubmit=e=>{e.preventDefault();meal={people:$('#people').value,time:$('#dinner-time').value,preference:$('#preference').value};$('#meal-dialog').close();go('understand');};
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopSpeech();});
const narrator=new Narrator(({status,script,time=0,duration=0})=>{
 const names={idle:sound?'语音已开启':'语音关闭',loading:'音频加载中',playing:'正在讲述',ended:'播报结束',error:'音频加载失败 · 可重试',blocked:'请点击重播以允许播放'};
 $('#speech-status').textContent=names[status];
 $('#expression-area').classList.toggle('speaking',status==='playing');
 $('#expression-area').dataset.playback=status;
 $('#voice-progress').value=duration>0?time/duration:status==='ended'?1:0;
 $('#voice-stop').disabled=!['loading','playing'].includes(status);
 $('#playback-status').textContent=names[status];
 if(script)$('#spoken-text').textContent=script.text;
});
function updateVoiceContent(){
 $('#voice-current').textContent=speechFor(state,phase,meal).text;
 $('#voice-label').textContent=narrator.voice==='male'?'男声 · 稳重':'女声 · 沉静';
 $('#voice-library').replaceChildren(...Object.entries(scripts).filter(([key])=>key!=='audition').map(([key,item])=>{
  const speech=speechFor(key,phase,meal);const row=document.createElement('div');row.className='voice-row';
  const name=document.createElement('strong');name.textContent=item.name;
  const text=document.createElement('p');text.textContent=speech.text;
  const play=document.createElement('button');play.textContent='▶ 试听';play.setAttribute('aria-label','试听'+item.name);play.onclick=()=>{enableSound();narrator.play(speech);};
  row.append(name,play,text);return row;
 }));
}
$('#voice-settings').onclick=()=>{$('#voice-dialog').showModal();updateVoiceContent();};
$('#voice-label').onclick=()=>$('#voice-settings').click();
document.querySelectorAll('[data-voice]').forEach(b=>b.onclick=()=>{
 stopSpeech();narrator.voice=b.dataset.voice;
 document.querySelectorAll('[data-voice]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});updateVoiceContent();
});
$('#voice-audition').onclick=()=>{enableSound();narrator.play(speechFor('audition',0,meal));};
$('#voice-current-play').onclick=()=>{enableSound();speak(true);};
$('#voice-stop').onclick=stopSpeech;
$('#voice-rate').onchange=e=>narrator.setRate(Number(e.target.value));
$('#voice-volume').oninput=e=>{narrator.setVolume(Number(e.target.value)/100);$('#volume-value').textContent=e.target.value+'%';};
render();
import('./scene.js').then(({createKitchen})=>{kitchen=createKitchen($('#scene'),$('#hotspots'),selectDevice);render();}).catch(error=>{console.error('3D initialization failed',error);$('#scene-fallback').hidden=false;});
