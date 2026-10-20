from pathlib import Path
from PIL import Image, ImageOps
import pillow_heif,json
pillow_heif.register_heif_opener()
manifest=[]
paths=sorted(p for p in Path('images').rglob('*') if p.suffix.lower() in ['.jpg','.jpeg','.heic','.png'] and p.parent.name!='Logo')
for n,p in enumerate(paths,1):
 ident=f'student-{n:03d}'
 with Image.open(p) as source:
  image=ImageOps.exif_transpose(source).convert('RGB');image.thumbnail((1600,1600),Image.Resampling.LANCZOS)
  w,h=image.size
  image.save(f'public/images/{ident}-large.png',optimize=True)
  image.thumbnail((600,600),Image.Resampling.LANCZOS);image.save(f'public/images/{ident}-thumb.png',optimize=True)
 manifest.append(dict(id=ident,src=f'/images/{ident}-large.png',thumbnail=f'/images/{ident}-thumb.png',width=w,height=h,alt='[Add an accurate image description]',caption='[Add an approved caption]',thumbnailWidth=image.width,thumbnailHeight=image.height,category='lessons',publicationPermission=False,focalPoint='50% 50%'))
Path('scripts/gallery-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print(f'Prepared {len(manifest)} photographs. Review scripts/gallery-manifest.json and copy selected records into src/data.js; generated photos remain unpublished until explicitly enabled.')
