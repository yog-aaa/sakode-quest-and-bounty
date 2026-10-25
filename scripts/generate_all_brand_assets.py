import numpy as np
from PIL import Image, ImageDraw, ImageFont
import vtracer
import re
import os

def create_master_assets():
    print("=== STARTING SAKODE BRAND ASSET GENERATION ===")
    
    # 1. Paths & Setup
    base_dir = os.path.abspath('sakode-task-reward')
    public_dir = os.path.join(base_dir, 'public')
    temp_dir = os.path.join(base_dir, 'scripts', 'temp_masks')
    os.makedirs(public_dir, exist_ok=True)
    os.makedirs(temp_dir, exist_ok=True)

    img_sticker = 'C:/Users/yogaa/.gemini/antigravity/brain/51755b30-e706-4a5e-9da1-ce1000f53ba4/.user_uploaded/media_1792927857631_4287be10.png'
    im = Image.open(img_sticker).convert('RGBA')
    arr = np.array(im)
    H, W, _ = arr.shape
    y_grid, x_grid = np.indices((H, W))

    # 2. Segment clean elements with strict bounds to eliminate artifacts
    masks = {
        'letter_s': ((arr[:, :, 3] > 180) & (arr[:, :, 0] > 200) & (arr[:, :, 1] > 80) & (arr[:, :, 1] < 160) & (arr[:, :, 2] < 80) & (x_grid < 160)),
        'letter_a': ((arr[:, :, 3] > 180) & (arr[:, :, 0] > 200) & (arr[:, :, 1] > 150) & (arr[:, :, 2] < 50) & (x_grid >= 160) & (x_grid < 300)),
        # brace_left: strictly y < 232 to avoid shadow
        'brace_left': ((arr[:, :, 3] > 180) & (arr[:, :, 0] < 80) & (arr[:, :, 1] < 80) & (arr[:, :, 2] < 80) & (x_grid >= 310) & (x_grid <= 360) & (y_grid < 232)),
        'mascot_head': ((arr[:, :, 3] > 180) & (arr[:, :, 0] < 50) & (arr[:, :, 1] > 140) & (arr[:, :, 2] > 200) & (x_grid >= 420) & (x_grid <= 480) & (y_grid < 100)),
        'mascot_body': ((arr[:, :, 3] > 180) & (arr[:, :, 0] < 50) & (arr[:, :, 1] > 120) & (arr[:, :, 2] < 150) & (x_grid >= 360) & (x_grid < 540)),
        'letter_o': ((arr[:, :, 3] > 180) & (arr[:, :, 0] > 200) & (arr[:, :, 1] < 100) & (arr[:, :, 2] < 100) & (x_grid >= 530) & (x_grid < 660) & (y_grid < 170)),
        'smile_arc': ((arr[:, :, 3] > 180) & (arr[:, :, 0] > 200) & (arr[:, :, 1] > 150) & (arr[:, :, 2] < 50) & (x_grid >= 530) & (x_grid < 660) & (y_grid >= 170)),
        'letter_d': ((arr[:, :, 3] > 180) & (arr[:, :, 0] > 200) & (arr[:, :, 1] < 100) & (arr[:, :, 2] > 120) & (x_grid >= 660) & (x_grid < 790)),
        'letter_e': ((arr[:, :, 3] > 180) & (arr[:, :, 0] < 50) & (arr[:, :, 1] > 140) & (arr[:, :, 2] > 200) & (x_grid >= 800) & (x_grid <= 920)),
        'brace_right': ((arr[:, :, 3] > 180) & (arr[:, :, 0] < 80) & (arr[:, :, 1] < 80) & (arr[:, :, 2] < 80) & (x_grid >= 920) & (x_grid <= 980) & (y_grid < 232)),
    }

    # Extract clean paths using vtracer
    extracted_paths = {}
    for name, mask in masks.items():
        png_p = os.path.join(temp_dir, f'{name}.png')
        svg_p = os.path.join(temp_dir, f'{name}.svg')
        Image.fromarray((mask * 255).astype(np.uint8)).save(png_p)
        vtracer.convert_image_to_svg_py(png_p, svg_p)

        with open(svg_p, 'r', encoding='utf-8') as f:
            content = f.read()

        paths = re.findall(r'<path\s+[^>]+>', content)
        # Keep only foreground paths
        fg_paths = [p for p in paths if 'fill="#FFFFFF"' in p or 'fill="#FFF"' in p or 'fill="#ffffff"' in p]
        extracted_paths[name] = fg_paths
        print(f"Extracted {name}: {len(fg_paths)} path(s)")

    # Extract Sticker Outline and Shadow
    # Shadow mask: black pixels outside braces
    shadow_mask = (arr[:, :, 3] > 180) & (arr[:, :, 0] < 40) & (arr[:, :, 1] < 40) & (arr[:, :, 2] < 40) & ~masks['brace_left'] & ~masks['brace_right']
    sticker_body_mask = (arr[:, :, 3] > 180) & ~shadow_mask

    # Save and trace sticker body and shadow
    Image.fromarray((sticker_body_mask * 255).astype(np.uint8)).save(os.path.join(temp_dir, 'sticker_body.png'))
    vtracer.convert_image_to_svg_py(os.path.join(temp_dir, 'sticker_body.png'), os.path.join(temp_dir, 'sticker_body.svg'))

    Image.fromarray((shadow_mask * 255).astype(np.uint8)).save(os.path.join(temp_dir, 'sticker_shadow.png'))
    vtracer.convert_image_to_svg_py(os.path.join(temp_dir, 'sticker_shadow.png'), os.path.join(temp_dir, 'sticker_shadow.svg'))

    with open(os.path.join(temp_dir, 'sticker_body.svg'), 'r') as f:
        sticker_body_paths = [p for p in re.findall(r'<path\s+[^>]+>', f.read()) if 'fill="#FFFFFF"' in p or 'fill="#FFF"' in p or 'fill="#ffffff"' in p]
    with open(os.path.join(temp_dir, 'sticker_shadow.svg'), 'r') as f:
        sticker_shadow_paths = [p for p in re.findall(r'<path\s+[^>]+>', f.read()) if 'fill="#FFFFFF"' in p or 'fill="#FFF"' in p or 'fill="#ffffff"' in p]

    print(f"Sticker body paths: {len(sticker_body_paths)}, shadow paths: {len(sticker_shadow_paths)}")

    # 3. Vectorize "Work" wordmark using Nunito-ExtraBold
    font = ImageFont.truetype('Nunito-Variable.ttf', 160)
    font.set_variation_by_axes([800])
    
    # Measure text "Work"
    work_im = Image.new('RGBA', (600, 300), (0, 0, 0, 0))
    draw = ImageDraw.Draw(work_im)
    draw.text((40, 40), "Work", fill=(255, 255, 255, 255), font=font)
    work_arr = np.array(work_im)
    work_mask = work_arr[:, :, 3] > 128
    Image.fromarray((work_mask * 255).astype(np.uint8)).save(os.path.join(temp_dir, 'work_text.png'))
    vtracer.convert_image_to_svg_py(os.path.join(temp_dir, 'work_text.png'), os.path.join(temp_dir, 'work_text.svg'))
    
    with open(os.path.join(temp_dir, 'work_text.svg'), 'r') as f:
        work_paths = [p for p in re.findall(r'<path\s+[^>]+>', f.read()) if 'fill="#FFFFFF"' in p or 'fill="#FFF"' in p or 'fill="#ffffff"' in p]
    print(f"Extracted 'Work' paths: {len(work_paths)}")

    # Palette definitions
    colors_light = {
        'letter_s': '#F9723B',
        'letter_a': '#EDAC1C',
        'brace_left': '#1E293B',
        'mascot_head': '#00A3E0',
        'mascot_body': '#00A86B',
        'letter_o': '#FF4B55',
        'smile_arc': '#FFA800',
        'letter_d': '#FF409F',
        'letter_e': '#52A5E8',
        'brace_right': '#1E293B',
    }

    colors_dark = {
        'letter_s': '#F9723B',
        'letter_a': '#EDAC1C',
        'brace_left': '#94A3B8', # High contrast light slate for dark mode
        'mascot_head': '#38BDF8',
        'mascot_body': '#10B981',
        'letter_o': '#FF4B55',
        'smile_arc': '#FBBF24',
        'letter_d': '#F472B6',
        'letter_e': '#60A5FA',
        'brace_right': '#94A3B8',
    }

    def render_paths(color_map):
        res = []
        for name, col in color_map.items():
            paths = extracted_paths[name]
            colored = [re.sub(r'fill="[^"]+"', f'fill="{col}"', p) for p in paths]
            res.append(f'  <g id="{name}">\n    ' + '\n    '.join(colored) + '\n  </g>')
        return '\n'.join(res)

    # 4. Generate ASET 1: sakode-logo.svg (Horizontal Clean)
    # Bounding box is x=54..980 (w=926), y=32..232 (h=200)
    logo_clean_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="40 20 955 225" width="955" height="225">
  <title>SAKODE Official Brand Logo</title>
  <desc>Official horizontal vector brandmark of SAKODE Academy: sa&#123;kode&#125;</desc>
{render_paths(colors_light)}
</svg>'''
    with open(os.path.join(public_dir, 'sakode-logo.svg'), 'w', encoding='utf-8') as f:
        f.write(logo_clean_svg)
    print("Wrote sakode-logo.svg")

    # 5. Generate ASET 2: sakode-logo-sticker.svg (Full Sticker with Drop Shadow)
    shadow_paths_colored = [re.sub(r'fill="[^"]+"', 'fill="#000000"', p) for p in sticker_shadow_paths]
    body_paths_colored = [re.sub(r'fill="[^"]+"', 'fill="#FFFFFF"', p) for p in sticker_body_paths]
    
    logo_sticker_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 285" width="1024" height="285">
  <title>SAKODE Sticker Badge Logo</title>
  <desc>Official pop-culture sticker brandmark with cloud-border and drop-shadow</desc>
  <g id="sticker-shadow">
    {chr(10).join(shadow_paths_colored)}
  </g>
  <g id="sticker-border">
    {chr(10).join(body_paths_colored)}
  </g>
  <g id="sticker-brandmark">
{render_paths(colors_light)}
  </g>
</svg>'''
    with open(os.path.join(public_dir, 'sakode-logo-sticker.svg'), 'w', encoding='utf-8') as f:
        f.write(logo_sticker_svg)
    print("Wrote sakode-logo-sticker.svg")

    # 6. Generate ASET 3: sakode-brandmark.svg (Compact {k} clean vector)
    # Standalone {k}: brace_left (310..360), mascot (377..518), brace_right shifted by -388 to 535..592
    # Total width: x=310..592 (w=282), y=45..228 (h=183).
    # Center is at x=451, y=136.5.
    # In a 512x512 square canvas:
    # Scale = 512 / 320 = 1.6
    # Let's define viewBox centered:
    # bounds: x from 270 to 630 (width 360), y from 10 to 260 (height 250) -> square viewBox 270 5 360 360 (or scaled)
    # Let's shift brace_right by -388:
    br_paths_brandmark = []
    for p in extracted_paths['brace_right']:
        # We need to wrap in a transform translate(-388, 0)
        p_col = re.sub(r'fill="[^"]+"', 'fill="#1E293B"', p)
        br_paths_brandmark.append(f'<g transform="translate(-388, 0)">\n      {p_col}\n    </g>')

    br_paths_brandmark_dark = []
    for p in extracted_paths['brace_right']:
        p_col = re.sub(r'fill="[^"]+"', 'fill="#94A3B8"', p)
        br_paths_brandmark_dark.append(f'<g transform="translate(-388, 0)">\n      {p_col}\n    </g>')

    bl_paths_brandmark = [re.sub(r'fill="[^"]+"', 'fill="#1E293B"', p) for p in extracted_paths['brace_left']]
    bl_paths_brandmark_dark = [re.sub(r'fill="[^"]+"', 'fill="#94A3B8"', p) for p in extracted_paths['brace_left']]
    head_paths_brandmark = [re.sub(r'fill="[^"]+"', 'fill="#00A3E0"', p) for p in extracted_paths['mascot_head']]
    body_paths_brandmark = [re.sub(r'fill="[^"]+"', 'fill="#00A86B"', p) for p in extracted_paths['mascot_body']]

    # Brandmark clean: centered square viewbox (w=340, h=340, centered at x=451, y=136.5 -> vb: 281 -33.5 340 340)
    brandmark_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="281 -33 340 340" width="512" height="512">
  <title>SAKODE Compact Brandmark</title>
  <desc>Developer mascot enclosed in code curly braces: &#123;k&#125;</desc>
  <g id="brace-left">
    {chr(10).join(bl_paths_brandmark)}
  </g>
  <g id="mascot-k">
    <g id="mascot-head">
      {chr(10).join(head_paths_brandmark)}
    </g>
    <g id="mascot-body">
      {chr(10).join(body_paths_brandmark)}
    </g>
  </g>
  <g id="brace-right">
    {chr(10).join(br_paths_brandmark)}
  </g>
