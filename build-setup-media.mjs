// Local synthesis only. Regenerate a single voice with: node build-setup-media.mjs request
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {dialogue} from './ai-1/setup-dialogue.js';
const root=path.dirname(fileURLToPath(import.meta.url));
const out=path.join(root,'ai-1/media/setup');fs.mkdirSync(out,{recursive:true});
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'colmo-setup-audio-'));
const manifestPath=path.join(out,'manifest.json');
const manifest=fs.existsSync(manifestPath)?JSON.parse(fs.readFileSync(manifestPath,'utf8')):{voices:{},effects:{}};
function run(cmd,args){const r=spawnSync(cmd,args,{encoding:'utf8',timeout:90000});if(r.status!==0)throw new Error(cmd+': '+r.stderr);return r;}
function duration(file){const r=spawnSync('ffmpeg',['-hide_banner','-i',file],{encoding:'utf8'});const m=r.stderr.match(/Duration: (\d+):(\d+):([\d.]+)/);if(!m)throw new Error('Missing duration '+file);return Math.round((+m[1]*3600+ +m[2]*60+ +m[3])*1000);}
const only=process.argv[2];
for(const [id,clip] of Object.entries(dialogue)){
 const file=path.join(out,id+'.mp3'),voice=clip.role==='ai'?'Tingting':'Eddy (中文（中国大陆）)';
 if(only&&only!==id)continue;
 if(!only&&manifest.voices[id]?.text===clip.text&&fs.existsSync(file))continue;
 const input=path.join(tmp,id+'.txt'),aiff=path.join(tmp,id+'.aiff');
 fs.writeFileSync(input,clip.text);
 run('say',['-v',voice,'-r',clip.role==='ai'?'185':'195','-f',input,'-o',aiff]);
 run('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',aiff,'-af','loudnorm=I=-19:TP=-2:LRA=7,afade=t=in:d=0.03','-ar','44100','-codec:a','libmp3lame','-b:a','128k',file]);
 manifest.voices[id]={file:id+'.mp3',duration:duration(file),role:clip.role,text:clip.text,source:'macOS local synthetic voice',voice,replaceable:true};
 console.log(id,manifest.voices[id].duration+'ms');
}
// Gentle, distinct procedural chimes. WAV files have no external source dependency.
for(const [id,tones] of Object.entries({enter:[[560,0,.22,.10]],generate:[[620,0,.22,.085],[830,.12,.30,.065]],complete:[[523,0,.27,.08],[659,.14,.3,.07],[784,.28,.38,.06]],exception:[[392,0,.30,.07],[330,.19,.28,.055]]})){
 const rate=44100,len=Math.ceil(Math.max(...tones.map(t=>t[1]+t[2]))*rate),data=Buffer.alloc(44+len*2);
 data.write('RIFF');data.writeUInt32LE(data.length-8,4);data.write('WAVEfmt ',8);data.writeUInt32LE(16,16);data.writeUInt16LE(1,20);data.writeUInt16LE(1,22);data.writeUInt32LE(rate,24);data.writeUInt32LE(rate*2,28);data.writeUInt16LE(2,32);data.writeUInt16LE(16,34);data.write('data',36);data.writeUInt32LE(len*2,40);
 for(let i=0;i<len;i++){let v=0;for(const [hz,start,d,amp] of tones){const t=i/rate-start;if(t>=0&&t<d)v+=amp*Math.sin(2*Math.PI*hz*t)*Math.sin(Math.PI*t/d)**2;}data.writeInt16LE(Math.round(Math.max(-1,Math.min(1,v))*32767),44+i*2);}
 fs.writeFileSync(path.join(out,id+'.wav'),data);manifest.effects[id]={file:id+'.wav',duration:len/rate*1000,source:'procedural synthesis',replaceable:true};
}
fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
// Only remove our uniquely created synthesis intermediates.
fs.rmSync(tmp,{recursive:true});
console.log('Generated',Object.keys(manifest.voices).length,'voices and',Object.keys(manifest.effects).length,'effects.');
