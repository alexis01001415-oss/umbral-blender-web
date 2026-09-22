"""Optimize the authored Eevee PNG masters for the scroll hero.

Requires Pillow. No alteration of the source photographs or original room files.
"""
from pathlib import Path
from PIL import Image
import json

HERE=Path(__file__).resolve().parent
OUT=HERE.parents[1]/'public'/'hero'
meta=json.loads((OUT/'hero-geometry.json').read_text())
for layout in ('desktop','mobile'):
    suffix='' if layout=='desktop' else '-mobile'
    for state in ('open','closed'):
        im=Image.open(HERE/f'{layout}-{state}.png').convert('RGB')
        path=OUT/f'window-{state}{suffix}.webp'
        quality=86
        while True:
            im.save(path,format='WEBP',quality=quality,method=6)
            if path.stat().st_size<(310000 if layout=='desktop' else 180000) or quality<=65:break
            quality-=3
        meta[layout][state]={'file':path.name,'bytes':path.stat().st_size,'quality':quality}
    rail=Image.open(HERE/f'{layout}-rail.png').convert('RGBA')
    bounds=rail.getchannel('A').getbbox()
    # Preserve full frame width: placing at left:0;width:100% keeps registration.
    top=max(0,bounds[1]-4);bottom=min(rail.height,bounds[3]+4)
    rail=rail.crop((0,top,rail.width,bottom))
    path=OUT/f'hero-bottom-rail{suffix}.webp'
    rail.save(path,format='WEBP',quality=92,method=6,exact=True)
    meta[layout]['rail']={'file':path.name,'width':rail.width,'height':rail.height,'cropTop':top,'centerOffsetPx':rail.height/2,'bytes':path.stat().st_size}
(OUT/'hero-geometry.json').write_text(json.dumps(meta,indent=2),encoding='utf-8')
print(json.dumps(meta,indent=2))
