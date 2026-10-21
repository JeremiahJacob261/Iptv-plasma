"""Build a sourced snapshot from primary-source exports in /tmp/featured-sources.
X: Wikidata P2002, Twitch: public profile API, with Wikidata P5797/occupations.
This is a manual catalog refresh, never a 1,000-account fetch at deployment time.
"""
import pathlib,json,collections,datetime,re
root=pathlib.Path(__file__).resolve().parents[1];src=pathlib.Path('/tmp/featured-sources')
xrows=[]
for p in sorted(src.glob('x-*.json')):xrows+=json.loads(p.read_text())
xmap={}
for row in xrows:
 if re.fullmatch(r'[A-Za-z0-9_]{1,15}',row['username']):xmap.setdefault(row['username'].lower(),row)
seeds=[('SpaceX','SpaceX','Science & Space'),('NASA','NASA','Science & Space'),('Reuters','Reuters','News'),('SkyNews','Sky News','News'),('BloombergTV','Bloomberg Television','Business & Technology'),('CSPAN','C-SPAN','News'),('ESPN','ESPN','Sports'),('RedBull','Red Bull','Sports')]
x=[];used=set();entities=set()
for handle,name,category in seeds:
 row=xmap.get(handle.lower(),{'source':'https://x.com/'+handle,'rank':0});x.append({**row,'username':handle,'name':name,'category':category,'featured':True});used.add(handle.lower());entities.add(row['source'])
groups=collections.defaultdict(list)
for r in xmap.values():groups[r['category']].append(r)
for values in groups.values():values.sort(key=lambda r:-r['rank'])
# Round-robin category choices; prefer separate organizations before alternate brand handles.
for unique in [True,False]:
 queues={k:list(v) for k,v in groups.items()}
 while len(x)<512:
  added=False
  for category,queue in queues.items():
   while queue:
    r=queue.pop(0);key=r['username'].lower()
    if key in used or unique and r['source'] in entities:continue
    x.append({**r,'featured':False});used.add(key);entities.add(r['source']);added=True;break
   if len(x)>=512:break
  if not added:break
assert len(x)>=512
roles=json.loads((src/'twitch-roles.json').read_text());verified=json.loads((src/'twitch-verified.json').read_text());entity_categories={r['source']:r['category'] for r in xmap.values()}
def category(r):
 role=roles.get(r['username'].lower(),'').lower();live=r.get('liveCategory','').lower();related=entity_categories.get(r['source'],'')
 if live in ['music','djs'] or re.search(r'singer|musician|composer|disc jockey|record producer',role):return 'Music'
 if re.search(r'politician|journalist|news presenter|political scientist',role) or related=='News':return 'News & Public Life'
 if re.search(r'football|basketball|athlete|racing driver|chess player|grandmaster',role) or related=='Sports' or re.search(r'chess|sports|racing|ea sports|football',live):return 'Sports & Chess'
 if re.search(r'scientist|physicist|researcher|teacher|educator',role) or related in ['Education','Science & Space']:return 'Science & Education'
 if re.search(r'actor|comedian|dancer|television presenter|film director|model',role) or related=='Entertainment':return 'Entertainment & Culture'
 if re.search(r'artist|painter|illustrator|programmer|engineer',role) or related=='Business & Technology':return 'Art & Technology'
 if live in ['just chatting','irl','travel & outdoors','always on']:return 'Talk & Lifestyle'
 return 'Gaming & Creators'
tmap={r['username'].lower():r for r in verified if r.get('verified')}
priority=['ninja','shroud','pokimane','xqc','kaicenat','ibai','gaules','caseoh_','theburntpeanut','monstercat']
order=[tmap[k] for k in priority if k in tmap]+verified
t=[];seen=set()
for r in order:
 key=r['username'].lower()
 if key in seen:continue
 seen.add(key);t.append({k:r[k] for k in ['username','name','source','rank','avatar'] if k in r}|{'category':category(r),'featured':len(t)<12,'profileVerified':True})
 if len(t)==512:break
assert len(t)==512
for channels in [x,t]:
 for i,r in enumerate(channels):r['id']=r['username'].lower();r['catalogRank']=i
 for r in channels:
  if re.fullmatch(r'Q\d+',r['name']):r['name']=r['username']
platforms={p:{'channels':rows,'categories':sorted({r['category'] for r in rows})} for p,rows in [('x',x),('twitch',t)]}
catalog={'version':1,'generatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'platforms':platforms}
(root/'data/featured-catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,separators=(',',':')))
(root/'dist/featured-catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,separators=(',',':')))
provenance={'generatedAt':catalog['generatedAt'],'sources':[{'platform':'x','url':'https://www.wikidata.org/wiki/Property:P2002','selection':'Public account identifiers for news, sports, science, education, business, music and entertainment; balanced by category, ranked by sitelinks. Existing featured picks retained.'},{'platform':'twitch','url':'https://www.wikidata.org/wiki/Property:P5797','selection':'Candidate usernames, confirmed with Twitch public users(logins:) profile lookup. Public popular-live directory supplies additional current creators.'},{'platform':'twitch','url':'https://gql.twitch.tv/gql','selection':'512 unique profiles returned by anonymous public profile lookup; current live state is checked separately in rotating batches.'}],'uxReferences':['https://lawsofux.com/hicks-law/','https://lawsofux.com/serial-position-effect/','https://lawsofux.com/law-of-common-region/'],'counts':{p:len(v['channels']) for p,v in platforms.items()},'limitations':'Catalog membership is not a claim that an account is currently live or that every recorded X identifier remains available. Unchecked, unavailable and stale statuses are explicit.'}
(root/'data/featured-provenance.json').write_text(json.dumps(provenance,indent=2))
for p,v in platforms.items():print(p,len(v['channels']),collections.Counter(r['category'] for r in v['channels']))
