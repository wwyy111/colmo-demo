"""Build local demo MP3s; no private reference documents are sent to the service."""
import asyncio, json, pathlib, subprocess, os
import edge_tts

ROOT=pathlib.Path(__file__).parent
VOICES={'male':'zh-CN-YunyangNeural','female':'zh-CN-XiaoxiaoNeural'}
jobs=json.loads(subprocess.check_output(['node','--input-type=module','-e', "import {nodes,clip} from './ai-1/nodes.js';import {flowScripts} from './ai-1/flow-model.js';console.log(JSON.stringify([...nodes.flatMap(n=>[...([0,1,2].map(p=>clip(n,p))),clip(n,0,true)]),...Object.entries(flowScripts).map(([id,text])=>({id:'flow-'+id,text}))]));"],cwd=ROOT))
async def main():
 sem=asyncio.Semaphore(3)
 async def build(gender,voice,job):
  path=ROOT/'ai-1/audio'/gender/(job['id']+'.mp3');path.parent.mkdir(parents=True,exist_ok=True)
  if path.exists() and path.stat().st_size>1000:return
  async with sem:
   for attempt in range(3):
    try:
     await edge_tts.Communicate(job['text'],voice,rate='-8%' if gender=='male' else '-6%',pitch='+0Hz',proxy=os.environ.get('HTTPS_PROXY') or os.environ.get('https_proxy')).save(str(path))
     print(gender,job['id'],path.stat().st_size,flush=True);return
    except Exception:
     if attempt==2:raise
     await asyncio.sleep(2)
 await asyncio.gather(*(build(g,v,j) for g,v in VOICES.items() for j in jobs))
 print('COMPLETE',len(jobs)*len(VOICES),flush=True)
asyncio.run(main())
