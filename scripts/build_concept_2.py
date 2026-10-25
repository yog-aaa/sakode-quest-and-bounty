import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import vtracer
import os
import math

def create_concept_2():
    print("=== BUILDING CONCEPT 2: BOUNTY QUEST EMBLEM ===")
    base_dir = os.path.abspath('sakode-task-reward')
    concepts_dir = os.path.join(base_dir, 'public', 'concepts')
    temp_dir = os.path.join(base_dir, 'scripts', 'temp_concepts')
    os.makedirs(concepts_dir, exist_ok=True)
    os.makedirs(temp_dir, exist_ok=True)

    # Canvas dimensions: 1000 x 1000
    W, H = 1200, 1200
    canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)

    # 1. Render SAKODE brandmark {k} to high-res PNG
    node_script = f"""
    const {{ Resvg }} = require('./sakode-task-reward/node_modules/@resvg/resvg-js');
    const fs = require('fs');
    const svg = fs.readFileSync('sakode-task-reward/public/sakode-brandmark.svg', 'utf8');
    const resvg = new Resvg(svg, {{ fitTo: {{ mode: 'width', value: 480 }} }});
    const pngData = resvg.render();
    fs.writeFileSync('{temp_dir.replace('\\', '/')}/brandmark_hi.png', pngData.asPng());
    """
    with open('render_temp.js', 'w') as f:
        f.write(node_script)
    os.system('node render_temp.js')
    if os.path.exists('render_temp.js'):
        os.remove('render_temp.js')

    im_brandmark = Image.open(os.path.join(temp_dir, 'brandmark_hi.png')).convert('RGBA')

    # 2. Draw Hexagonal / Shield Badge Plate
    # Center (600, 520), Radius ~420
    cx, cy = 600, 500
    badge_radius = 420
    
    # Points of a rounded hexagon
    hex_pts = []
    for i in range(6):
        angle = math.radians(60 * i - 30) # flat top
        px = cx + badge_radius * math.cos(angle)
        py = cy + badge_radius * math.sin(angle)
        hex_pts.append((px, py))

    # Badge Base: Deep Slate #0F172A
    draw.polygon(hex_pts, fill=(15, 23, 42, 255))

    # Inner Neon Cyan Border
    draw.polygon(hex_pts, outline=(113, 207, 254, 255), width=18)

    # Inner Glow Ring
    draw.ellipse([cx - 320, cy - 320, cx + 320, cy + 320], outline=(0, 163, 224, 70), width=6)

    # 3. Paste Brandmark {k} at Center
    bm_w, bm_h = im_brandmark.size
    canvas.paste(im_brandmark, (cx - bm_w // 2, cy - bm_h // 2 - 40), im_brandmark)

    # 4. Draw Bounty Coins on Left & Right
    # Left coin at (cx - 310, cy - 60), Right coin at (cx + 310, cy - 60)
    def draw_coin(x, y, r=70):
        # Outer coin rim
        draw.ellipse([x - r, y - r, x + r, y + r], fill=(255, 168, 0, 255), outline=(217, 119, 6, 255), width=6)
        # Inner coin face
        draw.ellipse([x - r + 10, y - r + 10, x + r - 10, y + r - 10], fill=(251, 191, 36, 255), outline=(245, 158, 11, 255), width=3)
        # Embossed code bracket { } or bounty symbol
        coin_font = ImageFont.truetype('Nunito-Variable.ttf', 56)
        coin_font.set_variation_by_axes([900])
        draw.text((x, y), "{ }", fill=(180, 83, 9, 255), font=coin_font, anchor="mm")

    draw_coin(cx - 280, cy - 50, r=65)
    draw_coin(cx + 280, cy - 50, r=65)

    # Sparkling Quest Stars
    def draw_star(sx, sy, size=24, color=(255, 215, 0, 255)):
        pts = [
            (sx, sy - size),
            (sx + size*0.3, sy - size*0.3),
            (sx + size, sy),
            (sx + size*0.3, sy + size*0.3),
            (sx, sy + size),
            (sx - size*0.3, sy + size*0.3),
            (sx - size, sy),
            (sx - size*0.3, sy - size*0.3),
        ]
        draw.polygon(pts, fill=color)

    draw_star(cx - 360, cy - 180, 28, (255, 215, 0, 255))
    draw_star(cx + 360, cy - 180, 28, (255, 215, 0, 255))
    draw_star(cx - 180, cy - 320, 22, (113, 207, 254, 255))
    draw_star(cx + 180, cy - 320, 22, (113, 207, 254, 255))

    # Top Tag: SAKODE
    tag_font = ImageFont.truetype('Nunito-Variable.ttf', 44)
    tag_font.set_variation_by_axes([900])
    draw.text((cx, cy - 250), "SAKODE", fill=(255, 255, 255, 255), font=tag_font, anchor="mm")

    # 5. Draw 3D Plakat / Ribbon "WORK" across lower badge
    ribbon_y = cy + 240
    rw, rh = 640, 140
    rx = cx - rw // 2

    # Ribbon drop shadow
    draw.rounded_rectangle([rx + 8, ribbon_y + 12, rx + rw + 8, ribbon_y + rh + 12], radius=32, fill=(0, 0, 0, 200))
    # Ribbon body in vibrant Cyan #71CFFE
    draw.rounded_rectangle([rx, ribbon_y, rx + rw, ribbon_y + rh], radius=32, fill=(113, 207, 254, 255), outline=(255, 255, 255, 255), width=6)
    # Inner border
    draw.rounded_rectangle([rx + 6, ribbon_y + 6, rx + rw - 6, ribbon_y + rh - 6], radius=26, outline=(2, 132, 199, 150), width=3)

    # Wordmark "WORK" inside ribbon
    work_font = ImageFont.truetype('Nunito-Variable.ttf', 92)
    work_font.set_variation_by_axes([900])
    draw.text((cx, ribbon_y + rh // 2 - 4), "WORK", fill=(15, 23, 42, 255), font=work_font, anchor="mm")

    # Subtitle Pill below ribbon: "TASK & BOUNTY PLATFORM"
    sub_y = ribbon_y + rh + 40
    sub_w, sub_h = 380, 52
    sx = cx - sub_w // 2
    draw.rounded_rectangle([sx, sub_y, sx + sub_w, sub_y + sub_h], radius=26, fill=(255, 168, 0, 255), outline=(255, 255, 255, 255), width=3)
    sub_font = ImageFont.truetype('Nunito-Variable.ttf', 24)
    sub_font.set_variation_by_axes([900])
    draw.text((cx, sub_y + sub_h // 2), "TASK & BOUNTY PLATFORM", fill=(15, 23, 42, 255), font=sub_font, anchor="mm")

    # 6. Apply Pop-Art Cloud Die-Cut Border & Drop Shadow to the whole Emblem
    alpha = canvas.split()[3]
    border_radius = 45 # odd integer
    dilated = alpha.filter(ImageFilter.MaxFilter(size=border_radius))
    smoothed = dilated.filter(ImageFilter.GaussianBlur(radius=8)).point(lambda p: 255 if p > 75 else 0)

    # Shadow offset
    shadow_dx = 20
    shadow_dy = 28
    shadow_mask = Image.new('L', (W, H), 0)
    shadow_mask.paste(smoothed, (shadow_dx, shadow_dy))

    final_emblem = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    # Layer 1: Solid Black Drop Shadow
    shadow_img = Image.new('RGBA', (W, H), (0, 0, 0, 255))
    final_emblem.paste(shadow_img, (0, 0), shadow_mask)

    # Layer 2: White Cloud Border
    white_img = Image.new('RGBA', (W, H), (255, 255, 255, 255))
    final_emblem.paste(white_img, (0, 0), smoothed)

    # Layer 3: Foreground Badge Content
    final_emblem.paste(canvas, (0, 0), canvas)

    # Crop to content with padding
    bbox = final_emblem.getbbox()
    pad = 40
    crop_box = (max(0, bbox[0] - pad), max(0, bbox[1] - pad), min(W, bbox[2] + pad), min(H, bbox[3] + pad))
    final_emblem = final_emblem.crop(crop_box)

    # Save Concept 2 PNG
    png_out = os.path.join(concepts_dir, 'concept-2-work-badge.png')
    final_emblem.save(png_out)
    print(f"Saved {png_out} ({final_emblem.size})")

    # Convert to Vector SVG
    svg_out = os.path.join(concepts_dir, 'concept-2-work-badge.svg')
    vtracer.convert_image_to_svg_py(png_out, svg_out)
    print(f"Saved {svg_out}")

if __name__ == '__main__':
    create_concept_2()
