import os
from PIL import Image, ImageDraw, ImageFont

def build_showcase():
    print("=== BUILDING MASTER VECTOR REFINEMENT SHOWCASE BOARD ===")
    base_dir = os.path.abspath('sakode-task-reward')
    public_dir = os.path.join(base_dir, 'public')
    concepts_dir = os.path.join(public_dir, 'concepts')
    os.makedirs(concepts_dir, exist_ok=True)

    W, H = 1920, 1400
    canvas = Image.new('RGBA', (W, H), (11, 15, 25, 255)) # Midnight Slate
    draw = ImageDraw.Draw(canvas)

    # Ambient Top Line
    draw.rectangle([0, 0, W, 6], fill=(113, 207, 254, 255))

    # Header Section
    f_pill = ImageFont.truetype('Nunito-Variable.ttf', 16)
    f_pill.set_variation_by_axes([800])
    draw.rounded_rectangle([70, 50, 480, 88], radius=19, fill=(30, 41, 59, 255), outline=(51, 65, 85, 255), width=1)
    draw.ellipse([88, 64, 98, 74], fill=(16, 185, 129, 255))
    draw.text((112, 59), "OFFICIAL MASTER VECTOR REFINEMENT", fill=(113, 207, 254, 255), font=f_pill)

    f_title = ImageFont.truetype('Nunito-Variable.ttf', 44)
    f_title.set_variation_by_axes([900])
    draw.text((70, 105), "Penyempurnaan Logo & Ikon SAKODE Work (Master Vector SVG)", fill=(248, 250, 252, 255), font=f_title)

    f_desc = ImageFont.truetype('Nunito-Variable.ttf', 20)
    f_desc.set_variation_by_axes([600])
    draw.text((70, 165), "Seluruh kurva diekstrak langsung dari master sakode.svg resmi dengan presisi matematis kubik bezier (0% raster tracing).", fill=(148, 163, 184, 255), font=f_desc)

    draw.line([70, 215, W - 70, 215], fill=(30, 41, 59, 255), width=2)

    # -------------------------------------------------------------
    # CARD 1: Horizontal Web Logo (Top Card)
    # -------------------------------------------------------------
    c1_y = 240
    c1_h = 400
    draw.rounded_rectangle([70, c1_y, W - 70, c1_y + c1_h], radius=24, fill=(15, 23, 42, 255), outline=(30, 41, 59, 255), width=2)

    f_card_title = ImageFont.truetype('Nunito-Variable.ttf', 24)
    f_card_title.set_variation_by_axes([800])
    draw.text((105, c1_y + 30), "1. Logo Horizontal Web (sakode-work-logo.svg / .png)", fill=(241, 245, 249, 255), font=f_card_title)

    f_badge = ImageFont.truetype('Nunito-Variable.ttf', 13)
    f_badge.set_variation_by_axes([800])
    draw.rounded_rectangle([W - 380, c1_y + 24, W - 105, c1_y + 60], radius=18, fill=(16, 185, 129, 30), outline=(16, 185, 129, 200), width=1)
    draw.text((W - 360, c1_y + 32), "✓ 100% PURE CUBIC BEZIER", fill=(52, 211, 153, 255), font=f_badge)

    # Paste Logo
    logo_im = Image.open(os.path.join(public_dir, 'sakode-work-logo.png')).convert('RGBA')
    target_logo_h = 240
    logo_scale = target_logo_h / logo_im.height
    lw = int(logo_im.width * logo_scale)
    logo_resized = logo_im.resize((lw, target_logo_h), Image.Resampling.LANCZOS)
    canvas.paste(logo_resized, (105, c1_y + 90), logo_resized)

    # Annotations below logo
    f_ann = ImageFont.truetype('Nunito-Variable.ttf', 15)
    f_ann.set_variation_by_axes([600])
    draw.text((105, c1_y + c1_h - 40), "• Tepi awan putih & bayangan hitam mulus tanpa gerigi (smooth curves)  • Huruf 'work' proporsional  • Senyuman 'o' identik master SVG", fill=(148, 163, 184, 255), font=f_ann)

    # -------------------------------------------------------------
    # CARD 2: Bounty Quest Emblem (Bottom Left)
    # -------------------------------------------------------------
    c2_y = 670
    c2_w = (W - 140 - 40) // 2 # 850px
    c2_h = 660
    draw.rounded_rectangle([70, c2_y, 70 + c2_w, c2_y + c2_h], radius=24, fill=(15, 23, 42, 255), outline=(30, 41, 59, 255), width=2)

    draw.text((105, c2_y + 30), "2. Bounty Quest Emblem (sakode-work-emblem.svg)", fill=(241, 245, 249, 255), font=f_card_title)
    draw.rounded_rectangle([70 + c2_w - 230, c2_y + 24, 70 + c2_w - 35, c2_y + 60], radius=18, fill=(255, 168, 0, 30), outline=(255, 168, 0, 200), width=1)
    draw.text((70 + c2_w - 215, c2_y + 32), "✓ SYMMETRICAL SHIELD", fill=(251, 191, 36, 255), font=f_badge)

    # Paste Emblem
    emblem_im = Image.open(os.path.join(public_dir, 'sakode-work-emblem.png')).convert('RGBA')
    target_emblem_h = 490
    emblem_scale = target_emblem_h / emblem_im.height
    ew = int(emblem_im.width * emblem_scale)
    emblem_resized = emblem_im.resize((ew, target_emblem_h), Image.Resampling.LANCZOS)
    canvas.paste(emblem_resized, (70 + (c2_w - ew)//2, c2_y + 90), emblem_resized)

    draw.text((105, c2_y + c2_h - 45), "• Maskot & kurung kurawal { } resmi  • Koin bounty emas  • Plakat pita 3D WORK", fill=(148, 163, 184, 255), font=f_ann)

    # -------------------------------------------------------------
    # CARD 3: Digital App Icon Suite (Bottom Right)
    # -------------------------------------------------------------
    c3_x = 70 + c2_w + 40
    draw.rounded_rectangle([c3_x, c2_y, c3_x + c2_w, c2_y + c2_h], radius=24, fill=(15, 23, 42, 255), outline=(30, 41, 59, 255), width=2)

    draw.text((c3_x + 35, c2_y + 30), "3. Digital App Icon Suite (PWA & iOS)", fill=(241, 245, 249, 255), font=f_card_title)
    draw.rounded_rectangle([c3_x + c2_w - 220, c2_y + 24, c3_x + c2_w - 35, c2_y + 60], radius=18, fill=(113, 207, 254, 30), outline=(113, 207, 254, 200), width=1)
    draw.text((c3_x + c2_w - 205, c2_y + 32), "✓ SUBPIXEL SHARP", fill=(113, 207, 254, 255), font=f_badge)

    # Display icon.png (512x512 rendered at 240px)
    icon_im = Image.open(os.path.join(public_dir, 'icon.png')).convert('RGBA')
    icon_preview = icon_im.resize((240, 240), Image.Resampling.LANCZOS)
    canvas.paste(icon_preview, (c3_x + 90, c2_y + 110), icon_preview)

    draw.text((c3_x + 130, c2_y + 370), "icon.png (512x512)", fill=(241, 245, 249, 255), font=f_badge)
    draw.text((c3_x + 110, c2_y + 395), "PWA & Android Launcher", fill=(148, 163, 184, 255), font=f_ann)

    # Display apple-icon.png (180x180)
    apple_im = Image.open(os.path.join(public_dir, 'apple-icon.png')).convert('RGBA')
    apple_preview = apple_im.resize((180, 180), Image.Resampling.LANCZOS)
    canvas.paste(apple_preview, (c3_x + 480, c2_y + 140), apple_preview)

    draw.text((c3_x + 500, c2_y + 370), "apple-icon.png (180x180)", fill=(241, 245, 249, 255), font=f_badge)
    draw.text((c3_x + 500, c2_y + 395), "iOS Solid Canvas", fill=(148, 163, 184, 255), font=f_ann)

    # Display multi-res Favicon info box
    draw.rounded_rectangle([c3_x + 60, c2_y + 450, c3_x + c2_w - 60, c2_y + 600], radius=16, fill=(30, 41, 59, 255), outline=(51, 65, 85, 255), width=1)
    f_fav_title = ImageFont.truetype('Nunito-Variable.ttf', 18)
    f_fav_title.set_variation_by_axes([800])
    draw.text((c3_x + 90, c2_y + 475), "favicon.ico (Multi-Resolution Bundle: 16x16, 32x32, 48x48)", fill=(113, 207, 254, 255), font=f_fav_title)
    draw.text((c3_x + 90, c2_y + 515), "• True ICO format (bukan PNG yang di-rename)", fill=(226, 232, 240, 255), font=f_ann)
    draw.text((c3_x + 90, c2_y + 545), "• Di-render langsung dari master vektor dengan subpixel antialiasing", fill=(148, 163, 184, 255), font=f_ann)

    out_showcase = os.path.join(concepts_dir, 'refinement-showcase.png')
    canvas.save(out_showcase)
    print(f"Generated {out_showcase} ({W}x{H})")

    # Copy to artifact directory
    artifact_dir = 'C:/Users/yogaa/.gemini/antigravity/brain/51755b30-e706-4a5e-9da1-ce1000f53ba4'
    import shutil
    shutil.copy2(out_showcase, os.path.join(artifact_dir, 'refinement-showcase.png'))
    shutil.copy2(os.path.join(public_dir, 'sakode-work-logo.png'), os.path.join(artifact_dir, 'sakode-work-logo-refined.png'))
    shutil.copy2(os.path.join(public_dir, 'sakode-work-emblem.png'), os.path.join(artifact_dir, 'sakode-work-emblem-refined.png'))
    print("Copied refinement files to artifact directory!")

if __name__ == '__main__':
    build_showcase()
