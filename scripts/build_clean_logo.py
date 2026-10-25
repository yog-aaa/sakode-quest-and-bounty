import numpy as np
from PIL import Image
import vtracer
import re
import os

def build_clean_logo_svg():
    # Read the extracted paths
    elements_order = [
        ('letter_s', '#F9723B'),
        ('letter_a', '#EDAC1C'),
        ('brace_left', '#1E293B'),
        ('mascot_head', '#00A3E0'),
        ('mascot_body', '#00A86B'),
        ('letter_o', '#FF4B55'),
        ('smile_arc', '#FFA800'),
        ('letter_d', '#FF409F'),
        ('letter_e', '#52A5E8'),
        ('brace_right', '#1E293B')
    ]

    temp_dir = 'sakode-task-reward/scripts/temp_masks'
    
    # Let's inspect the exact paths extracted
    assembled_paths = []
    
    # We will refine the extraction to ensure 100% clean single contours for each element
    # Let's re-run extraction with high precision
    im = Image.open('C:/Users/yogaa/.gemini/antigravity/brain/51755b30-e706-4a5e-9da1-ce1000f53ba4/.user_uploaded/media_1792927857631_4287be10.png').convert('RGBA')
    arr = np.array(im)
    H, W, _ = arr.shape
    y_grid, x_grid = np.indices((H, W))

    masks = {
        'letter_s': ((arr[:, :, 3] > 180) & (arr[:, :, 0] > 200) & (arr[:, :, 1] > 80) & (arr[:, :, 1] < 160) & (arr[:, :, 2] < 80) & (x_grid < 160)),
        'letter_a': ((arr[:, :, 3] > 180) & (arr[:, :, 0] > 200) & (arr[:, :, 1] > 150) & (arr[:, :, 2] < 50) & (x_grid >= 160) & (x_grid < 300)),
        'brace_left': ((arr[:, :, 3] > 180) & (arr[:, :, 0] < 80) & (arr[:, :, 1] < 80) & (arr[:, :, 2] < 80) & (x_grid >= 310) & (x_grid <= 360)),
        'mascot_head': ((arr[:, :, 3] > 180) & (arr[:, :, 0] < 50) & (arr[:, :, 1] > 140) & (arr[:, :, 2] > 200) & (x_grid >= 420) & (x_grid <= 480) & (y_grid < 100)),
        'mascot_body': ((arr[:, :, 3] > 180) & (arr[:, :, 0] < 50) & (arr[:, :, 1] > 120) & (arr[:, :, 2] < 150) & (x_grid >= 360) & (x_grid < 540)),
        'letter_o': ((arr[:, :, 3] > 180) & (arr[:, :, 0] > 200) & (arr[:, :, 1] < 100) & (arr[:, :, 2] < 100) & (x_grid >= 530) & (x_grid < 660) & (y_grid < 170)),
        'smile_arc': ((arr[:, :, 3] > 180) & (arr[:, :, 0] > 200) & (arr[:, :, 1] > 150) & (arr[:, :, 2] < 50) & (x_grid >= 530) & (x_grid < 660) & (y_grid >= 170)),
        'letter_d': ((arr[:, :, 3] > 180) & (arr[:, :, 0] > 200) & (arr[:, :, 1] < 100) & (arr[:, :, 2] > 120) & (x_grid >= 660) & (x_grid < 790)),
        'letter_e': ((arr[:, :, 3] > 180) & (arr[:, :, 0] < 50) & (arr[:, :, 1] > 140) & (arr[:, :, 2] > 200) & (x_grid >= 800) & (x_grid <= 920)),
        'brace_right': ((arr[:, :, 3] > 180) & (arr[:, :, 0] < 80) & (arr[:, :, 1] < 80) & (arr[:, :, 2] < 80) & (x_grid >= 920) & (x_grid <= 980) & (y_grid < 235)),
    }

    all_xs = []
    all_ys = []

    clean_svg_elements = []

    for name, color in elements_order:
        m = masks[name]
        ys, xs = np.where(m)
        all_xs.extend([xs.min(), xs.max()])
        all_ys.extend([ys.min(), ys.max()])

        # Export binary mask
        png_path = os.path.join(temp_dir, f'clean_{name}.png')
        svg_path = os.path.join(temp_dir, f'clean_{name}.svg')
        Image.fromarray((m * 255).astype(np.uint8)).save(png_path)
        vtracer.convert_image_to_svg_py(png_path, svg_path)

        with open(svg_path, 'r', encoding='utf-8') as f:
            content = f.read()

        paths = re.findall(r'<path\s+[^>]+>', content)
        # Filter for foreground white paths
        item_paths = []
        for p in paths:
            if 'fill="#FFFFFF"' in p or 'fill="#FFF"' in p or 'fill="#ffffff"' in p:
                colored_p = re.sub(r'fill="[^"]+"', f'fill="{color}"', p)
                item_paths.append(colored_p)

        print(f'{name:12s}: bbox x=[{xs.min():3d}..{xs.max():3d}], y=[{ys.min():3d}..{ys.max():3d}] -> {len(item_paths)} path(s)')
        clean_svg_elements.append(f'  <g id="{name}">\n    ' + '\n    '.join(item_paths) + '\n  </g>')

    min_x, max_x = min(all_xs), max(all_xs)
    min_y, max_y = min(all_ys), max(all_ys)
    width = max_x - min_x + 1
    height = max_y - min_y + 1
    print(f'TOTAL BOUNDS: x={min_x}..{max_x} (w={width}), y={min_y}..{max_y} (h={height})')

    # Viewbox with pleasant padding: 20px on all sides
    pad = 20
    vb_x = min_x - pad
    vb_y = min_y - pad
    vb_w = width + pad * 2
    vb_h = height + pad * 2

    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb_x} {vb_y} {vb_w} {vb_h}" width="{vb_w}" height="{vb_h}">
  <title>SAKODE Official Brand Logo</title>
  <desc>Official vector brandmark of SAKODE: sa&#123;kode&#125;</desc>
{chr(10).join(clean_svg_elements)}
</svg>'''

    out_file = 'sakode-task-reward/public/sakode-logo.svg'
    with open(out_file, 'w', encoding='utf-8') as f:
        f.write(svg_content)
    print(f'Wrote clean logo to {out_file} (size: {len(svg_content)} bytes)')

if __name__ == '__main__':
    build_clean_logo_svg()
