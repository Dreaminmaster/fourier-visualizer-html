from PIL import Image, ImageDraw, ImageFont
import math

W, H = 1600, 900
img = Image.new('RGB', (W, H), '#f4f7fc')
draw = ImageDraw.Draw(img)

# background gradient-ish bands
for y in range(H):
    t = y / H
    r = int(244 - 10 * t)
    g = int(247 - 8 * t)
    b = int(252 - 2 * t)
    draw.line([(0, y), (W, y)], fill=(r, g, b))

# panels
panel = (70, 90, 470, 820)
stage = (520, 90, 1530, 820)
draw.rounded_rectangle(panel, radius=28, fill='white', outline='#d7deea', width=2)
draw.rounded_rectangle(stage, radius=28, fill='white', outline='#d7deea', width=2)

# typography
try:
    title_font = ImageFont.truetype('/usr/share/fonts/TTF/DejaVuSans-Bold.ttf', 44)
    h2_font = ImageFont.truetype('/usr/share/fonts/TTF/DejaVuSans-Bold.ttf', 22)
    text_font = ImageFont.truetype('/usr/share/fonts/TTF/DejaVuSans.ttf', 20)
    small_font = ImageFont.truetype('/usr/share/fonts/TTF/DejaVuSans.ttf', 17)
except:
    title_font = ImageFont.load_default()
    h2_font = ImageFont.load_default()
    text_font = ImageFont.load_default()
    small_font = ImageFont.load_default()

# top title
draw.text((70, 26), 'Fourier Canvas Lab', font=title_font, fill='#18202a')
draw.text((70, 76), 'Draw, decompose, and replay freehand paths as Fourier epicycles.', font=text_font, fill='#657184')

# left panel content
hero = (92, 122, 448, 240)
draw.rounded_rectangle(hero, radius=20, fill='#eff5ff', outline='#d7e7ff')
draw.text((112, 145), 'Fourier drawing playground', font=h2_font, fill='#18202a')
draw.text((112, 183), 'Responsive controls, replay export, and\npannable canvas navigation.', font=text_font, fill='#657184')

buttons = [
    ('Clear', 112, 280),
    ('Generate Fourier', 112, 336),
    ('Play / Pause', 112, 392),
    ('Reset View', 112, 448),
    ('Center Path', 112, 504),
]
for label, x, y in buttons:
    draw.rounded_rectangle((x, y, 426, y + 42), radius=12, fill='white', outline='#d7deea')
    draw.text((x + 16, y + 10), label, font=small_font, fill='#18202a')

draw.text((112, 576), 'Terms', font=small_font, fill='#657184')
draw.rounded_rectangle((112, 605, 426, 621), radius=8, fill='#e7eefc')
draw.rounded_rectangle((112, 605, 312, 621), radius=8, fill='#2563eb')

# stage grid
sx1, sy1, sx2, sy2 = 548, 122, 1504, 788
for x in range(sx1, sx2, 32):
    draw.line([(x, sy1), (x, sy2)], fill='#eef3fb')
for y in range(sy1, sy2, 32):
    draw.line([(sx1, y), (sx2, y)], fill='#eef3fb')

# epicycle-like drawing
center_x, center_y = 1000, 430
pts = []
for i in range(420):
    t = (i / 420) * 2 * math.pi
    x = center_x + 170 * math.cos(t) + 56 * math.cos(3 * t + 0.8) + 22 * math.cos(8 * t)
    y = center_y + 140 * math.sin(t) + 40 * math.sin(2 * t + 0.4) + 18 * math.sin(7 * t)
    pts.append((x, y))

draw.line(pts + [pts[0]], fill='#111827', width=4)

circle_specs = [
    (820, 280, 160),
    (960, 380, 92),
    (1070, 435, 48),
    (1135, 462, 24),
]
for cx, cy, r in circle_specs:
    draw.ellipse((cx-r, cy-r, cx+r, cy+r), outline='#b7c5db', width=3)

arm_points = [(820, 280), (960, 380), (1070, 435), (1135, 462)]
draw.line(arm_points, fill='#9aa8bd', width=3)
draw.ellipse((1131, 458, 1139, 466), fill='#ef4444')

# labels
badge = (1270, 132, 1468, 170)
draw.rounded_rectangle(badge, radius=18, fill='#eff5ff', outline='#d7e7ff')
draw.text((1290, 142), 'Pan & Zoom Enabled', font=small_font, fill='#2563eb')

draw.text((570, 138), 'Viewport Canvas', font=h2_font, fill='#18202a')
draw.text((570, 172), 'Fixed viewport over a larger virtual drawing space.', font=text_font, fill='#657184')

draw.text((92, 754), 'Desktop: Space + drag to pan, wheel to zoom', font=small_font, fill='#657184')
draw.text((92, 780), 'Mobile: two-finger pan / pinch to zoom', font=small_font, fill='#657184')

img.save('/var/minis/workspace/fourier-html/assets/cover.png')
