import xml.etree.ElementTree as ET
import re
import os
from fontTools.ttLib import TTFont
from fontTools.varLib.mutator import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen

def build_all():
    print("=== STARTING REFINED MASTER VECTOR ASSET CREATION ===")
    base_dir = os.path.abspath('sakode-task-reward')
    public_dir = os.path.join(base_dir, 'public')
    master_svg_path = os.path.join(public_dir, 'brand', 'official-svg', 'sakode.svg')

    # 1. Read master sakode.svg
    with open(master_svg_path, 'r', encoding='utf-8') as f:
        master_content = f.read()

    # Extract all path tags verbatim
    paths = re.findall(r'<path[^>]+>', master_content)
    print(f"Loaded master sakode.svg: {len(paths)} cubic bezier paths found")

    # Paths index in sakode.svg:
    # 0: white sticker border
    # 1: #FF409F (d)
    # 2: #009670 (k body)
    # 3: #EDAC1C (a)
    # 4: #54A5E4 (e)
    # 5: #F94052 (o)
    # 6: #F9723B (s)
    # 7: #383838 (brace right })
    # 8: #383838 (brace left {)
    # 9: #EDAC1C (smile arc on o)
    # 10: #54A5E4 (k head)
    # 11: #FDFCFC (counter o)
    # 12: #FDFDFD (counter d)
    # 13: #FEFEFA (counter a)
    # 14: black (shadow d)
    # 15: #FAFCFA (counter e)
    # 16: #0B0A0F (shadow })
    # 17: #0D0D13 (shadow {)
    # 18: #F4F4FB (detail)
    # 19: black (main drop shadow)
    # 20-23: black (shadow slivers)

    # -------------------------------------------------------------
    # BUILD ASET 1: Horizontal SAKODE Work Logo (Pure Vector SVG)
    # -------------------------------------------------------------
    # SAKODE ends around x=2270, baseline is y=502, x-height is ~306px
    # Extract Nunito 900 glyphs for "w", "o", "r", "k"
    var_font = TTFont('Nunito-Variable.ttf')
    static_font = instantiateVariableFont(var_font, {'wght': 900})
    glyph_set = static_font.getGlyphSet()

    def get_glyph_path(char):
        gname = static_font.getBestCmap().get(ord(char))
        glyph = glyph_set[gname]
        pen = SVGPathPen(glyph_set)
        glyph.draw(pen)
        return pen.getCommands(), glyph.width

    w_d, w_w = get_glyph_path('w')
    o_d, o_w = get_glyph_path('o')
    r_d, r_w = get_glyph_path('r')
    k_d, k_w = get_glyph_path('k')

    scale = 0.58
    # Start position for "work" after SAKODE's closing brace (x=2270)
    # Gap of 80px -> start_x = 2360
    start_x = 2360
    base_y = 502

    # w: Sky Blue #54A5E4
    w_x = start_x
    # o: Coral Red #F94052
    o_x = w_x + w_w * scale + 30
    # r: Emerald Green #009670
    r_x = o_x + o_w * scale + 30
    # k: Magenta Pink #FF409F
    k_x = r_x + r_w * scale + 30
    total_work_width = (k_x + k_w * scale) - start_x

    # Calculate center of new 'o' to place the authentic smile
    new_o_center = o_x + (o_w * scale) / 2
    # In master sakode.svg, original smile is centered at 1331.3
    smile_dx = new_o_center - 1331.3
    # Shift original smile path (Path 9) by smile_dx
    orig_smile_path = paths[9]
    smile_shifted_d = re.sub(
        r'<path\s+fill-rule="evenodd"\s+clip-rule="evenodd"\s+d="([^"]+)"',
        lambda m: f'<g transform="translate({smile_dx}, 0)"><path fill-rule="evenodd" clip-rule="evenodd" d="{m.group(1)}"',
        orig_smile_path
    ) + '</g>'

    # Wordmark letters SVG
    work_letters_svg = f'''
    <!-- WORK Letterforms (Pure Cubic/Quadratic Bezier Glyphs) -->
    <!-- 'w' in Sky Blue #54A5E4 -->
    <g transform="translate({w_x}, {base_y}) scale({scale}, {-scale})">
      <path d="{w_d}" fill="#54A5E4" />
    </g>

    <!-- 'o' in Coral Red #F94052 -->
    <g transform="translate({o_x}, {base_y}) scale({scale}, {-scale})">
      <path d="{o_d}" fill="#F94052" />
    </g>
    <!-- Authentic Smile under 'o' shifted directly from SAKODE master vector -->
    {smile_shifted_d}

    <!-- 'r' in Emerald Green #009670 -->
    <g transform="translate({r_x}, {base_y}) scale({scale}, {-scale})">
      <path d="{r_d}" fill="#009670" />
    </g>

    <!-- 'k' in Magenta Pink #FF409F -->
    <g transform="translate({k_x}, {base_y}) scale({scale}, {-scale})">
      <path d="{k_d}" fill="#FF409F" />
    </g>
    '''

    # Build the matching die-cut cloud container for "work"
    # Container bounds:
    pad_x = 75
    pill_x = start_x - pad_x
    pill_y = 100
    pill_w = total_work_width + pad_x * 2 + 30
    pill_h = 475
    pill_rx = 110

    # Pop-art hard drop shadow offset matching SAKODE (+18, +24)
    work_shadow_svg = f'<rect x="{pill_x + 20}" y="{pill_y + 26}" width="{pill_w}" height="{pill_h}" rx="{pill_rx}" fill="black" />'
    work_white_svg = f'<rect x="{pill_x}" y="{pill_y}" width="{pill_w}" height="{pill_h}" rx="{pill_rx}" fill="white" />'

    # Assemble complete SAKODE Work Horizontal Logo
    # Total viewBox: width = pill_x + pill_w + 60, height = 660
    total_vb_w = int(pill_x + pill_w + 60)
    total_vb_h = 660

    # Reorder layers:
    # 1. Background Shadows (SAKODE shadow paths 19-23 + WORK shadow)
    # 2. White Borders (SAKODE white path 0 + WORK white pill)
    # 3. SAKODE colored letters & details (paths 1-8, 10-18)
    # 4. WORK colored letters & smile
    sakode_shadows = '\n'.join([paths[19], paths[20], paths[21], paths[22], paths[23]])
    sakode_white = paths[0]
    sakode_letters = '\n'.join([paths[1], paths[2], paths[3], paths[4], paths[5], paths[6], paths[7], paths[8], paths[10], paths[11], paths[12], paths[13], paths[14], paths[15], paths[16], paths[17], paths[18]])

    horizontal_logo_svg = f'''<svg width="{total_vb_w}" height="{total_vb_h}" viewBox="0 0 {total_vb_w} {total_vb_h}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <title>SAKODE Work Official Vector Logo</title>
  <desc>Master cubic bezier vector logo of SAKODE Work: sa&#123;kode&#125; work</desc>
  
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

  <!-- LAYER 3: SAKODE LETTERS & MASCOT -->
  <g id="sakode-brand">
{sakode_letters}
  </g>

  <!-- LAYER 4: WORK LETTERS & SMILE -->
  <g id="work-wordmark">
{work_letters_svg}
  </g>
</svg>'''

    out_logo_svg = os.path.join(public_dir, 'sakode-work-logo.svg')
    with open(out_logo_svg, 'w', encoding='utf-8') as f:
        f.write(horizontal_logo_svg)
    print(f"Generated master vector logo: {out_logo_svg} ({total_vb_w}x{total_vb_h})")

    # -------------------------------------------------------------
    # BUILD ASET 2: Bounty Quest Emblem (Pure Master Vector SVG)
    # -------------------------------------------------------------
    # We extract:
    # - Left brace {: Path 8 (line 10 in sakode.svg)
    # - Mascot body: Path 2 (line 4 in sakode.svg)
    # - Mascot head: Path 10 (line 12 in sakode.svg)
    # - Right brace }: Path 7 (line 9 in sakode.svg) shifted by dx = -843
    # Center of mascot is at x=1024, y=300
    # Let's create an 1100 x 1100 square canvas for the emblem
    # Target center in emblem: cx=550, cy=460
    # Current center in sakode: (1024, 305)
    # Scale = 0.85
    # Translation: tx = 550 - 1024*0.85 = 550 - 870.4 = -320.4
    #              ty = 430 - 305*0.85 = 430 - 259.25 = 170.75
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

    # Mathematical Hexagonal Shield Path with Rounded Corners
    # Center (550, 480), Radius R=420
    # Pure vector path with smooth rounded corners:
    # Hexagon points:
    hex_path = "M 550 60 L 890 256 A 40 40 0 0 1 910 290 L 910 680 A 40 40 0 0 1 890 714 L 550 910 A 40 40 0 0 1 530 910 L 190 714 A 40 40 0 0 1 170 680 L 170 290 A 40 40 0 0 1 190 256 L 530 60 A 40 40 0 0 1 550 60 Z"
    
    # Outer white border hexagon
    hex_white_path = "M 550 35 L 915 245 A 55 55 0 0 1 940 290 L 940 680 A 55 55 0 0 1 915 725 L 550 935 A 55 55 0 0 1 525 935 L 160 725 A 55 55 0 0 1 135 680 L 135 290 A 55 55 0 0 1 160 245 L 525 35 A 55 55 0 0 1 550 35 Z"
    # Shadow offset by +16, +24
    hex_shadow_path = "M 566 59 L 931 269 A 55 55 0 0 1 956 314 L 956 704 A 55 55 0 0 1 931 749 L 566 959 A 55 55 0 0 1 541 959 L 176 749 A 55 55 0 0 1 151 704 L 151 314 A 55 55 0 0 1 176 269 L 541 59 A 55 55 0 0 1 566 59 Z"

    # Golden Bounty Coins
    coin_l_x, coin_r_x = 265, 835
    coin_y = 450
    coin_r = 65

    coins_svg = f'''
    <!-- LEFT BOUNTY COIN -->
    <g id="coin-left">
      <!-- Coin Shadow -->
      <circle cx="{coin_l_x + 6}" cy="{coin_y + 8}" r="{coin_r}" fill="black" opacity="0.6" />
      <!-- Outer Rim (Gold) -->
      <circle cx="{coin_l_x}" cy="{coin_y}" r="{coin_r}" fill="#FFA800" stroke="#D97706" stroke-width="5" />
      <!-- Inner Face (Amber) -->
      <circle cx="{coin_l_x}" cy="{coin_y}" r="{coin_r - 9}" fill="#FBBF24" stroke="#F59E0B" stroke-width="2.5" />
      <!-- Embossed Code Brackets {{ }} -->
      <text x="{coin_l_x}" y="{coin_y + 16}" fill="#92400E" font-family="Nunito, sans-serif" font-weight="900" font-size="52" text-anchor="middle">&#123; &#125;</text>
    </g>

    <!-- RIGHT BOUNTY COIN -->
    <g id="coin-right">
      <!-- Coin Shadow -->
      <circle cx="{coin_r_x + 6}" cy="{coin_y + 8}" r="{coin_r}" fill="black" opacity="0.6" />
      <!-- Outer Rim (Gold) -->
      <circle cx="{coin_r_x}" cy="{coin_y}" r="{coin_r}" fill="#FFA800" stroke="#D97706" stroke-width="5" />
      <!-- Inner Face (Amber) -->
      <circle cx="{coin_r_x}" cy="{coin_y}" r="{coin_r - 9}" fill="#FBBF24" stroke="#F59E0B" stroke-width="2.5" />
      <!-- Embossed Code Brackets {{ }} -->
      <text x="{coin_r_x}" y="{coin_y + 16}" fill="#92400E" font-family="Nunito, sans-serif" font-weight="900" font-size="52" text-anchor="middle">&#123; &#125;</text>
    </g>
    '''

    # Quest Stars
    def make_star(x, y, s, col):
        return f'<polygon points="{x},{y-s} {x+s*0.28},{y-s*0.28} {x+s},{y} {x+s*0.28},{y+s*0.28} {x},{y+s} {x-s*0.28},{y+s*0.28} {x-s},{y} {x-s*0.28},{y-s*0.28}" fill="{col}" />'

    stars_svg = f'''
    {make_star(210, 310, 26, "#FFA800")}
    {make_star(890, 310, 26, "#FFA800")}
    {make_star(360, 180, 20, "#71CFFE")}
    {make_star(740, 180, 20, "#71CFFE")}
    '''

    # 3D Ribbon Plakat "WORK"
    plaque_y = 705
    plaque_w = 620
    plaque_h = 145
    plaque_rx = (1100 - plaque_w) // 2
    plaque_r = 38

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
      <!-- Wordmark "WORK" -->
      <text x="550" y="{plaque_y + 96}" fill="#0F172A" font-family="Nunito, sans-serif" font-weight="900" font-size="94" letter-spacing="3" text-anchor="middle">WORK</text>
      
      <!-- Sub-pill: "TASK & BOUNTY PLATFORM" -->
      <g transform="translate(370, {plaque_y + plaque_h + 16})">
        <rect x="2" y="3" width="360" height="42" rx="21" fill="black" opacity="0.5" />
        <rect x="0" y="0" width="360" height="42" rx="21" fill="#FFA800" stroke="white" stroke-width="2.5" />
        <text x="180" y="27" fill="#0F172A" font-family="Nunito, sans-serif" font-weight="900" font-size="19" letter-spacing="1" text-anchor="middle">TASK &amp; BOUNTY PLATFORM</text>
      </g>
    </g>
    '''

    emblem_svg = f'''<svg width="1100" height="1060" viewBox="0 0 1100 1060" fill="none" xmlns="http://www.w3.org/2000/svg">
  <title>SAKODE Work Quest Emblem</title>
  <desc>Master vector bounty quest emblem featuring official SAKODE developer mascot, golden bounty coins, and 3D WORK ribbon</desc>
  
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

  <!-- SAKODE Master Header Text -->
  <text x="550" y="215" fill="#71CFFE" font-family="Nunito, sans-serif" font-weight="900" font-size="46" letter-spacing="4" text-anchor="middle">SAKODE</text>

  <!-- LAYER 4: MASCOT & BRACES FROM SAKODE MASTER VECTOR -->
{emblem_mascot_svg}

  <!-- LAYER 5: BOUNTY COINS & STARS -->
{coins_svg}
{stars_svg}

  <!-- LAYER 6: 3D RIBBON "WORK" -->
{plaque_svg}
</svg>'''

    out_emblem_svg = os.path.join(public_dir, 'sakode-work-emblem.svg')
    with open(out_emblem_svg, 'w', encoding='utf-8') as f:
        f.write(emblem_svg)
    print(f"Generated master vector emblem: {out_emblem_svg} (1100x1060)")

    print("=== REFINED MASTER VECTORS BUILT SUCCESSFULLY ===")

if __name__ == '__main__':
    build_all()
