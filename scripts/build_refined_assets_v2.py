import xml.etree.ElementTree as ET
import re
import os
from fontTools.ttLib import TTFont
from fontTools.varLib.mutator import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen

def build_refined_assets_v2():
    print("=== REFINING MASTER ASSETS V2 (SMILE RESTORATION + NUNITO 900 VECTOR PATHS) ===")
    base_dir = os.path.abspath('sakode-task-reward')
    public_dir = os.path.join(base_dir, 'public')
    master_svg_path = os.path.join(public_dir, 'brand', 'official-svg', 'sakode.svg')

    # 1. Read master sakode.svg
    with open(master_svg_path, 'r', encoding='utf-8') as f:
        master_content = f.read()

    paths = re.findall(r'<path[^>]+>', master_content)
    print(f"Loaded master sakode.svg: {len(paths)} cubic bezier paths found")

    # 2. Setup Nunito 900 Vector Extraction
    var_font = TTFont('Nunito-Variable.ttf')
    static_font = instantiateVariableFont(var_font, {'wght': 900})
    glyph_set = static_font.getGlyphSet()

    def get_glyph_path(char):
        gname = static_font.getBestCmap().get(ord(char))
        glyph = glyph_set[gname]
        pen = SVGPathPen(glyph_set)
        glyph.draw(pen)
        return pen.getCommands(), glyph.width

    def text_to_svg_paths(text, size, fill, cx=0, cy=0, align='center', tracking=0):
        scale = size / 1000.0
        glyphs_data = []
        total_w = 0
        for i, ch in enumerate(text):
            if ch == ' ':
                w = 280 * scale + tracking
                glyphs_data.append((' ', None, w))
                total_w += w
                continue
            gname = static_font.getBestCmap().get(ord(ch))
            if gname is None:
                continue
            glyph = glyph_set[gname]
            pen = SVGPathPen(glyph_set)
            glyph.draw(pen)
            d = pen.getCommands()
            w = glyph.width * scale + tracking
            glyphs_data.append((ch, d, w))
            total_w += w

        if glyphs_data and tracking != 0:
            total_w -= tracking

        start_x = cx - total_w / 2 if align == 'center' else cx
        cur_x = start_x
        paths_out = []
        for ch, d, w in glyphs_data:
            if d is not None:
                # In font coords y is up; in SVG y is down -> scale(scale, -scale)
                paths_out.append(f'<path d="{d}" fill="{fill}" transform="translate({cur_x:.2f}, {cy:.2f}) scale({scale:.4f}, {-scale:.4f})" />')
            cur_x += w
        return '\n'.join(paths_out)

    # -------------------------------------------------------------
    # 1. HORIZONTAL LOGO: SAKODE Work (sakode-work-logo.svg)
    # -------------------------------------------------------------
    w_d, w_w = get_glyph_path('w')
    o_d, o_w = get_glyph_path('o')
    r_d, r_w = get_glyph_path('r')
    k_d, k_w = get_glyph_path('k')

    scale = 0.58
    start_x = 2360
    base_y = 502

    w_x = start_x
    o_x = w_x + w_w * scale + 30
    r_x = o_x + o_w * scale + 30
    k_x = r_x + r_w * scale + 30
    total_work_width = (k_x + k_w * scale) - start_x

    # Center of new 'o' for "work" smile
    new_o_center = o_x + (o_w * scale) / 2
    smile_dx = new_o_center - 1331.3
    orig_smile_path = paths[9]
    smile_work_shifted = re.sub(
        r'<path\s+fill-rule="evenodd"\s+clip-rule="evenodd"\s+d="([^"]+)"',
        lambda m: f'<g transform="translate({smile_dx}, 0)"><path fill-rule="evenodd" clip-rule="evenodd" d="{m.group(1)}"',
        orig_smile_path
    ) + '</g>'

    work_letters_svg = f'''
    <!-- WORK Letterforms (Nunito 900 Pure Bezier Paths) -->
    <!-- 'w' in Sky Blue #54A5E4 -->
    <g transform="translate({w_x}, {base_y}) scale({scale}, {-scale})">
      <path d="{w_d}" fill="#54A5E4" />
    </g>

    <!-- 'o' in Coral Red #F94052 -->
    <g transform="translate({o_x}, {base_y}) scale({scale}, {-scale})">
      <path d="{o_d}" fill="#F94052" />
    </g>
    <!-- Authentic Smile under 'o' in work -->
    {smile_work_shifted}

    <!-- 'r' in Emerald Green #009670 -->
    <g transform="translate({r_x}, {base_y}) scale({scale}, {-scale})">
      <path d="{r_d}" fill="#009670" />
    </g>

    <!-- 'k' in Magenta Pink #FF409F -->
    <g transform="translate({k_x}, {base_y}) scale({scale}, {-scale})">
      <path d="{k_d}" fill="#FF409F" />
    </g>
    '''

    pad_x = 75
    pill_x = start_x - pad_x
    pill_y = 100
    pill_w = total_work_width + pad_x * 2 + 30
    pill_h = 475
    pill_rx = 110

    work_shadow_svg = f'<rect x="{pill_x + 20}" y="{pill_y + 26}" width="{pill_w}" height="{pill_h}" rx="{pill_rx}" fill="black" />'
    work_white_svg = f'<rect x="{pill_x}" y="{pill_y}" width="{pill_w}" height="{pill_h}" rx="{pill_rx}" fill="white" />'

    total_vb_w = int(pill_x + pill_w + 60)
    total_vb_h = 660

    sakode_shadows = '\n'.join([paths[19], paths[20], paths[21], paths[22], paths[23]])
    sakode_white = paths[0]
    
    # CRUCIAL FIX 1: INCLUDE paths[9] (smile arc on SAKODE 'o')!
    # paths[1] to paths[8] (letters d, k, a, e, o, s, }, {)
    # paths[9] (smile on SAKODE 'o' #EDAC1C) -> MUST BE INCLUDED!
    # paths[10] (k head)
    # paths[11] to paths[18] (counter holes & details)
    sakode_letters_with_smile = '\n'.join([
        paths[1], paths[2], paths[3], paths[4], paths[5], paths[6], paths[7], paths[8],
        paths[9], # <-- SAKODE 'o' SMILE ARC RESTORED!
        paths[10], paths[11], paths[12], paths[13], paths[14], paths[15], paths[16], paths[17], paths[18]
    ])

    horizontal_logo_svg = f'''<svg width="{total_vb_w}" height="{total_vb_h}" viewBox="0 0 {total_vb_w} {total_vb_h}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <title>SAKODE Work Official Vector Logo</title>
  <desc>Master cubic bezier vector logo of SAKODE Work: sa&#123;kode&#125; work with dual smiles</desc>
  
  <!-- LAYER 1: SOLID BLACK DROP SHADOWS -->
  <g id="drop-shadows">
{sakode_shadows}
    {work_shadow_svg}
  </g>

  <!-- LAYER 2: WHITE DIE-CUT STICKER BORDERS -->
  <g id="white-borders">
{sakode_white}
    {work_white_svg}
  </g>

  <!-- LAYER 3: SAKODE LETTERS & MASCOT (WITH OFFICIAL SMILE ON 'o') -->
  <g id="sakode-brand">
{sakode_letters_with_smile}
  </g>

  <!-- LAYER 4: WORK LETTERS & SMILE -->
  <g id="work-wordmark">
{work_letters_svg}
  </g>
</svg>'''

    out_logo_svg = os.path.join(public_dir, 'sakode-work-logo.svg')
    with open(out_logo_svg, 'w', encoding='utf-8') as f:
        f.write(horizontal_logo_svg)
    print(f"Generated sakode-work-logo.svg (with SAKODE smile restored!): {total_vb_w}x{total_vb_h}")

    # -------------------------------------------------------------
    # 2. BOUNTY QUEST EMBLEM: SAKODE Work (sakode-work-emblem.svg)
    # -------------------------------------------------------------
    emblem_scale = 0.82
    tx = 550 - 1024 * emblem_scale
    ty = 420 - 305 * emblem_scale

    emblem_mascot_svg = f'''
    <g transform="translate({tx}, {ty}) scale({emblem_scale})">
      <!-- Left Brace {{ from sakode.svg -->
      {paths[8]}
      <!-- Mascot Body from sakode.svg -->
      {paths[2]}
      <!-- Mascot Head from sakode.svg -->
      {paths[10]}
      <!-- Symmetrical Right Brace }} shifted directly from sakode.svg -->
      <g transform="translate(-843, 0)">
        {paths[7]}
      </g>
    </g>
    '''

    hex_path = "M 550 60 L 890 256 A 40 40 0 0 1 910 290 L 910 680 A 40 40 0 0 1 890 714 L 550 910 A 40 40 0 0 1 530 910 L 190 714 A 40 40 0 0 1 170 680 L 170 290 A 40 40 0 0 1 190 256 L 530 60 A 40 40 0 0 1 550 60 Z"
    hex_white_path = "M 550 35 L 915 245 A 55 55 0 0 1 940 290 L 940 680 A 55 55 0 0 1 915 725 L 550 935 A 55 55 0 0 1 525 935 L 160 725 A 55 55 0 0 1 135 680 L 135 290 A 55 55 0 0 1 160 245 L 525 35 A 55 55 0 0 1 550 35 Z"
    hex_shadow_path = "M 566 59 L 931 269 A 55 55 0 0 1 956 314 L 956 704 A 55 55 0 0 1 931 749 L 566 959 A 55 55 0 0 1 541 959 L 176 749 A 55 55 0 0 1 151 704 L 151 314 A 55 55 0 0 1 176 269 L 541 59 A 55 55 0 0 1 566 59 Z"

    # Golden Bounty Coins with Pure Nunito 900 "{ }"
    coin_l_x, coin_r_x = 265, 835
    coin_y = 450
    coin_r = 65

    # Pure Nunito 900 "{ }" paths
    coin_brackets_l = text_to_svg_paths("{ }", 52, "#92400E", cx=coin_l_x, cy=coin_y + 18, tracking=4)
    coin_brackets_r = text_to_svg_paths("{ }", 52, "#92400E", cx=coin_r_x, cy=coin_y + 18, tracking=4)

    coins_svg = f'''
    <!-- LEFT BOUNTY COIN -->
    <g id="coin-left">
      <circle cx="{coin_l_x + 6}" cy="{coin_y + 8}" r="{coin_r}" fill="black" opacity="0.6" />
      <circle cx="{coin_l_x}" cy="{coin_y}" r="{coin_r}" fill="#FFA800" stroke="#D97706" stroke-width="5" />
      <circle cx="{coin_l_x}" cy="{coin_y}" r="{coin_r - 9}" fill="#FBBF24" stroke="#F59E0B" stroke-width="2.5" />
      <!-- Embossed Nunito 900 {{ }} Pure Vector Paths -->
      {coin_brackets_l}
    </g>

    <!-- RIGHT BOUNTY COIN -->
    <g id="coin-right">
      <circle cx="{coin_r_x + 6}" cy="{coin_y + 8}" r="{coin_r}" fill="black" opacity="0.6" />
      <circle cx="{coin_r_x}" cy="{coin_y}" r="{coin_r}" fill="#FFA800" stroke="#D97706" stroke-width="5" />
      <circle cx="{coin_r_x}" cy="{coin_y}" r="{coin_r - 9}" fill="#FBBF24" stroke="#F59E0B" stroke-width="2.5" />
      <!-- Embossed Nunito 900 {{ }} Pure Vector Paths -->
      {coin_brackets_r}
    </g>
    '''

    def make_star(x, y, s, col):
        return f'<polygon points="{x},{y-s} {x+s*0.28},{y-s*0.28} {x+s},{y} {x+s*0.28},{y+s*0.28} {x},{y+s} {x-s*0.28},{y+s*0.28} {x-s},{y} {x-s*0.28},{y-s*0.28}" fill="{col}" />'

    stars_svg = f'''
    {make_star(210, 310, 26, "#FFA800")}
    {make_star(890, 310, 26, "#FFA800")}
    {make_star(360, 180, 20, "#71CFFE")}
    {make_star(740, 180, 20, "#71CFFE")}
    '''

    # CRUCIAL FIX 2: RESTORE NUNITO 900 FOR ALL TEXT IN EMBLEM!
    # A) SAKODE header text (Nunito 900 pure vector paths)
    sakode_header_paths = text_to_svg_paths("SAKODE", 48, "#71CFFE", cx=550, cy=205, tracking=6)

    # B) WORK ribbon text (Nunito 900 pure vector paths, 96px height)
    plaque_y = 705
    plaque_w = 620
    plaque_h = 145
    plaque_rx = (1100 - plaque_w) // 2
    plaque_r = 38

    # Wordmark "WORK" in Nunito 900: centered at cx=550, cy=plaque_y + 102
    work_ribbon_paths = text_to_svg_paths("WORK", 96, "#0F172A", cx=550, cy=plaque_y + 102, tracking=4)

    # C) Sub-pill text "TASK & BOUNTY PLATFORM" in Nunito 900
    sub_pill_y = plaque_y + plaque_h + 16
    sub_pill_w = 380
    sub_pill_h = 44
    sub_pill_x = 550 - sub_pill_w // 2

    sub_pill_paths = text_to_svg_paths("TASK & BOUNTY PLATFORM", 20, "#0F172A", cx=550, cy=sub_pill_y + 30, tracking=2)

    plaque_svg = f'''
    <!-- 3D PLAQUE / RIBBON "WORK" -->
    <g id="work-plaque">
      <!-- Plaque Drop Shadow -->
      <rect x="{plaque_rx + 10}" y="{plaque_y + 14}" width="{plaque_w}" height="{plaque_h}" rx="{plaque_r}" fill="black" />
      <!-- Plaque White Border -->
      <rect x="{plaque_rx}" y="{plaque_y}" width="{plaque_w}" height="{plaque_h}" rx="{plaque_r}" fill="white" />
      <!-- Plaque Body: Cyber Cyan #71CFFE -->
      <rect x="{plaque_rx + 8}" y="{plaque_y + 8}" width="{plaque_w - 16}" height="{plaque_h - 16}" rx="{plaque_r - 6}" fill="#71CFFE" />
      <!-- Top Gloss -->
      <rect x="{plaque_rx + 16}" y="{plaque_y + 14}" width="{plaque_w - 32}" height="45" rx="20" fill="white" opacity="0.35" />
      
      <!-- Wordmark "WORK" (Nunito 900 Pure Vector Paths - Authentic Chubby & Rounded!) -->
      {work_ribbon_paths}
      
      <!-- Sub-pill: "TASK & BOUNTY PLATFORM" -->
      <g id="sub-pill">
        <rect x="{sub_pill_x + 2}" y="{sub_pill_y + 3}" width="{sub_pill_w}" height="{sub_pill_h}" rx="22" fill="black" opacity="0.5" />
        <rect x="{sub_pill_x}" y="{sub_pill_y}" width="{sub_pill_w}" height="{sub_pill_h}" rx="22" fill="#FFA800" stroke="white" stroke-width="2.5" />
        <!-- Nunito 900 Pure Vector Paths -->
        {sub_pill_paths}
      </g>
    </g>
    '''

    emblem_svg = f'''<svg width="1100" height="1060" viewBox="0 0 1100 1060" fill="none" xmlns="http://www.w3.org/2000/svg">
  <title>SAKODE Work Quest Emblem</title>
  <desc>Master vector bounty quest emblem featuring official SAKODE developer mascot, golden bounty coins, and 3D WORK ribbon with pure Nunito 900 typography</desc>
  
  <defs>
    <radialGradient id="hex-ambient" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#1E293B" />
      <stop offset="70%" stop-color="#0F172A" />
      <stop offset="100%" stop-color="#0B0F19" />
    </radialGradient>
    <linearGradient id="neon-cyan-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#71CFFE" />
      <stop offset="50%" stop-color="#00A3E0" />
      <stop offset="100%" stop-color="#0284C7" />
    </linearGradient>
  </defs>

  <!-- LAYER 1: DROP SHADOW -->
  <path d="{hex_shadow_path}" fill="black" />

  <!-- LAYER 2: WHITE DIE-CUT BORDER -->
  <path d="{hex_white_path}" fill="white" />

  <!-- LAYER 3: INNER SHIELD BODY -->
  <path d="{hex_path}" fill="url(#hex-ambient)" stroke="url(#neon-cyan-stroke)" stroke-width="16" />

  <!-- Ambient Light Radar Ring -->
  <circle cx="550" cy="480" r="320" fill="none" stroke="#71CFFE" stroke-width="3" stroke-opacity="0.25" stroke-dasharray="10 10" />

  <!-- SAKODE Master Header (Nunito 900 Pure Vector Paths) -->
  {sakode_header_paths}

  <!-- LAYER 4: MASCOT & BRACES FROM SAKODE MASTER VECTOR -->
{emblem_mascot_svg}

  <!-- LAYER 5: BOUNTY COINS & STARS -->
{coins_svg}
{stars_svg}

  <!-- LAYER 6: 3D RIBBON "WORK" WITH NUNITO 900 PURE VECTOR PATHS -->
{plaque_svg}
</svg>'''

    out_emblem_svg = os.path.join(public_dir, 'sakode-work-emblem.svg')
    with open(out_emblem_svg, 'w', encoding='utf-8') as f:
        f.write(emblem_svg)
    print(f"Generated sakode-work-emblem.svg (with Nunito 900 vector paths!): 1100x1060")

    print("=== REFINEMENT V2 COMPLETE ===")

if __name__ == '__main__':
    build_refined_assets_v2()
