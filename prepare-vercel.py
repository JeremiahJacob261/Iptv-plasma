from pathlib import Path
import json,tarfile,hashlib
root=Path(__file__).parent;dist=root/'dist';downloads=[];excluded=set()
for url,path in json.loads((root/'asset-manifest.json').read_text()).items():
 p=dist/path.lstrip('/')
 if path.startswith('/assets/') and p.is_file() and p.suffix not in ['.css','.js'] and 'upload.wikimedia.org' not in url:
  downloads.append({'url':url,'path':'dist'+path,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()});excluded.add(p)
with tarfile.open('/tmp/iptv-vercel-source.tgz','w:gz') as tar:
 for p in dist.rglob('*'):
  if p.is_file() and p not in excluded:tar.add(p,arcname=str(p.relative_to(root)))
(root/'vercel-assets.json').write_text(json.dumps(downloads))
archive=Path('/tmp/iptv-vercel-source.tgz').read_bytes();dest=Path('/tmp/iptv-vercel-upload');dest.mkdir(exist_ok=True)
for old in dest.glob('source-*.part'):old.unlink()
for i in range(0,len(archive),262144):(dest/f'source-{i//262144:03}.part').write_bytes(archive[i:i+262144])
print('Archive bytes',len(archive),'chunks',len(list(dest.glob('*.part'))),'download assets',len(downloads))
