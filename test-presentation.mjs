import assert from 'node:assert/strict';
import {createPresentation,sequence} from './ai-1/presentation.js';
const nativeSet=globalThis.setTimeout,nativeClear=globalThis.clearTimeout;
let pending=new Map(),next=0;
globalThis.setTimeout=fn=>{pending.set(++next,fn);return next;};
globalThis.clearTimeout=id=>pending.delete(id);
try{
 assert.deepEqual(sequence.map(s=>s.id),['overview','walking','request','configure','normal','missing','conflict','device']);
 const seen=[],stops=[];
 const player=createPresentation(s=>seen.push(s.id),s=>stops.push(s));
 player.start();assert.equal(seen[0],'overview');
 while(pending.size){const [id,fn]=pending.entries().next().value;pending.delete(id);fn();}
 assert.deepEqual(seen,sequence.map(s=>s.id));assert.equal(player.running,false);assert.equal(stops.at(-1),'演示完成');
 player.start();const stale=[...pending.values()][0];player.stop();assert.equal(pending.size,0);
 const count=seen.length;stale();assert.equal(seen.length,count);
 player.start();player.start();assert.equal(pending.size,1);player.stop();
 const resumeCount=seen.length;player.resume();assert.equal(player.running,true);assert.equal(seen.length,resumeCount);assert.equal(pending.size,1);player.stop();
 player.seek(27000);assert.equal(player.running,false);assert.equal(seen.at(-1),'missing');assert.ok(Math.abs(player.elapsed-27000)<1);
 console.log('PASS: normal before combined exceptions, pause/resume, seeking, completion and stale timer cancellation.');
}finally{globalThis.setTimeout=nativeSet;globalThis.clearTimeout=nativeClear;}