</svg>'''
    with open(os.path.join(public_dir, 'sakode-brandmark.svg'), 'w', encoding='utf-8') as f:
        f.write(brandmark_svg)
    print("Wrote sakode-brandmark.svg")

    # 7. Generate ASET 4: sakode-brandmark-sticker.svg (Compact {k} with rounded cloud badge & shadow)
    brandmark_sticker_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="240 -60 420 420" width="512" height="512">
  <title>SAKODE Compact Brandmark Sticker</title>
  <desc>Developer mascot badge with sticker border and shadow</desc>
  <defs>
    <filter id="sticker-drop-shadow" x="-20%" y="-20%" width="150%" height="150%">
      <feDropShadow dx="0" dy="12" stdDeviation="0" flood-color="#0F172A" flood-opacity="1" />
    </filter>
  </defs>
  <!-- Cloud-like rounded badge background -->
  <rect x="260" y="-30" width="380" height="340" rx="60" fill="#FFFFFF" filter="url(#sticker-drop-shadow)" />
  <rect x="260" y="-30" width="380" height="340" rx="60" fill="#FFFFFF" stroke="#F1F5F9" stroke-width="6" />
  
  <g id="brandmark-content" transform="translate(0, 10)">
    <g id="brace-left">
      {chr(10).join(bl_paths_brandmark)}
    </g>
    <g id="mascot-k">
      <g id="mascot-head">
        {chr(10).join(head_paths_brandmark)}
      </g>
      <g id="mascot-body">
        {chr(10).join(body_paths_brandmark)}
      </g>
    </g>
    <g id="brace-right">
      {chr(10).join(br_paths_brandmark)}
    </g>
  </g>
</svg>'''
    with open(os.path.join(public_dir, 'sakode-brandmark-sticker.svg'), 'w', encoding='utf-8') as f:
        f.write(brandmark_sticker_svg)
    print("Wrote sakode-brandmark-sticker.svg")

    # 8. Generate ASET 5: sakode-work-logo-light.svg (SAKODE + Work for Light Mode)
    # Logo width: x=54..980.
    # At x=1020, we place the "Work" badge pill or typographic treatment!
    # Let's design a crisp pill badge:
    # Pill: x=1020, y=70, width=280, height=135, rx=36, fill="#0F172A" or "#71CFFE"
    # Text "WORK": inside pill or clean bold text
    # Total viewBox: 40 20 1340 225
    work_light_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="40 20 1360 225" width="1360" height="225">
  <title>SAKODE Work Official Logo (Light Mode)</title>
  <desc>Official horizontal logo of SAKODE Work platform for light backgrounds</desc>
  <g id="sakode-brandmark">
{render_paths(colors_light)}
  </g>
  <!-- Work Typographic Badge -->
  <g id="work-badge" transform="translate(1015, 78)">
    <rect x="0" y="0" width="280" height="135" rx="36" fill="#0F172A" />
    <!-- Subtle top glossy accent -->
    <rect x="4" y="4" width="272" height="60" rx="32" fill="#FFFFFF" opacity="0.08" />
    <!-- Cyan glow dot -->
    <circle cx="52" cy="67" r="14" fill="#71CFFE" />
    <circle cx="52" cy="67" r="8" fill="#FFFFFF" opacity="0.9" />
    <!-- Work typography in Nunito 800 -->
    <text x="86" y="87" fill="#FFFFFF" font-family="Nunito, system-ui, -apple-system, sans-serif" font-weight="900" font-size="64" letter-spacing="1.5">Work</text>
  </g>
