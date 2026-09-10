import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {nodes,chapters,normalRoute,clip,motionFor,shouldSpeak} from './ai-1/nodes.js';
import {roomState} from './ai-1/room-state.js';
assert.equal(nodes.length,31);assert.equal(new Set(nodes.map(n=>n.id)).size,31);
assert.deepEqual(chapters.map(c=>nodes.filter(n=>n.chapter===c.id).length),[10,11,10]);
for(const [i,n] of nodes.entries()){
 assert.equal(n.id,`N${String(i+1).padStart(3,'0')}`); assert.ok(n.source&&n.subtype&&n.sheetRow);
 for(let p=0;p<3;p++){
  assert.ok(n.speech[p].length>5);assert.equal(shouldSpeak(n,'narrated',p),true);
  if(n.sleeping)assert.equal(shouldSpeak(n,'scene',p),false);
  for(const voice of ['male','female'])assert.ok(existsSync(`ai-1/audio/${voice}/${clip(n,p).id}.mp3`));
 }
 for(const voice of ['male','female'])assert.ok(existsSync(`ai-1/audio/${voice}/${clip(n,0,true).id}.mp3`));
}
for(let p=0;p<3;p++)for(const status of ['ready','pending','settled']){assert.equal(motionFor(nodes[25],p,status).level,3);assert.equal(motionFor(nodes[25],p,status).color,'red');}
assert.equal(shouldSpeak(nodes[25],'scene',2),true);
const risk=roomState(nodes[25],'settled');assert.equal(risk.water,false);assert.equal(risk.heat,false);assert.equal(risk.danger,true);
assert.equal(roomState(nodes[15],'settled').awake,false);assert.equal(roomState(nodes[15],'settled').haptic,true);
assert.equal(roomState(nodes[23],'settled').water,true);assert.equal(roomState(nodes[2],'settled').humidity,true);
assert.ok(normalRoute.every(i=>!['risk','learn','check','review','control'].includes(nodes[i-1].kind)));
console.log('PASS: 31 source mappings, 248 voice assets, silent policy, persistent risk, receipts and normal route.');

const {actionAt,actionDuration,nodeAction}=await import('./ai-1/choreography.js');
assert.equal(actionDuration,34);
let prev=actionAt(0);
for(let t=0;t<=34;t+=.1){const a=actionAt(t);for(const k of ['bed','curtain','sit','edge','stand','walk','wash']){assert.ok(Number.isFinite(a[k]));assert.ok(a[k]>=prev[k]-1e-10);}prev=a;}
assert.equal(actionAt(11).bed,32);assert.equal(actionAt(34).walk,1);assert.equal(actionAt(34).wash,1);
assert.equal(actionAt(20).stand,0);assert.equal(actionAt(22).stand,1);assert.equal(nodeAction(16).sit,0);
console.log('PASS: choreography ordering, end poses, optional bed assistance, and no wake assumption in risk nodes.');
const {flowSource}=await import('./ai-1/flow-source.js');
const {flowLinks,flowScripts,initialTasks,changeTask}=await import('./ai-1/flow-model.js');
const sourceFlowNodes=flowSource.scene.columns.flatMap(c=>c.nodes);
assert.equal(sourceFlowNodes.length,48);assert.equal(sourceFlowNodes.filter(n=>n.type==='交互节点').length,34);
for(const n of sourceFlowNodes.filter(n=>n.type==='交互节点'))assert.ok(flowLinks[n.id]?.length,n.id);
assert.equal(new Set(Object.values(flowLinks).flat()).size,31);
for(const ids of Object.values(flowLinks))for(const id of ids)assert.ok(id>=1&&id<=31);
const baseTasks=initialTasks(),snoozed=changeTask(baseTasks,'snooze'),noWater=changeTask(snoozed,'water');
assert.equal(snoozed.environment,baseTasks.environment);assert.equal(snoozed.water,baseTasks.water);
assert.equal(noWater.wake,snoozed.wake);assert.equal(noWater.environment,baseTasks.environment);
assert.notEqual(snoozed.wake,baseTasks.wake);assert.notEqual(noWater.water,baseTasks.water);
for(const name of Object.keys(flowScripts))for(const voice of ['male','female'])assert.ok(existsSync(`ai-1/audio/${voice}/flow-${name}.mp3`));
console.log('PASS: 48 flow source nodes, 34 navigable mappings covering 31 demo nodes, isolated task changes, branch audio.');
