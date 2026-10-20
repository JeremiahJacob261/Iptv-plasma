import mirror, concurrent.futures, urllib.parse, json, re
from bs4 import BeautifulSoup
mirror.assets.update(json.loads((mirror.ROOT/'asset-manifest.json').read_text()))
root=mirror.DIST
seen=set()
for round in range(5):
 missing=set()
 for p in root.rglob('*.html'):
  s=BeautifulSoup(p.read_text(),'html.parser')
  for a in s.select('a[href]'):
   u=a['href'];path=urllib.parse.urlparse(u).path
   if u.startswith('/') and not u.startswith('//') and path and not (root/path[1:]/'index.html').exists() and not (root/path[1:]).is_file():missing.add(path)
 missing-=seen
 if not missing:break
 seen|=missing
 def work(path):
  try:
   raw,_=mirror.fetch(mirror.ORIGIN+path)
   if '.' in path.rsplit('/',1)[-1]:
    dest=root/path[1:];dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(raw)
   else:mirror.transform(mirror.ORIGIN+path,raw)
   print('OK',path,flush=True)
  except Exception as e:print('FAIL',path,str(e),flush=True)
 with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:list(pool.map(work,missing))
for p in root.rglob('*.html'):
 text=p.read_text()
 # Fetch original SVG/PNG for thumbnails no longer supplied by Wikimedia.
 for u in set(re.findall(r'https://upload.wikimedia.org[^\"\s<>]+',text)):
  if '/thumb/' in u:
   original=u.replace('/thumb/','/').rsplit('/',1)[0]
   text=text.replace(u,mirror.asset(original))
 p.write_text(text)
(mirror.ROOT/'asset-manifest.json').write_text(json.dumps(mirror.assets,indent=2))
