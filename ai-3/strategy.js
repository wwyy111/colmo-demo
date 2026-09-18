import {icon} from '../ai-1/icons.js';
import {installUIMotion} from '../ai-1/ui-motion.js';
import {createKitchen} from './scene.js';
const $=s=>document.querySelector(s);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const groups=['初始化','行为动作','日志复盘','迭代优化'];
const tasks=['食材管理','饮食规划','餐前准备','烹饪中多设备协同','餐后洗碗 / 清洁'];
const groupTitles=['建立食材管理方案','记录、取用与处理食材','回看食材变化与使用反馈','调整并验证管理规则'];
const descriptions=['复用获准使用的家庭偏好，核对权限与提醒范围后开始管理。','沿购物、入库、取放、选菜与风险处理的用户动线，接续同一份食材记录。','区分实际发生的库存变化与待核实事项，将用户反馈接到后续改进。','先看清各端职责和修改范围，再确认、同步、试行与复核。'];
const innovations={
 N082:'从逐项填写转为审核方案：复用已授权的家庭偏好与设备能力，用户只需确认或修改管理方式；权限仍逐项确认。',
 N083:'把记录前移到购物完成时：电子小票或用户导入记录先形成待入库清单，回家后接续，不必逐件重新扫码。',
 N084:'把冰箱内外食材汇入同一份库存：实物识别与购物记录匹配去重，手机可补录常温食品；同一食材卡在各端同步，按需输出标签。',
 N085:'在整理食材的动作中接住必要补充：识别完整则跳过，缺项或纠错才进入有效语音会话。免唤醒须预先授权，声纹不代替权限。',
 N086:'让食材记录沿用户动线接续到做菜计划：手机选菜、厨房查看时无需重述已有食材；传递的是计划，设备启动另行确认。',
 N087:'通过取放前后的变化形成可纠正记录，减少每次手动记账。明确授权且证据充分才可自动提交；未操作不视为同意。',
 N089:'把临期卡片接到选菜推荐，同时将设备异常单独分流。食材建议与设备安全联动分别解释，不用一个提醒混合处理。',
 N090:'从“尽快食用”转为“下一餐怎么用”：基于现有食材提出 1—3 个选择，优先不增加采购；日程仅在获准时参与。',
 N091:'从单条风险通知转为家庭范围的待处理清单：汇总匹配批次的数量与位置，并持续保留未处理项，避免“已查看”被当成完成。',
 'D-S1-REV1':'将存取与处理事件变成中控即时摘要和手机每日回看，支持补货判断；异常取用只提出核实，不直接判定消耗或浪费。',
 'D-S1-REV2':'让自然语言反馈接入改进流程：拆解问题、期望和范围，区分当次修改与长期优化，不让一次评价直接改写规则。',
 'D-S1-SET1':'从逐端设置转为选择跨端分工组合：明确手机主提醒、冰箱看汇总等不同职责，用户可在同一端完成配置。',
 N092:'把新需求变成可撤回的试运行：先说明改动、范围与时限，再确认试行；结束后追问具体效果，由用户决定采用或恢复。'
};

