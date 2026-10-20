"""Reproduce public site documents and assets, omitting advertising and authentication."""
import sys, re, json, hashlib, concurrent.futures, urllib.request, urllib.parse, pathlib, threading
sys.path.insert(0,'/tmp/iptv-python')
from bs4 import BeautifulSoup, Comment
ROOT=pathlib.Path(__file__).parent; DIST=ROOT/'dist'; ASSETS=DIST/'assets'; ASSETS.mkdir(exist_ok=True)
ORIGIN='https://freeiptvplayer.net'; assets={}; lock=threading.RLock(); errors=[]
def fetch(url):
 for attempt in range(3):
  try:
   with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=40) as r:return r.read(),r.headers
  except Exception as e:
   if attempt==2: raise

def asset(url):
 url=urllib.parse.urljoin(ORIGIN,url)
 if url.startswith('data:') or not url.startswith('http'):return url
 with lock:
  if url in assets:return assets[url]
  ext=pathlib.Path(urllib.parse.urlparse(url).path).suffix
  if ext not in ['.css','.js','.png','.jpg','.jpeg','.webp','.gif','.svg','.woff','.woff2','.ttf','.ico']:ext='.css' if 'fonts.googleapis' in url else '.bin'
  path='/assets/'+hashlib.sha256(url.encode()).hexdigest()[:20]+ext; assets[url]=path
 try:
  data,headers=fetch(url)
  if ext=='.css':
   text=data.decode(); text=re.sub(r'url\(([\'\"]?)(.*?)\1\)',lambda m:'url("'+asset(urllib.parse.urljoin(url,m[2]))+'")' if not m[2].startswith(('data:','#')) else m[0],text);data=text.encode()
  (DIST/path.lstrip('/')).write_bytes(data)
 except Exception as e:
  errors.append([url,str(e)]); assets[url]=url;return url
 return path

def transform(url,raw):
 s=BeautifulSoup(raw,'html.parser')
 for x in s.find_all(string=lambda x:isinstance(x,Comment)):x.extract()
 for x in s.select('iframe, ins.adsbygoogle, [id^="iptv-auth-gate"], .iptv-auth-gate, noscript, link[rel="dns-prefetch"], link[rel="canonical"], link[rel="preload"], script[type="speculationrules"]'):x.decompose()
 for x in s.select('a[href]'):
  if any(v in x['href'] for v in ['/login','/register','/forgot-password','/account/']):x.decompose()
 for x in list(s.select('script')):
  src=x.get('src',''); code=x.string or x.get_text()
  if src:
   if not any(w in src for w in ['jquery.min.js','fontawesome.com','ninja-forms']):x.decompose();continue
   x['src']=asset(src)
  else:
   if not any(w in code for w in ['alpineIntersect','oxel_accordion','oxy-menu-toggle']):x.decompose();continue
   if 'alpineIntersect' in code:
    code=re.sub(r'https://freeiptvplayer.net/[^\s\'\"]+\.js',lambda m:asset(m[0]),code)
   x.string=code
 for x in s.select('link[href]'):
  if 'stylesheet' in x.get('rel',[]) or 'icon' in ' '.join(x.get('rel',[])):x['href']=asset(x['href'])
 for x in s.select('img'):
  src=x.get('data-src') or x.get('data-lazy-src') or x.get('data-src-img') or x.get('src')
  if src:x['src']=asset(src)
  for k in list(x.attrs):
   if k.startswith('data-') or k in ['srcset','sizes']:del x[k]
  x['class']=[v for v in x.get('class',[]) if v not in ['lazyload','lazy','ewww_webp','ewww_webp_lazy_load']]
 for x in s.find_all(True):
  for k,v in list(x.attrs.items()):
   if k in ['href','action'] and isinstance(v,str) and v.startswith(ORIGIN):x[k]=v[len(ORIGIN):] or '/'
   if k.startswith('data-iptv-auth') or k=='aria-haspopup' and x.get('class') and 'world-item' in x['class']:del x[k]
  if x.name=='style':
   x.string=re.sub(r'url\(([\'\"]?)(https?://[^)\'\"]+)\1\)',lambda m:'url("'+asset(m[2])+'")',x.get_text())
 for x in s.select('.world-item'):
  flag=x.select_one('img'); country=x.get('data-country','')
  if flag:
   original=next((u for u,p in assets.items() if p==flag.get('src')),flag.get('src',''));m=re.search(r'flagsapi.com/([A-Z]+)/',original)
   if m:x['data-playlist']='https://iptv-org.github.io/iptv/countries/'+m[1].lower()+'.m3u'
  if x.get('data-category'):x['data-playlist']='https://iptv-org.github.io/iptv/categories/'+x['data-category'].lower()+'.m3u'
  if x.get('data-language'):x['data-playlist']='https://iptv-org.github.io/iptv/languages/'+x['data-language'].lower()+'.m3u'
 for x in s.select('form:not(#m3u-form)'):x['data-local-form']='true'
 script=s.new_tag('script',src='/app.js',defer=True);s.body.append(script)
 css=s.new_tag('link',rel='stylesheet',href='/app.css');s.head.append(css)
 # Turn all original-origin URLs inside Alpine menu data into local paths.
 text=str(s).replace('https:\\/\\/freeiptvplayer.net\\/','/').replace(ORIGIN+'/','/')
 path=urllib.parse.urlparse(url).path
 out=DIST/path.lstrip('/')/'index.html';out.parent.mkdir(parents=True,exist_ok=True);out.write_text(text)
 return path

if __name__=='__main__':
 pages=json.loads(pathlib.Path('/tmp/iptv-pages.json').read_text());urls=[x['link'] for x in pages if not any(w in x['link'] for w in ['/login/','/register/','/account/','/forgot-password/','/dashboard/','/watch-http/','/watch/'])]
 posts=[]
 for page in range(1,20):
  try:
   data,headers=fetch(ORIGIN+'/wp-json/wp/v2/posts?per_page=100&_fields=link&page='+str(page));batch=json.loads(data);posts+=batch
   if page>=int(headers.get('X-WP-TotalPages','1')):break
  except Exception as e:errors.append(['posts',str(e)]);break
 urls+= [x['link'] for x in posts]; urls=list(dict.fromkeys(urls));print('Mirroring',len(urls),'pages',flush=True)
 def work(url):
  try:
   raw=pathlib.Path('/tmp/iptv-original.html').read_bytes() if url==ORIGIN+'/' else fetch(url)[0]
   p=transform(url,raw);print('OK',p,flush=True)
  except Exception as e:errors.append([url,str(e)]);print('FAIL',url,str(e),flush=True)
 with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:list(pool.map(work,urls))
 (ROOT/'asset-manifest.json').write_text(json.dumps(assets,indent=2));(ROOT/'mirror-report.json').write_text(json.dumps({'pages':urls,'errors':errors},indent=2));print('DONE',len(urls),'pages',len(assets),'assets;',len(errors),'errors',flush=True)
