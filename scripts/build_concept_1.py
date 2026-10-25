import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import vtracer
import re
import os

def create_concept_1():
    print("=== BUILDING CONCEPT 1: BUBBLE LETTERING WORK ===")
    base_dir = os.path.abspath('sakode-task-reward')
    concepts_dir = os.path.join(base_dir, 'public', 'concepts')
    temp_dir = os.path.join(base_dir, 'scripts', 'temp_concepts')
    os.makedirs(concepts_dir, exist_ok=True)
    os.makedirs(temp_dir, exist_ok=True)

    # 1. Render sakode-logo.svg to high-res PNG using Resvg
    node_script = f"""
    const {{ Resvg }} = require('./sakode-task-reward/node_modules/@resvg/resvg-js');
    const fs = require('fs');
    const svg = fs.readFileSync('sakode-task-reward/public/sakode-logo.svg', 'utf8');
    const resvg = new Resvg(svg, {{ fitTo: {{ mode: 'width', value: 1600 }} }});
    const pngData = resvg.render();
    fs.writeFileSync('{temp_dir.replace('\\', '/')}/sakode_clean_hi.png', pngData.asPng());
    """
    with open('render_temp.js', 'w') as f:
        f.write(node_script)
    os.system('node render_temp.js')
    if os.path.exists('render_temp.js'):
        os.remove('render_temp.js')

    im_sakode = Image.open(os.path.join(temp_dir, 'sakode_clean_hi.png')).convert('RGBA')
    sw, sh = im_sakode.size
    print(f"Rendered SAKODE clean logo: {sw}x{sh}")

    # 2. Design the bubble lettering "work"
    # To match SAKODE letters:
    # 'w': Sky Cyan (#00A3E0)
    # 'o': Coral Red (#FF4B55) with Warm Yellow Smile (#FFA800)
    # 'r': Emerald Green (#00A86B)
    # 'k': Magenta Pink (#FF409F)
    # Font: Nunito 900 ExtraBold, sized to match x-height (~210px in 1600w scale)
    font_size = int(sh * 0.95)
    font = ImageFont.truetype('Nunito-Variable.ttf', font_size)
    font.set_variation_by_axes([900])

    # Canvas for "work" letters
    work_canvas = Image.new('RGBA', (1200, sh + 100), (0, 0, 0, 0))
    draw = ImageDraw.Draw(work_canvas)

    # Baseline alignment
    # In SAKODE, letters sit roughly in y = 0.12*sh to 0.92*sh
    base_y = int(sh * 0.18)

    # Draw 'w' in Cyan
    w_box = draw.textbbox((40, base_y), "w", font=font)
    draw.text((40, base_y), "w", fill=(0, 163, 224, 255), font=font)
    cur_x = 40 + (w_box[2] - w_box[0]) + 15

    # Draw 'o' in Coral Red
    o_box = draw.textbbox((cur_x, base_y), "o", font=font)
    draw.text((cur_x, base_y), "o", fill=(255, 75, 85, 255), font=font)
    # Add warm yellow smile under 'o'
    ox_center = (o_box[0] + o_box[2]) / 2
    oy_bottom = o_box[3]
    smile_w = (o_box[2] - o_box[0]) * 0.7
    smile_box = [ox_center - smile_w/2, oy_bottom - 10, ox_center + smile_w/2, oy_bottom + 25]
    draw.arc(smile_box, start=10, end=170, fill=(255, 168, 0, 255), width=int(font_size * 0.08))
    cur_x += (o_box[2] - o_box[0]) + 15

    # Draw 'r' in Emerald Green
    r_box = draw.textbbox((cur_x, base_y), "r", font=font)
    draw.text((cur_x, base_y), "r", fill=(0, 168, 107, 255), font=font)
    cur_x += (r_box[2] - r_box[0]) + 15

    # Draw 'k' in Magenta Pink
    k_box = draw.textbbox((cur_x, base_y), "k", font=font)
    draw.text((cur_x, base_y), "k", fill=(255, 64, 159, 255), font=font)
    total_work_w = k_box[2] + 40

    # Crop work_canvas to actual content
    work_cropped = work_canvas.crop((0, 0, total_work_w, work_canvas.height))

    # 3. Combine SAKODE and WORK side by side
    gap = 70
    total_w = sw + gap + work_cropped.width + 160
    total_h = max(sh, work_cropped.height) + 160

    combined = Image.new('RGBA', (total_w, total_h), (0, 0, 0, 0))
    # Paste SAKODE
    offset_x = 80
    offset_y = 60
    combined.paste(im_sakode, (offset_x, offset_y), im_sakode)
    # Paste WORK
    combined.paste(work_cropped, (offset_x + sw + gap, offset_y), work_cropped)

    # 4. Generate Cloud Die-Cut Border & Drop Shadow
    alpha = combined.split()[3]
    # Dilation for cloud border
    border_radius = 41
    dilated = alpha.filter(ImageFilter.MaxFilter(size=border_radius))
    # Smooth with gaussian blur and threshold
    smoothed = dilated.filter(ImageFilter.GaussianBlur(radius=8)).point(lambda p: 255 if p > 75 else 0)

    # Shadow offset (down and right)
    shadow_dx = 18
    shadow_dy = 24
    shadow_mask = Image.new('L', (total_w, total_h), 0)
    shadow_mask.paste(smoothed, (shadow_dx, shadow_dy))

    # Final Composite:
    # Layer 1: Shadow (Black / Dark Slate #0F172A)
    # Layer 2: White Cloud Border (#FFFFFF)
    # Layer 3: Combined Letters
    final_sticker = Image.new('RGBA', (total_w, total_h), (0, 0, 0, 0))
    # Shadow image
    shadow_img = Image.new('RGBA', (total_w, total_h), (15, 23, 42, 255))
    final_sticker.paste(shadow_img, (0, 0), shadow_mask)

    # White border image
    white_img = Image.new('RGBA', (total_w, total_h), (255, 255, 255, 255))
    final_sticker.paste(white_img, (0, 0), smoothed)

    # Foreground letters
    final_sticker.paste(combined, (0, 0), combined)

    # Crop transparent borders
    bbox = final_sticker.getbbox()
    pad = 30
    crop_box = (max(0, bbox[0] - pad), max(0, bbox[1] - pad), min(total_w, bbox[2] + pad), min(total_h, bbox[3] + pad))
    final_sticker = final_sticker.crop(crop_box)

    # Save Concept 1 PNG
    png_out = os.path.join(concepts_dir, 'concept-1-work-bubble.png')
    final_sticker.save(png_out)
    print(f"Saved {png_out} ({final_sticker.size})")

    # 5. Convert to Vector SVG using vtracer
    svg_out = os.path.join(concepts_dir, 'concept-1-work-bubble.svg')
    vtracer.convert_image_to_svg_py(png_out, svg_out)
    print(f"Saved {svg_out}")

if __name__ == '__main__':
    create_concept_1()
