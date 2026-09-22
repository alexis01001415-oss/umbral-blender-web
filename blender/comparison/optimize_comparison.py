from pathlib import Path
from PIL import Image
import json
HERE=Path(__file__).resolve().parent;OUT=HERE.parents[1]/'public'/'comparison'
OUT.mkdir(parents=True,exist_ok=True)
report=[]
for state in ('day','night'):
    original=Image.open(HERE/f'duo-{state}.png').convert('RGB')
    for width in (480,768):
        im=original.resize((width,round(original.height*width/original.width)),Image.Resampling.LANCZOS)
        path=OUT/f'duo-{state}-{width}.webp';im.save(path,format='WEBP',quality=86,method=6)
        report.append({'file':path.name,'width':im.width,'height':im.height,'bytes':path.stat().st_size})
print(json.dumps(report,indent=2))
