const nav=document.querySelector('#global-nav'),toggle=document.querySelector('#nav-toggle'),page=document.querySelector('.page'),detail=document.querySelector('#scene-detail');
document.querySelector('#scene-title').parentElement.append(toggle);
toggle.setAttribute('aria-label','切换场景');
const shade=document.createElement('div');shade.className='scene-backdrop';shade.hidden=true;document.body.append(shade);
const close=document.createElement('button');close.className='scene-close';close.textContent='关闭 ×';nav.querySelector('.site-header').append(close);
nav.setAttribute('role','dialog');nav.setAttribute('aria-modal','true');nav.setAttribute('aria-label','场景切换');
let previousFocus=null;
function showNav(show){const wasOpen=!nav.classList.contains('nav-hidden');if(show&&!wasOpen)previousFocus=document.activeElement;nav.classList.toggle('nav-hidden',!show);nav.inert=!show;shade.hidden=!show;page.inert=show;toggle.setAttribute('aria-expanded',String(show));toggle.textContent='⌄';if(show&&!wasOpen)nav.querySelector('#scenes button.active')?.focus({preventScroll:true});if(!show&&wasOpen)(previousFocus?.isConnected?previousFocus:toggle)?.focus({preventScroll:true});}
toggle.onclick=()=>showNav(true);close.onclick=()=>showNav(false);shade.onclick=()=>showNav(false);
document.querySelector('#scenes').addEventListener('click',e=>{if(e.target.closest('button'))showNav(false);});
window.addEventListener('wheel',e=>{if(Math.abs(e.deltaY)<10)return;if(!nav.classList.contains('nav-hidden')){if(e.deltaY>0)showNav(false);return;}if(!e.target.closest('.detail-scroll,.steps,dialog,.basis'))showNav(e.deltaY<0);},{passive:true});
let lastY=null;window.addEventListener('touchstart',e=>{lastY=e.touches[0]?.clientY;},{passive:true});window.addEventListener('touchmove',e=>{const y=e.touches[0]?.clientY;if(lastY!==null&&Math.abs(y-lastY)>14&&!e.target.closest('.detail-scroll,.steps,dialog,.basis'))showNav(y>lastY);lastY=y;},{passive:true});
window.addEventListener('keydown',e=>{if(e.key==='Escape'){showNav(false);detail.open=false;}if(e.key==='Tab'&&!nav.classList.contains('nav-hidden')){const items=[...nav.querySelectorAll('a,button')].filter(e=>!e.disabled);const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
detail.addEventListener('mouseenter',()=>detail.open=true);detail.addEventListener('mouseleave',()=>{if(!detail.contains(document.activeElement))detail.open=false;});detail.addEventListener('focusin',()=>detail.open=true);detail.addEventListener('focusout',e=>{if(!detail.contains(e.relatedTarget))detail.open=false;});
showNav(false);
const observer=new ResizeObserver(()=>window.dispatchEvent(new Event('resize')));observer.observe(document.querySelector('.room-frame'));
