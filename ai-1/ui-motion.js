const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
export function crossfadeCard(media,oldCard){
 if(reduced())return;
 if(!oldCard)return ()=>media.querySelector('.scene-card-fit')?.animate([{opacity:0},{opacity:1}],{duration:220,easing:'ease-out'});
 const box=oldCard.getBoundingClientRect(),base=media.getBoundingClientRect(),ghost=oldCard.cloneNode(true);
 ghost.removeAttribute('id');ghost.setAttribute('aria-hidden','true');ghost.classList.add('card-transition-ghost');
 Object.assign(ghost.style,{position:'absolute',left:box.left-base.left+'px',top:box.top-base.top+'px',width:box.width+'px',height:box.height+'px',pointerEvents:'none',transform:'none'});
 return ()=>{media.append(ghost);ghost.animate([{opacity:1},{opacity:0}],{duration:150,easing:'ease-out'}).finished.catch(()=>{}).finally(()=>ghost.remove());const next=media.querySelector('.scene-card-fit');next?.animate([{opacity:0},{opacity:1}],{duration:220,easing:'ease-out'});};
}
export function installUIMotion(){
 for(const selector of ['#steps','#visual-tabs','#channels','#tasks']){
  const nav=document.querySelector(selector);let previous=null,queued=false;
  function update(){queued=false;const b=nav.querySelector('button.active');if(!b||!nav.offsetWidth)return;
   let indicator=nav.querySelector('.selection-slider');if(!indicator){indicator=document.createElement('i');indicator.className='selection-slider';indicator.setAttribute('aria-hidden','true');nav.append(indicator);}
   const next={x:b.offsetLeft,y:b.offsetTop,w:b.offsetWidth,h:b.offsetHeight};
   Object.assign(indicator.style,{width:next.w+'px',height:next.h+'px',transform:`translate(${next.x}px,${next.y}px)`});
   if(previous&&!reduced()&&JSON.stringify(previous)!==JSON.stringify(next)){indicator.getAnimations().forEach(a=>a.cancel());indicator.animate([{transform:`translate(${previous.x}px,${previous.y}px) scale(${previous.w/next.w},${previous.h/next.h})`},{transform:`translate(${next.x}px,${next.y}px) scale(1,1)`}],{duration:230,easing:'cubic-bezier(.22,1,.36,1)'});}
   previous=next;
  }
  nav.classList.add('motion-selection');new MutationObserver(records=>{if(records.every(r=>r.target.closest?.('.selection-slider')))return;if(!queued){queued=true;requestAnimationFrame(update);}}).observe(nav,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden']});
  new ResizeObserver(update).observe(nav);update();
 }
 const animations=new WeakMap(),targets=new WeakMap();
 document.addEventListener('click',e=>{
  const summary=e.target.closest('summary');if(!summary)return;const details=summary.parentElement;
  if(!details.matches('.intervention,.basis,.setup-rules')||reduced())return;
  e.preventDefault();const from=details.getBoundingClientRect().height,opening=!(targets.get(details)??details.open);animations.get(details)?.cancel();targets.set(details,opening);
  details.style.height='';details.open=true;const to=opening?details.getBoundingClientRect().height:summary.getBoundingClientRect().height+parseFloat(getComputedStyle(details).paddingTop)+parseFloat(getComputedStyle(details).paddingBottom)+2;
  details.style.overflow='hidden';const a=details.animate([{height:from+'px'},{height:to+'px'}],{duration:220,easing:'cubic-bezier(.22,1,.36,1)'});animations.set(details,a);
  a.onfinish=()=>{details.open=opening;details.style.overflow='';targets.delete(details);animations.delete(details);};
 });
}
