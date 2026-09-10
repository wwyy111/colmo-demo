// Playback uses bundled MP3s. No browser TTS service or credentials are required.
export class Narrator {
 constructor(onChange){this.onChange=onChange;this.voice='male';this.rate=1;this.volume=.8;this.audio=null;this.generation=0;this.busy=false;this.status='idle';}
 emit(status,extra={}){this.status=status;this.onChange({status,voice:this.voice,...extra});}
 stop(){this.generation++;clearTimeout(this.watchdog);this.busy=false;if(this.audio){this.audio.pause();this.audio.removeAttribute('src');this.audio.load();this.audio.remove();this.audio=null;}this.emit('idle');}
 async play(script){
  this.stop();const token=this.generation;this.busy=true;this.emit('loading',{script});
  const audio=document.createElement('audio');audio.preload='auto';audio.setAttribute('aria-label','COLMO 当前语音');audio.src=new URL(`./audio/${this.voice}/${script.id}.mp3`,import.meta.url).href;audio.volume=this.volume;audio.playbackRate=this.rate;audio.preservesPitch=true;document.querySelector('#audio-host').append(audio);this.audio=audio;
  const current=()=>token===this.generation;
  let watchdog;
  const settle=(status)=>{if(!current())return;clearTimeout(watchdog);this.busy=false;this.emit(status,{script});};
  audio.onplaying=()=>{if(current())this.emit('playing',{script});};
  audio.ontimeupdate=()=>{if(current())this.emit('playing',{script,time:audio.currentTime,duration:audio.duration});};
  audio.onwaiting=()=>{if(current())this.emit('loading',{script});};
  audio.onended=()=>settle('ended');audio.onerror=()=>settle('error');
  watchdog=this.watchdog=setTimeout(()=>{if(current()&&this.busy){audio.pause();settle('error');}},90000);
  // Clear the watchdog when interrupted, too; stale callbacks cannot change playback UI.
  audio.addEventListener('emptied',()=>clearTimeout(watchdog),{once:true});
  try{await audio.play();}catch(error){settle(error.name==='NotAllowedError'?'blocked':'error');}
 }
 setRate(rate){this.rate=rate;if(this.audio)this.audio.playbackRate=rate;}
 setVolume(volume){this.volume=volume;if(this.audio)this.audio.volume=volume;}
}
