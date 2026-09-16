import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {setupSequence,momentNames} from './ai-1/setup-storyboard.js';
import {dialogue} from './ai-1/setup-dialogue.js';
import {cards,setupCard} from './ai-1/setup-cards.js';
import {avatarStates,butler} from './ai-1/setup-avatar.js';
import {createPresentation} from './ai-1/presentation.js';
const manifest=JSON.parse(readFileSync('ai-1/media/setup/manifest.json'));
assert.equal(momentNames.length,4);
for(const [id,clip] of Object.entries(dialogue)){
 assert.equal(manifest.voices[id].text,clip.text);
 assert.ok(existsSync('ai-1/media/setup/'+manifest.voices[id].file));
 assert.ok(manifest.voices[id].duration>0);
}
for(const effect of Object.values(manifest.effects))assert.ok(existsSync('ai-1/media/setup/'+effect.file));
for(const branch of ['normal','missing','conditions','lightFailure','enableFailure','direct','stop','disabled']){
 const shots=setupSequence(manifest,true,branch);
 assert.equal(new Set(shots.map(s=>s.id)).size,shots.length);
 for(const s of shots){
  assert.ok(s.duration>0&&s.moment>=0&&s.moment<4);
  if(s.voice)assert.ok(s.duration>=manifest.voices[s.voice].duration);
  if(s.card)assert.ok(cards[s.card]);
  if(s.effect)assert.ok(manifest.effects[s.effect]);
  assert.ok(avatarStates[s.state]);
  for(const key of ['light','curtain'])assert.ok(s[key].every(n=>n>=0&&n<=1));
 }
 if(['conditions','lightFailure','enableFailure'].includes(branch)){
  assert.equal(shots.filter(s=>s.effect==='exception').length,1);
  assert.ok(!shots.some(s=>s.state==='complete'||s.card==='enabled'));
 }
}
const normal=setupSequence(manifest),byId=Object.fromEntries(normal.map(s=>[s.id,s]));
assert.ok(byId.light.light[1]>byId.retryLight.light[1]);
assert.ok(byId.light.duration<byId.retryLight.duration);
assert.deepEqual(byId.curtain.curtain,byId.retryCurtain.curtain);
assert.equal(byId.curtain.duration,byId.retryCurtain.duration);
assert.ok(!setupSequence(manifest,false).some(s=>s.id.startsWith('retry')));
assert.equal(cards.conditions.rows.length,3);
for(const c of Object.keys(cards))assert.ok(setupCard(c,{compact:true}).includes('</article>'));
for(const shape of ['line','glass'])for(const state of Object.keys(avatarStates))assert.ok(butler(shape,state).includes(`data-state="${state}"`));
let now=0,nextId=0;const pending=new Map(),stages=[],stops=[];
Object.defineProperty(globalThis,'performance',{value:{now:()=>now},configurable:true});
globalThis.requestAnimationFrame=fn=>{pending.set(++nextId,fn);return nextId;};
globalThis.cancelAnimationFrame=id=>pending.delete(id);
const tick=ms=>{now+=ms;const callbacks=[...pending.values()];pending.clear();callbacks.forEach(f=>f());};
const player=createPresentation(s=>stages.push(s.id),r=>stops.push(r));
player.setSequence([{id:'a',duration:1000},{id:'b',duration:2000}]);player.start();tick(450);player.stop();
assert.equal(player.elapsed,450);tick(1000);assert.equal(player.elapsed,450);
player.resume();tick(550);assert.equal(player.shot.id,'b');assert.equal(pending.size,1);
player.seek(2200);assert.equal(player.shot.id,'b');assert.equal(player.elapsed,2200);assert.equal(pending.size,1);
tick(800);assert.equal(player.completed,true);assert.equal(player.elapsed,3000);assert.equal(pending.size,0);
player.show(0);assert.equal(player.running,false);assert.equal(player.elapsed,0);
player.setSequence([{id:'c',duration:500}]);player.start();tick(500);assert.equal(stops.at(-1),'complete');
console.log('PASS: initialization storyboards, 20 voice mappings, 4 effects, two avatar systems, branch boundaries, deterministic pause/seek/resume.');
