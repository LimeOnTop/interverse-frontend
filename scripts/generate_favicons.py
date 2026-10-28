"""Generate the fixed light brand icon set. Requires Pillow."""
from pathlib import Path
import json
import math
from PIL import Image, ImageDraw

public = Path(__file__).resolve().parents[1] / 'public'
scale = 8
image = Image.new('RGBA', (192 * scale, 192 * scale))
draw = ImageDraw.Draw(image)
draw.rounded_rectangle((0, 0, 192 * scale - 1, 192 * scale - 1), radius=40 * scale, fill='#FFFFFF')
length = math.hypot(48, 99)
x, y = 4.5 * 99 / length, 4.5 * 48 / length
cx, cy = y, x
points = [(48-x-cx,47+y-cy), (96,146+4.5*length/48), (144+x+cx,47+y-cy),
          (144-x+cx,47-y-cy), (96,146-4.5*length/48), (48+x-cx,47-y-cy)]
draw.polygon([(round(a * scale), round(b * scale)) for a, b in points], fill='#315D46')
for size in (48, 96, 120, 192, 512):
    image.resize((size, size), Image.Resampling.LANCZOS).save(public / f'favicon-{size}.png')
image.resize((96, 96), Image.Resampling.LANCZOS).save(public / 'favicon-light.png')
# Apple applies its own corner mask; use an opaque canvas.
apple = Image.new('RGBA', image.size, '#FFFFFF')
apple.alpha_composite(image)
apple = apple.convert('RGB').resize((180, 180), Image.Resampling.LANCZOS)
for name in ('apple-touch-icon.png', 'apple-touch-icon-light.png', 'apple-touch-icon-precomposed.png'):
    apple.save(public / name)
image.resize((256, 256), Image.Resampling.LANCZOS).save(public / 'favicon.ico', sizes=[(16,16), (32,32), (48,48), (120,120), (256,256)])
mask_points = ' '.join(f'{a/12:.5f},{b/12:.5f}' for a, b in points)
(public / 'safari-pinned-tab.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><polygon points="{mask_points}" fill="#000"/></svg>\n')
(public / 'favicon.svg').write_bytes((public / 'favicon-light.svg').read_bytes())
manifest_path = public / 'site.webmanifest'
manifest = json.loads(manifest_path.read_text())
manifest.update(id='/', scope='/', background_color='#FFFFFF', theme_color='#FFFFFF')
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
