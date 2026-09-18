const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const groups=['初始化','行为动作','日志复盘','迭代优化'];
// Editorial crosswalk, not a claim of identical capabilities. Node IDs retain workbook order.
const setupMap=[[[0],[0],[],[0]],[[0],[0,1],[],[1]],[[0],[1],[2],[2]],[[0],[0],[],[0]],[[0],[0,1],[1],[1]],[[0],[0],[],[1]]];
const short=['华为','小米','苹果','Google','三星','LG'];
const actionMap=[[[2],[3,4],[6],[4,6]],[[2],[3],[4,5],[4,5]],[[3,4],[5,6],[7],[8]],[[2],[3,4],[5],[5]],[[2],[3],[4],[4]],[[2],[3],[4],[5]]];
const reviewMap=[[[7],[],[]],[[],[],[]],[[9],[],[]],[[6],[],[]],[[5],[],[]],[[6],[],[]]];
const improveMap=[[[7],[7],[]],[[6],[6],[]],[[10],[],[]],[[7],[],[]],[[6],[6],[]],[[7],[7],[]]];
export function groupFor(n){
 if(/优化建议|个性化作息建议|手动调整后续|手动修改后续/.test(n.title))return 3;
 if(/复盘|报告|摘要/.test(n.title))return 2;
 if(/初始化/.test(n.behavior))return 0;
 return 1;
}
export function matches(brand,context){
 if(context.task!==0)return [];
 if(context.stage===0)return setupMap[brand]?.[context.moment]||[];
 return [null,actionMap,reviewMap,improveMap][context.stage]?.[brand]?.[context.moment]||[];
}
export function installCompetitors({pause}){
 const entryButton=document.createElement('button');entryButton.className='node-competitor-entry';entryButton.textContent='查看竞品做法 ↗';entryButton.setAttribute('aria-haspopup','dialog');
 const comparison=document.createElement('dialog');comparison.id='competitor-comparison';comparison.setAttribute('aria-labelledby','comparison-heading');document.body.append(comparison);
 let compareBrand=0,compareOpener=null;
 const dialog=document.createElement('dialog');dialog.id='competitor-dialog';dialog.setAttribute('aria-labelledby','competitor-heading');document.body.append(dialog);
 let data=[],error=false,context=null,brand=0,node=null,entry=null,opener=null;
 const available=i=>matches(i,context).filter(id=>{const n=data[i]?.nodes.find(n=>n.id===id);return n&&String(n.expression||'').trim()!=='/'&&String(n.expression||'').trim().length>1;});
 const refsFor=n=>data[brand].sources.filter(s=>String(s.mapping).match(/\d+/g)?.includes(String(n.id+1)));
 const image=(i,note)=>`<figure><img src="${esc(i.file)}" loading="lazy" alt="${esc(note||'调研表中的品牌资料画面')}"><figcaption>${esc(note||'原调研表嵌入图片')}</figcaption></figure>`;
 function references(refs){return refs.map(s=>{const url=String(s.text).match(/https?:\/\/[^\s]+/)?.[0];return `<article class="competitor-source">${url?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(String(s.text).split('https')[0].trim()||new URL(url).hostname)} ↗</a>`:`<strong>${esc(s.text)}</strong>`}<p>${esc(s.excerpt)}</p><small>表内对应：${esc(s.mapping||'未标注节点')}</small></article>`;}).join('');}
 function renderInline(){
 if(!context)return;
 const heading=document.querySelector('#moment-overview h3');
 if(heading&&!heading.parentElement.classList.contains('node-heading-row')){const row=document.createElement('div');row.className='node-heading-row';heading.before(row);row.append(heading,entryButton);}
 entryButton.disabled=!data.length;entryButton.title=error?'调研资料加载失败，请刷新重试':!data.length?'正在载入调研资料':'并排查看当前节点与竞品对应步骤';
 if(!data.length)return;
 if(!available(compareBrand).length)compareBrand=data.findIndex((b,i)=>available(i).length);
 entryButton.onclick=()=>{compareOpener=entryButton;pause();renderComparison();comparison.showModal();};
 }
 function brandPicks(){return `<div class="competitor-brand-picks" aria-label="选择对照品牌">${data.map((b,i)=>`<button data-compare-brand="${i}" aria-pressed="${i===compareBrand}" ${available(i).length?'':'disabled title="暂无对应调研资料"'}>${short[i]}</button>`).join('')}</div><p class="competitor-muted">灰色：暂无对应资料或仅有未证实的占位节点。完整流程中仍可查看原始记录。</p>`;}
 function comparisonHTML(expanded){
 if(compareBrand<0)return '<p class="competitor-empty">此时间点暂无可对应的竞品调研资料。关闭后可通过「竞品完整流程」查看已整理内容。</p>';
 const b=data[compareBrand],ids=available(compareBrand),nodes=b.nodes.filter(n=>ids.includes(n.id));
 const rows=[['交互做法',`用户：${context.user}\nAI：${context.ai}`,nodes.map(n=>n.behavior).join('\n\n')],['信息与表达',context.expression,nodes.map(n=>n.expression).join('\n\n')]];
 const refs=b.sources.filter(s=>String(s.mapping).match(/\d+/g)?.some(id=>ids.includes(+id-1)));
 return `<p class="competitor-muted">相关步骤 · 非一一等同${context.mode&&context.mode!=='normal'?'；左侧为异常分支，右侧为相关调研步骤':''}</p><div class="comparison-matrix"><div class="comparison-head">COLMO 设计方案</div><div class="comparison-head">${esc(short[compareBrand])} · 竞品调研做法</div>${rows.map(([label,left,right])=>`<h4>${label}</h4><div class="comparison-cell">${esc(left||'具体设计待补充')}</div><div class="comparison-cell">${esc(right)}</div>`).join('')}</div>${expanded?`<div class="comparison-materials"><section><h3>COLMO 信息呈现</h3>${context.artwork||'<p class="competitor-muted">此时间点无独立卡片，以对话或设备反馈呈现。</p>'}</section><section><h3>竞品关联素材</h3><div class="competitor-gallery">${refs.flatMap(s=>s.images.map(i=>image(i,s.mediaNote))).join('')||'<p class="competitor-muted">现有调研未关联图片，以文字说明。</p>'}</div></section></div>`:''}<div class="comparison-links">${nodes.map(n=>`<button data-related="${n.id}">查看竞品节点 ${n.id+1} →</button>`).join('')}</div>`;
 }
 function bindComparison(root){root.querySelectorAll('[data-compare-brand]').forEach(btn=>btn.onclick=()=>{compareBrand=+btn.dataset.compareBrand;renderInline();if(comparison.open)renderComparison();});root.querySelectorAll('[data-related]').forEach(btn=>btn.onclick=()=>{brand=compareBrand;if(comparison.open)comparison.close();open(true,+btn.dataset.related);});}
 function renderComparison(){comparison.innerHTML=`<header class="competitor-header"><div><small>同节点对比 · ${esc(context.title)}</small><h2 id="comparison-heading">新方案与调研做法</h2></div><button data-close>关闭 ×</button></header><div class="comparison-scroll">${brandPicks()}${comparisonHTML(true)}</div>`;comparison.querySelector('[data-close]').onclick=()=>comparison.close();bindComparison(comparison);}
 comparison.addEventListener('close',()=>compareOpener?.focus());
 function renderDialog(){
 const b=data[brand],n=b.nodes.find(n=>n.id===node),ids=entry?matches(brand,{...entry,data}):[];
 dialog.innerHTML=`<header class="competitor-header"><div><small>晨间唤醒 · 竞品调研</small><h2 id="competitor-heading">竞品完整流程</h2></div><button data-close aria-label="关闭竞品流程">关闭 ×</button></header><nav class="competitor-tabs" aria-label="竞品品牌">${data.map((b,i)=>`<button data-brand="${i}" aria-pressed="${i===brand}">${short[i]}</button>`).join('')}</nav>${entry?`<div class="competitor-location">对照 COLMO「${esc(entry.title)}」 · ${ids.length?'相关步骤已在目录标注':'此品牌暂无对应资料'}<button data-overview>从头查看</button></div>`:''}<div class="competitor-workspace"><nav class="competitor-directory" aria-label="竞品完整流程目录"><button data-overview aria-current="${node===null?'step':'false'}">场景概况</button>${groups.map((g,gi)=>{const ns=b.nodes.filter(n=>groupFor(n)===gi);return `<h3>${g}</h3>${ns.length?ns.map(n=>`<button data-node="${n.id}" aria-current="${node===n.id?'step':'false'}"><span>${String(n.id+1).padStart(2,'0')}</span>${esc(n.title.replace(/^交互\s*\d+[｜|]/,''))}${ids.includes(n.id)?'<small>COLMO 相关步骤</small>':''}</button>`).join(''):'<p class="competitor-muted">现有调研未单独整理</p>'}`;}).join('')}</nav><main class="competitor-main">${n?nodeHTML(n):`<h2>${esc(b.name)}</h2><p class="competitor-lead">${esc(b.tone)}</p><h3>场景概况</h3><p>${esc(b.overview)}</p><h3>调研支持范围</h3><p>${esc(b.support)}</p><p class="competitor-muted">以下为用户提供调研表的整理内容，未进行本轮独立事实核验。未证实不代表品牌不具备该能力。</p><button data-node="0" class="competitor-primary">从第一个节点开始 →</button><details><summary>全部资料来源（${b.sources.length}）</summary>${references(b.sources)}</details>`}</main></div>`;
 dialog.querySelector('[data-close]').onclick=()=>dialog.close();
 dialog.querySelectorAll('[data-overview]').forEach(btn=>btn.onclick=()=>{node=null;renderDialog();});
 dialog.querySelectorAll('[data-node]').forEach(btn=>btn.onclick=()=>{node=+btn.dataset.node;renderDialog();});
 dialog.querySelectorAll('[data-brand]').forEach(btn=>btn.onclick=()=>{brand=+btn.dataset.brand;node=entry?(matches(brand,{...entry,data})[0]??null):null;renderDialog();renderInline();});
 dialog.querySelector('[aria-current="step"]')?.scrollIntoView({block:'nearest'});
 }
 function nodeHTML(n){const refs=refsFor(n),imgs=refs.flatMap(s=>s.images.map(i=>({i,note:s.mediaNote})));return `<p class="competitor-muted">${esc(data[brand].name)} · 节点 ${n.id+1} / ${data[brand].nodes.length}</p><h2>${esc(n.title.replace(/^交互\s*\d+[｜|]/,''))}</h2><h3>用户与系统如何交互</h3><p>${esc(n.behavior)}</p><h3>触发时机</h3><p>${esc(n.trigger)}</p><h3>终端与表达方式</h3><p>${esc(n.expression)}</p>${imgs.length?`<div class="competitor-gallery">${imgs.map(({i,note})=>image(i,note)).join('')}</div>`:'<p class="competitor-muted">该节点暂无关联图片，当前以表内文字资料说明。</p>'}${n.analysis&&!/^同交互/.test(n.analysis)?`<h3>表内设计策略分析</h3><p>${esc(n.analysis)}</p>`:''}<details><summary>资料依据（${refs.length}）</summary>${refs.length?references(refs):'<p>表中未标注该节点的直接来源，请勿将流程标题视为已证实能力。</p>'}</details><div class="competitor-pagination">${n.id?`<button data-node="${n.id-1}">← 上一节点</button>`:'<button data-overview>场景概况</button>'}${n.id<data[brand].nodes.length-1?`<button data-node="${n.id+1}">下一节点 →</button>`:'<span>已到最后一个节点</span>'}</div>`;}
 function open(deep=false,id=null){if(!data.length)return;opener=document.activeElement;pause();entry=deep?{...context}:null;node=deep?id:null;renderDialog();dialog.showModal();dialog.querySelector('[data-close]').focus();}
 dialog.addEventListener('close',()=>{dialog.querySelectorAll('audio,video').forEach(e=>e.pause());opener?.focus();});
 fetch('./competitor-data.json').then(r=>{if(!r.ok)throw Error('load');return r.json();}).then(d=>{data=d;renderInline();}).catch(()=>{error=true;renderInline();});
 const all=document.querySelector('#competitor');all.textContent='竞品完整流程 ↗';all.onclick=()=>open(false);
 return {update(next){context=next;renderInline();}};
}
