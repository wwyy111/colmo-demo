// One cancellable clock owns shots, media position and physical scene progress.
export function createPresentation(onStage,onStop,onTick=()=>{},pauseBeforeNext=()=>false,canAdvance=()=>true){
 let shots=[],index=-1,offset=0,anchor=0,running=false,completed=false,raf=0,revision=0;
 const total=()=>shots.reduce((sum,s)=>sum+s.duration,0);
 const before=i=>shots.slice(0,i).reduce((sum,s)=>sum+s.duration,0);
 const local=()=>offset+(running?performance.now()-anchor:0);
 function tick(){
  if(!running)return;const elapsed=local();
  if(elapsed>=shots[index].duration){
   if(!canAdvance(shots[index])){offset=shots[index].duration;anchor=performance.now();onTick(shots[index],1,offset);raf=requestAnimationFrame(tick);return;}
   if(index===shots.length-1){offset=shots[index].duration;running=false;completed=true;onTick(shots[index],1,offset);onStop('complete');return;}
   if(pauseBeforeNext(shots[index],shots[index+1])){offset=shots[index].duration;running=false;onTick(shots[index],1,offset);onStop('timepoint-end');return;}
   enter(index+1,0);return;
  }
  onTick(shots[index],Math.min(1,elapsed/shots[index].duration),elapsed);raf=requestAnimationFrame(tick);
 }
 function enter(i,at=0){
  cancelAnimationFrame(raf);index=i;offset=at;anchor=performance.now();completed=false;
  const token=++revision;onStage(shots[index],offset);onTick(shots[index],offset/shots[index].duration,offset);
  if(running&&token===revision)raf=requestAnimationFrame(tick);
 }
 function stop(reason='pause'){const was=running;if(was)offset=local();running=false;revision++;cancelAnimationFrame(raf);if(was)onStop(reason);}
 function setSequence(next){stop();shots=next;index=-1;offset=0;completed=false;}
 function start(i=0){stop();if(!shots.length)return;running=true;enter(Math.max(0,Math.min(shots.length-1,i)));}
 function resume(){if(running)return;if(index<0||completed){start();return;}running=true;if(offset>=shots[index].duration&&index<shots.length-1){enter(index+1,0);return;}anchor=performance.now();const token=++revision;onStage(shots[index],offset);onTick(shots[index],offset/shots[index].duration,offset);if(running&&token===revision)raf=requestAnimationFrame(tick);}
 function seek(ms){if(!shots.length)return;const was=running;stop();let t=Math.max(0,Math.min(total()-1,ms)),i=0;while(i<shots.length-1&&t>=shots[i].duration)t-=shots[i++].duration;running=was;enter(i,t);}
 function show(i){stop();if(shots.length)enter(Math.max(0,Math.min(i,shots.length-1)),0);}
 return {setSequence,start,stop,resume,seek,show,get running(){return running;},get completed(){return completed;},get total(){return total();},get sequence(){return shots;},get shot(){return shots[index];},get elapsed(){return index<0?0:completed?total():before(index)+local();}};
}
