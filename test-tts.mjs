import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {Narrator} from './ai-3/tts.js';
import {scripts,speechFor} from './ai-3/voice-content.js';

class MockAudio extends EventTarget {
 setAttribute(){} removeAttribute(){} load(){this.dispatchEvent(new Event('emptied'));}
 remove(){} pause(){this.paused=true;}
 play(){this.paused=false;return this.rejectPlay?Promise.reject(this.rejectPlay):Promise.resolve();}
}
const elements=[];
globalThis.document={createElement(){const a=new MockAudio();elements.push(a);return a;},querySelector(){return{append(){}};}};
const states=[];const n=new Narrator(e=>states.push(e));
const defaultMeal={people:'2',time:'18:30',preference:'少油少盐'};
const script=speechFor('understand',0,defaultMeal);
await n.play(script);const first=n.audio;first.onplaying();assert.equal(n.busy,true);
await n.play(speechFor('risk',2,defaultMeal));const latest=n.audio;
first.onended();assert.equal(n.busy,true,'stale completion must not end a newer alert');
assert.equal(first.paused,true);assert.match(latest.src,/male\/risk-0.mp3$/);
latest.onended();assert.equal(n.busy,false);assert.equal(states.at(-1).status,'ended');
n.voice='female';n.setRate(.85);n.setVolume(.4);await n.play(script);
assert.match(n.audio.src,/female\/understand-0.mp3$/);assert.equal(n.audio.playbackRate,.85);assert.equal(n.audio.volume,.4);
n.audio.onerror();assert.equal(n.busy,false);assert.equal(states.at(-1).status,'error');
n.stop();assert.equal(n.audio,null);assert.equal(states.at(-1).status,'idle');
const original=MockAudio.prototype.play;MockAudio.prototype.play=()=>Promise.reject(Object.assign(new Error('gesture required'),{name:'NotAllowedError'}));
await n.play(script);assert.equal(states.at(-1).status,'blocked');assert.equal(n.busy,false);n.stop();MockAudio.prototype.play=original;
let assets=0;
for(const [state,item] of Object.entries(scripts))for(const phase of [0,1,2])for(const meal of [defaultMeal,{people:'3',time:'19:00',preference:'不放辣椒'}]){
 const speech=speechFor(state,phase,meal);
 for(const voice of ['male','female']){assert.ok(existsSync(`ai-3/audio/${voice}/${speech.id}.mp3`),speech.id);assets++;}
 if(item.custom&&meal!==defaultMeal)assert.ok(!speech.text.includes('六点半')&&!speech.text.includes('两人'));
}
console.log(`PASS: stale playback, interruption, voice/rate/volume, completion/error/blocked, ${assets} scenario-to-audio references.`);
