import {flowSource} from './flow-source.js';
import {flowLinks,flowScripts,initialTasks,changeTask} from './flow-model.js';
export function initFlow({navigate,speak}){
 const $=s=>document.querySelector(s);let tab='T01',selected=11,tasks=initialTasks(),lastScript=null;
 const button=(text,fn,cls='')=>{const b=document.createElement('button');b.textContent=text;b.onclick=fn;b.className=cls;return b;};
 const titles={P0:'配置与联测',T01:'无感唤醒',T02:'环境就绪',T03:'用水就绪',P2:'统一收口',P3:'日志复盘',P4:'可回滚优化'};
 function render(){
 $('#flow-stages').replaceChildren(...flowSource.scene.columns.map(c=>{const b=button(titles[c.id],()=>{tab=c.id;render();},tab===c.id?'active':'');b.setAttribute('aria-pressed',String(tab===c.id));return b;}));
 const column=flowSource.scene.columns.find(c=>c.id===tab);
 $('#flow-column-title').textContent=column.title;$('#flow-node-count').textContent=`${column.nodes.filter(n=>n.type==='交互节点').length} 个流程节点 · ${column.nodes.filter(n=>n.type!=='交互节点').length} 条需求与风险说明`;
 const lanes=[];
 for(const lane of flowSource.lanes){const ns=column.nodes.filter(n=>n.lane===lane.id);if(!ns.length)continue;const section=document.createElement('section');section.className='flow-lane';const h=document.createElement('h4');h.textContent=lane.label;section.append(h);const grid=document.createElement('div');grid.className='flow-lane-cards';
 for(const n of ns){const card=document.createElement('article');card.className='flow-card'+((flowLinks[n.id]||[]).includes(selected)?' connected':'');const name=document.createElement('strong');name.textContent=n.title;const desc=document.createElement('p');desc.textContent=n.desc;const meta=document.createElement('small');meta.textContent=n.id+' · '+(flowSource.cats[n.cat]?.name||n.cat);card.append(name,desc,meta);
 if(flowLinks[n.id]){const links=document.createElement('div');links.className='flow-node-links';for(const num of flowLinks[n.id])links.append(button('查看 N'+String(num).padStart(3,'0'),()=>navigate(num)));card.append(links);}grid.append(card);}
 section.append(grid);lanes.push(section);}
 $('#flow-lanes').replaceChildren(...lanes);
 }
 function renderTasks(){$('#branch-failure').disabled=tasks.wake.includes('提醒已暂停');for(const [key,value] of Object.entries(tasks))$('#task-'+key).textContent=value;$('#flow-unified').textContent=`唤醒：${tasks.wake}；卧室：${tasks.environment}；用水：${tasks.water}。`;}
 for(const [id,num] of [['snooze',17],['water',27],['failure',16]])$('#branch-'+id).onclick=()=>{tasks=changeTask(tasks,id);lastScript=id;renderTasks();$('#flow-feedback').textContent=flowScripts[id];navigate(num,true);};
 $('#flow-listen').onclick=()=>{if(lastScript)speak({id:'flow-'+lastScript,text:flowScripts[lastScript]});else{$('#flow-feedback').textContent='先选择一个分支，再听对应的管家反馈。';}};
 $('#flow-reset').onclick=()=>{document.querySelectorAll('[data-feeling]').forEach(x=>x.setAttribute('aria-pressed','false'));tasks=initialTasks();lastScript=null;renderTasks();$('#flow-feedback').textContent='独立协作样例：三个任务均使用预置状态，操作只改变所选任务。';};
 for(const b of document.querySelectorAll('[data-feeling]'))b.onclick=()=>{lastScript='feedback';$('#flow-feedback').textContent=`已记录「${b.dataset.feeling}」· ${flowScripts.feedback}`;document.querySelectorAll('[data-feeling]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));};
 document.addEventListener('colmo-node-change',e=>{selected=e.detail.number;tab=selected<=2||selected===11||selected===12||selected===22||selected===23?'P0':[9,10,20,21,30,31].includes(selected)?'P4':[8,19,29].includes(selected)?'P3':[7,18,28].includes(selected)?'P2':selected<=10?'T02':selected<=21?'T01':'T03';render();});
 render();renderTasks();
}
