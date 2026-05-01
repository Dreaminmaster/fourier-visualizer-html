from PIL import Image, ImageDraw
import math

W, H = 900, 620
frames = []
for fi in range(60):
    img = Image.new('RGB', (W, H), '#f7f9fd')
    draw = ImageDraw.Draw(img)

    # panel/card feel
    draw.rounded_rectangle((20, 20, W-20, H-20), radius=24, fill='white', outline='#d7deea', width=2)
    for x in range(60, W-60, 28):
        draw.line([(x, 60), (x, H-60)], fill='#eef3fb')
    for y in range(60, H-60, 28):
        draw.line([(60, y), (W-60, y)], fill='#eef3fb')

    cx, cy = 390, 300
    t = (fi / 60) * 2 * math.pi
    specs = [
        (0.0, 110, 0.0),
        (2.0, 62, 0.7),
        (-3.0, 28, 1.2),
        (7.0, 14, -0.5),
    ]
    points = [(cx, cy)]
    x, y = cx, cy
    for freq, amp, phase in specs:
        x2 = x + amp * math.cos(freq * t + phase)
        y2 = y + amp * math.sin(freq * t + phase)
        draw.ellipse((x-amp, y-amp, x+amp, y+amp), outline='#c6d1e2', width=2)
        draw.line([(x, y), (x2, y2)], fill='#9aa8bd', width=3)
        x, y = x2, y2
        points.append((x, y))
    trail = []
    for i in range(fi + 1):
        tt = (i / 60) * 2 * math.pi
        px, py = cx, cy
        for freq, amp, phase in specs:
            px += amp * math.cos(freq * tt + phase)
            py += amp * math.sin(freq * tt + phase)
        trail.append((px, py))
    if len(trail) > 1:
        draw.line(trail, fill='#111827', width=4)
    draw.ellipse((x-5, y-5, x+5, y+5), fill='#ef4444')
    draw.text((64, 72), 'Fourier Canvas Lab', fill='#18202a')
    draw.text((64, 96), 'Draw, decompose, replay', fill='#657184')
    draw.text((64, H-88), 'Pan & Zoom Canvas · Import / Export · Responsive', fill='#657184')
    frames.append(img)

frames[0].save('/var/minis/workspace/fourier-html/assets/demo.gif', save_all=True, append_images=frames[1:], duration=55, loop=0)
