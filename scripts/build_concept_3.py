import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import vtracer
import os
import math

def create_concept_3():
    print("=== BUILDING CONCEPT 3: UNIFIED 3D CYBER TECH LOCKUP ===")
    base_dir = os.path.abspath('sakode-task-reward')
    concepts_dir = os.path.join(base_dir, 'public', 'concepts')
    temp_dir = os.path.join(base_dir, 'scripts', 'temp_concepts')
    os.makedirs(concepts_dir, exist_ok=True)
    os.makedirs(temp_dir, exist_ok=True)

    # 1. Render SAKODE sticker logo to high-res PNG
    node_script = f"""
    const {{ Resvg }} = require('./sakode-task-reward/node_modules/@resvg/resvg-js');
    const fs = require('fs');
    const svg = fs.readFileSync('sakode-task-reward/public/sakode-logo-sticker.svg', 'utf8');
    const resvg = new Resvg(svg, {{ fitTo: {{ mode: 'width', value: 1600 }} }});
    const pngData = resvg.render();
    fs.writeFileSync('{temp_dir.replace('\\', '/')}/sakode_sticker_hi.png', pngData.asPng());
    """
    with open('render_temp.js', 'w') as f:
        f.write(node_script)
    os.system('node render_temp.js')
    if os.path.exists('render_temp.js'):
        os.remove('render_temp.js')

    im_sakode = Image.open(os.path.join(temp_dir, 'sakode_sticker_hi.png')).convert('RGBA')
    sw, sh = im_sakode.size
    print(f"Rendered SAKODE sticker logo: {sw}x{sh}")

    # 2. Design the Dynamic 3D Cyber Cyan Tech Plaque "WORK"
    # Plaque dimensions: 620 x 240
    pw, ph = 640, 220
    plaque = Image.new('RGBA', (pw, ph), (0, 0, 0, 0))
    pdraw = ImageDraw.Draw(plaque)

    # 3D Plate Shadow (offset down-right)
    pdraw.rounded_rectangle([16, 20, pw - 4, ph], radius=44, fill=(0, 0, 0, 255))

    # White Die-Cut Border around plaque
    pdraw.rounded_rectangle([0, 0, pw - 20, ph - 20], radius=44, fill=(255, 255, 255, 255))

    # Inner Plaque Body: Cyber Cyan #71CFFE with gradient look
    pdraw.rounded_rectangle([10, 10, pw - 30, ph - 30], radius=36, fill=(113, 207, 254, 255))

    # Top Gloss Highlight
    pdraw.rounded_rectangle([16, 16, pw - 36, 75], radius=30, fill=(255, 255, 255, 80))

    # Dark Slate Accent Box on Left for Terminal Prompt `>_`
    pdraw.rounded_rectangle([32, 28, 140, ph - 48], radius=24, fill=(15, 23, 42, 255))
    term_font = ImageFont.truetype('Nunito-Variable.ttf', 72)
    term_font.set_variation_by_axes([900])
    pdraw.text((86, (ph - 20) // 2 - 2), ">_", fill=(16, 185, 129, 255), font=term_font, anchor="mm")

    # Wordmark "WORK" in Deep Navy / Slate Black #0F172A
    work_font = ImageFont.truetype('Nunito-Variable.ttf', 115)
    work_font.set_variation_by_axes([900])
    pdraw.text((170, 22), "WORK", fill=(15, 23, 42, 255), font=work_font)

    # Sub-tag: "PLATFORM" in a small Golden Amber Pill
    sub_w, sub_h = 160, 36
    pdraw.rounded_rectangle([pw - 205, ph - 65, pw - 45, ph - 29], radius=18, fill=(255, 168, 0, 255))
    sub_font = ImageFont.truetype('Nunito-Variable.ttf', 20)
    sub_font.set_variation_by_axes([900])
    pdraw.text((pw - 125, ph - 48), "PLATFORM", fill=(15, 23, 42, 255), font=sub_font, anchor="mm")

    # Rotate Plaque slightly by -3 degrees for dynamic pop-art energy
    plaque_rotated = plaque.rotate(3.5, resample=Image.BICUBIC, expand=True)

    # 3. Composite Lockup:
    # SAKODE Logo on top-left, 3D Plaque overlapping bottom-right
    total_w = sw + 320
    total_h = sh + 180
    combined = Image.new('RGBA', (total_w, total_h), (0, 0, 0, 0))

    # Paste SAKODE sticker
    combined.paste(im_sakode, (60, 40), im_sakode)

    # Paste Plaque overlapping the right brace }
    # Right brace in 1600w is at around x = 1420, y = 200..350
    plaque_x = sw - 280
    plaque_y = sh - 140
    combined.paste(plaque_rotated, (plaque_x, plaque_y), plaque_rotated)

    # Crop to content with padding
    bbox = combined.getbbox()
    pad = 40
    crop_box = (max(0, bbox[0] - pad), max(0, bbox[1] - pad), min(total_w, bbox[2] + pad), min(total_h, bbox[3] + pad))
    final_lockup = combined.crop(crop_box)

    # Save Concept 3 PNG
    png_out = os.path.join(concepts_dir, 'concept-3-work-lockup.png')
    final_lockup.save(png_out)
    print(f"Saved {png_out} ({final_lockup.size})")

    # Convert to Vector SVG
    svg_out = os.path.join(concepts_dir, 'concept-3-work-lockup.svg')
    vtracer.convert_image_to_svg_py(png_out, svg_out)
    print(f"Saved {svg_out}")

if __name__ == '__main__':
    create_concept_3()
