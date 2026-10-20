from PIL import Image,ImageDraw
from pathlib import Path
thumbs=sorted(Path('public/images').glob('*-thumb.png'));sheet=Image.new('RGB',(960,((len(thumbs)+7)//8)*145),'#F5EFDF');draw=ImageDraw.Draw(sheet)
for i,p in enumerate(thumbs):
 image=Image.open(p);image.thumbnail((112,112));x=(i%8)*120;y=(i//8)*145;sheet.paste(image,(x+(112-image.width)//2,y));draw.text((x+4,y+115),p.stem.replace('-thumb',''),fill='#0D1929')
sheet.save('.impeccable/review/asset-contact-sheet.png')
