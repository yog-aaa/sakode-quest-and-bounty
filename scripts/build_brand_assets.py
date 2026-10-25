import numpy as np
from PIL import Image
import vtracer
import re
import os

def run():
    img_path = 'C:/Users/yogaa/.gemini/antigravity/brain/51755b30-e706-4a5e-9da1-ce1000f53ba4/.user_uploaded/media_1792927857631_4287be10.png'
    im = Image.open(img_path).convert('RGBA')
    arr = np.array(im)
    H, W, _ = arr.shape

    elements = {
        'letter_s': ((arr[:, :, 3] > 180) & (arr[:, :, 0] > 200) & (arr[:, :, 1] > 80) & (arr[:, :, 1] < 160) & (arr[:, :, 2] < 80) & (np.arange(W) < 160), '#F9723B'),
        'letter_a': ((arr[:, :, 3] > 180) & (arr[:, :, 0] > 200) & (arr[:, :, 1] > 150) & (arr[:, :, 2] < 50) & (np.arange(W) >= 160) & (np.arange(W) < 300), '#EDAC1C'),
        'brace_left': ((arr[:, :, 3] > 180) & (arr[:, :, 0] < 100) & (arr[:, :, 1] < 100) & (arr[:, :, 2] < 100) & (np.arange(W) >= 280) & (np.arange(W) < 380), '#1E293B'),
        'mascot_head': ((arr[:, :, 3] > 180) & (arr[:, :, 0] < 50) & (arr[:, :, 1] > 140) & (arr[:, :, 2] > 200) & (np.arange(W) >= 400) & (np.arange(W) < 480) & (np.arange(H)[:, None] < 100), '#00A3E0'),
        'mascot_body': ((arr[:, :, 3] > 180) & (arr[:, :, 0] < 50) & (arr[:, :, 1] > 120) & (arr[:, :, 2] < 150) & (np.arange(W) >= 360) & (np.arange(W) < 540), '#00A86B'),
        'letter_o': ((arr[:, :, 3] > 180) & (arr[:, :, 0] > 200) & (arr[:, :, 1] < 100) & (arr[:, :, 2] < 100) & (np.arange(W) >= 530) & (np.arange(W) < 660) & (np.arange(H)[:, None] < 170), '#FF4B55'),
        'smile_arc': ((arr[:, :, 3] > 180) & (arr[:, :, 0] > 200) & (arr[:, :, 1] > 150) & (arr[:, :, 2] < 50) & (np.arange(W) >= 530) & (np.arange(W) < 660) & (np.arange(H)[:, None] >= 170), '#FFA800'),
        'letter_d': ((arr[:, :, 3] > 180) & (arr[:, :, 0] > 200) & (arr[:, :, 1] < 100) & (arr[:, :, 2] > 120) & (np.arange(W) >= 660) & (np.arange(W) < 790), '#FF409F'),
        'letter_e': ((arr[:, :, 3] > 180) & (arr[:, :, 0] < 50) & (arr[:, :, 1] > 140) & (arr[:, :, 2] > 200) & (np.arange(W) >= 780) & (np.arange(W) < 900), '#52A5E8'),
        'brace_right': ((arr[:, :, 3] > 180) & (arr[:, :, 0] < 100) & (arr[:, :, 1] < 100) & (arr[:, :, 2] < 100) & (np.arange(W) >= 880) & (np.arange(W) < 1000), '#1E293B'),
    }

    temp_dir = 'sakode-task-reward/scripts/temp_masks'
    os.makedirs(temp_dir, exist_ok=True)
    svg_groups = []

    # Combined mask to get bounding box of clean logo
    all_fg_mask = np.zeros((H, W), dtype=bool)

    for name, (mask, color) in elements.items():
        all_fg_mask |= mask
        mask_img = Image.fromarray((mask * 255).astype(np.uint8))
        png_p = os.path.join(temp_dir, f'{name}.png')
        svg_p = os.path.join(temp_dir, f'{name}.svg')
        mask_img.save(png_p)
        vtracer.convert_image_to_svg_py(png_p, svg_p)

        with open(svg_p, 'r', encoding='utf-8') as f:
            content = f.read()

        paths = re.findall(r'<path\s+[^>]+>', content)
        # In vtracer binary output, background path has fill="#000000" or similar, foreground has fill="#FFFFFF"
        fg_paths = []
        for p in paths:
            # Check if this path is the foreground
            if 'fill="#FFFFFF"' in p or 'fill="#FFF"' in p or 'fill="#ffffff"' in p:
                # Replace with color
                p_col = re.sub(r'fill="[^"]+"', f'fill="{color}"', p)
                fg_paths.append(p_col)

        print(f'{name:12s}: extracted {len(fg_paths)} paths')
        svg_groups.append(f'  <!-- {name} -->\n  <g id="{name}">\n    ' + '\n    '.join(fg_paths) + '\n  </g>')

    # Bounding box of all letters
    ys, xs = np.where(all_fg_mask)
    min_x, max_x = int(xs.min()), int(xs.max())
    min_y, max_y = int(ys.min()), int(ys.max())
    w_box = max_x - min_x + 1
    h_box = max_y - min_y + 1
    print(f'Combined letter bounding box: x={min_x}..{max_x} (w={w_box}), y={min_y}..{max_y} (h={h_box})')

    # Also let's extract the white sticker background and the drop shadow!
    # Shadow mask:
    shadow_mask = (arr[:, :, 3] > 180) & (arr[:, :, 0] < 40) & (arr[:, :, 1] < 40) & (arr[:, :, 2] < 40) & ~elements['brace_left'][0] & ~elements['brace_right'][0]
    # White sticker border:
    white_mask = (arr[:, :, 3] > 180) & (arr[:, :, 0] > 230) & (arr[:, :, 1] > 230) & (arr[:, :, 2] > 230)
    # The full sticker contour is all_sticker = (arr[:, :, 3] > 180) without shadow:
    sticker_body_mask = (arr[:, :, 3] > 180) & ~shadow_mask

    print('Shadow mask count:', np.sum(shadow_mask))
    print('Sticker body mask count:', np.sum(sticker_body_mask))

    # Save and trace sticker body and shadow
    Image.fromarray((sticker_body_mask * 255).astype(np.uint8)).save(os.path.join(temp_dir, 'sticker_body.png'))
    vtracer.convert_image_to_svg_py(os.path.join(temp_dir, 'sticker_body.png'), os.path.join(temp_dir, 'sticker_body.svg'))

    Image.fromarray((shadow_mask * 255).astype(np.uint8)).save(os.path.join(temp_dir, 'sticker_shadow.png'))
    vtracer.convert_image_to_svg_py(os.path.join(temp_dir, 'sticker_shadow.png'), os.path.join(temp_dir, 'sticker_shadow.svg'))

    print('Vectorization completed successfully!')

if __name__ == '__main__':
    run()