let data=[],task=0,group=0,index=0,kitchen=null,channel='visual',visual='cards';
const points=()=>data.filter(n=>n.group===groups[group]);
function button(label,fn,active=false){const b=document.createElement('button');b.textContent=label;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));b.onclick=fn;return b;}
function chooseTask(i){task=i;index=0;group=0;document.title='COLMO · AI 辅助烹饪 · '+tasks[i];$('#tasks').querySelectorAll('button').forEach((b,j)=>{b.classList.toggle('active',i===j);b.setAttribute('aria-pressed',String(i===j));});$('#task-goal').textContent=i===0?'存取后库存尽量自动更新，随时查看食材位置、临期状态和下一步建议。':'此任务的需求待补充。';$('#task-pain').textContent=i===0?'食材分散、补录重复，识别与日期可能不准确，多端重复提醒造成打扰。':'此任务的用户痛点待补充。';render();history.replaceState(null,'','#S'+(i+1));}
function chooseGroup(i){group=i;index=0;render();$('.detail-scroll').scrollTop=0;}
function renderChannel(){
 $('#channels').replaceChildren(...[['visual','视觉'],['audio','听觉'],['haptic','触觉']].map(([v,t])=>button(t,()=>{channel=v;renderChannel();},channel===v)));
 $('#visual-tabs').hidden=channel!=='visual';
 $('#visual-tabs').replaceChildren(...[['avatar','管家形象'],['cards','信息呈现'],['devices','设备体验']].map(([v,t])=>button(t,()=>{visual=v;renderChannel();},visual===v)));
 const n=points()[index];
 const copy=channel==='visual'?(visual==='cards'?['信息呈现','暂未放入设计素材。以下先保留表格中各端接续与一致性的要求。',n?.handoff]:visual==='devices'?['设备体验','暂未制作设备执行动画，可在左侧查看厨房空间与设备位置。','']:['管家形象','本阶段暂不制作管家形象素材。','']):channel==='audio'?['听觉表达','提示音与 AI 管家语音素材待补充，当前不播放预设语音。','']:['触觉表达','触觉反馈设计待补充，当前不模拟设备振动。',''];
 $('#channel-content').innerHTML='<h3>'+copy[0]+'</h3><p class="muted">'+copy[1]+'</p>'+(copy[2]?'<p>'+esc(copy[2])+'</p>':'');
}
function render(){
 const populated=task===0,n=points()[index];
 $('#steps').hidden=!populated;$('.expression-layout').hidden=!populated;$('.intervention').hidden=!populated;$('#replay').disabled=true;$('#replay').title='本版暂未制作场景流程动画';
 $('#interaction-label').innerHTML=populated?'交互 '+(group+1)+' / <span class="interaction-stage">'+groups[group]+'</span>':'S'+(task+1);
 $('#interaction-title').textContent=populated?groupTitles[group]:tasks[task];
 $('#interaction-description').textContent=populated?descriptions[group]:'此场景暂未填充节点内容，本次先完成 S1 食材管理。';
 $('#category').textContent='';$('#category').hidden=true;
 $('#scene-time').textContent=populated?groups[group]:tasks[task];$('#scene-stage').textContent=populated?n.moment.replace(/^S1-\d-T\d+\s*/,''):'内容待补充';
 $('#story-number').textContent=populated?String(index+1).padStart(2,'0'):'';
 $('#user-story').textContent=populated?n.user:'此场景的交互时序待补充。';
 $('#next').disabled=!populated||(group===3&&index===points().length-1);
 if(!populated)return;
 $('#steps').replaceChildren(...groups.map((g,i)=>{const b=button('',()=>chooseGroup(i),i===group);b.innerHTML='<span>'+g+' · 0'+(i+1)+'</span><strong>'+groupTitles[i]+'</strong>';return b;}));
 $('#intervention-text').innerHTML='<ol class="intervention-points">'+points().filter(p=>innovations[p.id]).map(p=>'<li><strong>'+esc(p.title)+'</strong><span>'+esc(innovations[p.id])+'</span></li>').join('')+'</ol>';
 $('#basis-content').innerHTML='<p>来源：S1 网页节点内容表。本版保留用户确认、授权范围与待核实状态，不将未操作视为同意。</p><p>'+esc(n.condition)+'</p>';
 $('#timeline').replaceChildren(...points().map((p,i)=>{const b=button('',()=>{index=i;render();},i===index);b.innerHTML='<small>时间点 '+(i+1)+'</small><span>'+esc(p.title)+'</span>';return b;}));
 $('#phases').replaceChildren(...['信任建立期','协作磨合期','成熟托管期'].map((t,i)=>{const b=button(t,()=>{},i===0);b.disabled=i>0;return b;}));
 $('#moment-overview').innerHTML='<h3>'+esc(n.title)+'</h3><dl><div><dt>用户</dt><dd>'+esc(n.user)+'</dd></div><div><dt>AI</dt><dd>'+esc(n.ai)+'</dd></div></dl><details class="cooking-story"><summary>完整故事板</summary><p>'+esc(n.story)+'</p></details>';
 $('#branches').innerHTML='<label for="branch-select">情况演示</label><div class="branch-select-wrap"><select id="branch-select"><option>正常流程</option></select>'+icon('chevron-down')+'</div><details class="cooking-conditions"><summary>出现条件与分支说明</summary><p>'+esc(n.condition)+'</p></details>';
 $('#next').textContent=index===points().length-1?(group===3?'已到最后节点':'下一交互 →'):'下一时间点 →';
 renderChannel();
}
$('#next').onclick=()=>{if(index<points().length-1)index++;else if(group<3){group++;index=0;}render();};
$('#competitor').disabled=true;$('#competitor').title='暂无烹饪竞品调研资料';
$('#close-modal').onclick=()=>$('#modal').close();
$('#tasks').replaceChildren(...tasks.map((name,i)=>{const b=button('',()=>chooseTask(i),i===0);b.innerHTML='<b>0'+(i+1)+'</b>'+name;return b;}));
const scenes=['AI 晨间唤醒','AI 全屋空气托管','AI 辅助烹饪','AI 家庭洗衣房','全屋设备智能管家','全屋安防智能管家'];
$('#scenes').replaceChildren(...scenes.map((name,i)=>{const b=button(name,()=>{if(i===0)location.href='../ai-1/';},i===2);b.disabled=i!==0&&i!==2;return b;}));
try{const response=await fetch('./s1-content.json');if(!response.ok)throw Error('节点表加载失败');data=await response.json();chooseTask(Math.max(0,Math.min(4,Number(location.hash.replace('#S',''))-1||0)));}catch(e){$('#interaction-description').textContent='节点内容暂未加载，请刷新重试。';console.error(e);}
try{kitchen=createKitchen($('#scene'),$('#hotspots'),()=>{});kitchen.setState('welcome','139,205,231');}catch(e){$('#scene-error').hidden=false;console.error(e);}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{kitchen?.setView(b.dataset.view==='focus'?'fridge':b.dataset.view);document.querySelectorAll('[data-view]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});});
document.querySelector('[data-view="overview"]').classList.add('active');

installUIMotion();
