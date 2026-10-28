"""Generate the white and purple-gradient brand icon set. Requires Pillow."""
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
mask = Image.new('L', image.size)
ImageDraw.Draw(mask).polygon([(round(a * scale), round(b * scale)) for a, b in points], fill=255)
gradient = Image.new('RGBA', image.size)
gradient_draw = ImageDraw.Draw(gradient)
start, end = (192, 132, 252), (147, 51, 234)
for column in range(image.width):
    t = max(0, min(1, (column / scale - 43) / 106))
    color = tuple(round(a + (b - a) * t) for a, b in zip(start, end)) + (255,)
    gradient_draw.line((column, 0, column, image.height), fill=color)
image.paste(gradient, (0, 0), mask)
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
for name, background in (('favicon-light.svg', '#FFFFFF'), ('favicon-dark.svg', '#14161B')):
    (public / name).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192" role="img" aria-label="InterVerse"><defs><linearGradient id="accent" x1="43" y1="0" x2="149" y2="0" gradientUnits="userSpaceOnUse"><stop stop-color="#c084fc"/><stop offset="1" stop-color="#9333ea"/></linearGradient></defs><rect width="192" height="192" rx="40" fill="{background}"/><path d="M48 47L96 146L144 47" fill="none" stroke="url(#accent)" stroke-width="9" stroke-linecap="square" stroke-linejoin="miter"/></svg>\n')
(public / 'favicon.svg').write_bytes((public / 'favicon-light.svg').read_bytes())
manifest_path = public / 'site.webmanifest'
manifest = json.loads(manifest_path.read_text())
manifest.update(id='/', scope='/', background_color='#FFFFFF', theme_color='#FFFFFF')
for icon in manifest['icons']:
    icon['src'] = icon['src'].split('?')[0] + '?v=purple-20261028'
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
