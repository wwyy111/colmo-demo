// Interaction 1 only. A cancellable clock keeps old runs from changing new views.
export const sequence = [
  {id:'overview',label:'全景概览',duration:4000},
  {id:'walking',label:'走向中控屏',duration:4600},
  {id:'request',label:'用户描述需求',duration:3200},
  {id:'configure',label:'表达需求',moment:0,duration:4500},
  {id:'normal',label:'推荐方案',moment:1,duration:8500},
  {id:'experience',label:'确认体验 · 内容预览',moment:2,duration:6500},
  {id:'feedback',label:'反馈与确认 · 内容预览',moment:3,duration:8500},
];
export function createPresentation(onStage,onStop){
 let timer=null,version=0,running=false,index=-1,remaining=0,started=0,completed=false;
 const total=sequence.reduce((n,s)=>n+s.duration,0);
 function schedule(){const token=++version;started=performance.now();timer=setTimeout(()=>{if(token!==version)return;if(index===sequence.length-1){completed=true;remaining=0;running=false;onStop('演示完成');return;}enter(index+1);},remaining);}
 function enter(i){index=i;remaining=sequence[i].duration;running=true;onStage(sequence[i]);schedule();}
 function stop(reason='已暂停'){version++;clearTimeout(timer);if(running)remaining=Math.max(0,remaining-(performance.now()-started));const was=running;running=false;if(was)onStop(reason);}
 function start(){stop();completed=false;enter(0);}
 function resume(){if(running)return;if(index<0||completed){start();return;}running=true;schedule();}
 function seek(ms){const active=running;stop();completed=false;let t=Math.max(0,Math.min(total-1,ms)),i=0;while(i<sequence.length-1&&t>=sequence[i].duration)t-=sequence[i++].duration;index=i;remaining=sequence[i].duration-t;running=active;onStage(sequence[i],t);if(active)schedule();}
 return {start,stop,resume,seek,get running(){return running;},get completed(){return completed;},get total(){return total;},get elapsed(){if(index<0)return 0;if(completed)return total;return sequence.slice(0,index).reduce((n,s)=>n+s.duration,0)+sequence[index].duration-remaining+(running?performance.now()-started:0);}};
}
