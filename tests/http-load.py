"""Small local static-server smoke test, not a classroom capacity benchmark."""
import concurrent.futures, json, statistics, time, urllib.request, os
from pathlib import Path
base=os.environ.get('FINMODEL_URL','http://127.0.0.1:8765/').rstrip('/')+'/'
paths=['','app.js','math.js','teaching.js']*8
start=time.monotonic()
def read(path):
 t=time.monotonic()
 opener=urllib.request.build_opener(urllib.request.ProxyHandler({}))
 try:
  with opener.open(base+path,timeout=15) as r:
   data=r.read();return {'path':path or '/', 'status':r.status,'bytes':len(data),'seconds':round(time.monotonic()-t,4)}
 except Exception as e:
  return {'path':path or '/', 'status':None,'bytes':0,'seconds':round(time.monotonic()-t,4),'error':type(e).__name__+': '+str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:results=list(pool.map(read,paths))
successful=sum(r['status']==200 and r['bytes']>0 for r in results)
report={'scope':'local static HTTP smoke test; not real student load or a capacity claim','workers':8,'requests':len(results),'successful':successful,'elapsedSeconds':round(time.monotonic()-start,4),'medianRequestSeconds':statistics.median(r['seconds'] for r in results),'results':results}
Path('tests/v1.8/http-load.json').write_text(json.dumps(report,indent=2)); print(json.dumps({k:v for k,v in report.items() if k!='results'}))

raise SystemExit(0 if successful==len(results) else 1)
