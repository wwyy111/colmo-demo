"""Build local demo MP3s; no private reference documents are sent to the service."""
import asyncio, json, pathlib, subprocess, os
import edge_tts

ROOT=pathlib.Path(__file__).parent
VOICES={'male':'zh-CN-YunyangNeural','female':'zh-CN-XiaoxiaoNeural'}
jobs=json.loads(subprocess.check_output(['node','--input-type=module','-e',
 "import {scripts} from './ai-3/voice-content.js'; const jobs=[];for(const [state,s] of Object.entries(scripts))for(const type of ['phase','custom'])if(s[type])s[type].forEach((text,i)=>jobs.push({id:`${state}-${type==='custom'?'custom-':''}${i}`,text}));console.log(JSON.stringify(jobs));"
],cwd=ROOT))
async def main():
 sem=asyncio.Semaphore(3)
 async def build(gender,voice,job):
  path=ROOT/'ai-3/audio'/gender/(job['id']+'.mp3');path.parent.mkdir(parents=True,exist_ok=True)
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