</svg>'''
    with open(os.path.join(public_dir, 'sakode-work-logo-light.svg'), 'w', encoding='utf-8') as f:
        f.write(work_light_svg)
    print("Wrote sakode-work-logo-light.svg")

    # 9. Generate ASET 6: sakode-work-logo-dark.svg (SAKODE + Work for Dark Mode)
    work_dark_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="40 20 1360 225" width="1360" height="225">
  <title>SAKODE Work Official Logo (Dark Mode)</title>
  <desc>Official horizontal logo of SAKODE Work platform tuned for dark mode with WCAG AA compliance</desc>
  <g id="sakode-brandmark">
{render_paths(colors_dark)}
  </g>
  <!-- Work Typographic Badge (Cyan Neon / Slate for Dark Mode) -->
  <g id="work-badge-dark" transform="translate(1015, 78)">
    <rect x="0" y="0" width="280" height="135" rx="36" fill="#71CFFE" />
    <!-- Subtle inner border -->
    <rect x="3" y="3" width="274" height="129" rx="33" fill="none" stroke="#FFFFFF" stroke-width="2" opacity="0.5" />
    <!-- Dark dot accent -->
    <circle cx="52" cy="67" r="14" fill="#0F172A" />
    <circle cx="52" cy="67" r="6" fill="#71CFFE" />
    <text x="86" y="87" fill="#0F172A" font-family="Nunito, system-ui, -apple-system, sans-serif" font-weight="900" font-size="64" letter-spacing="1.5">Work</text>
  </g>
</svg>'''
    with open(os.path.join(public_dir, 'sakode-work-logo-dark.svg'), 'w', encoding='utf-8') as f:
        f.write(work_dark_svg)
    print("Wrote sakode-work-logo-dark.svg")

    print("=== ALL SVGs GENERATED SUCCESSFULLY ===")

if __name__ == '__main__':
    create_master_assets()
