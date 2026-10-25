import os
import shutil
from PIL import Image

def apply_brand():
    print("=== APPLYING USER-APPROVED BRAND COMBINATION (CONCEPT 1 + 2) ===")
    base_dir = os.path.abspath('sakode-task-reward')
    public_dir = os.path.join(base_dir, 'public')
    concepts_dir = os.path.join(public_dir, 'concepts')

    c1_png = os.path.join(concepts_dir, 'concept-1-work-bubble.png')
    c1_svg = os.path.join(concepts_dir, 'concept-1-work-bubble.svg')
    c2_png = os.path.join(concepts_dir, 'concept-2-work-badge.png')
    c2_svg = os.path.join(concepts_dir, 'concept-2-work-badge.svg')

    # 1. Primary Horizontal Web Logo (Konsep 1)
    shutil.copy2(c1_png, os.path.join(public_dir, 'sakode-work-logo.png'))
    shutil.copy2(c1_svg, os.path.join(public_dir, 'sakode-work-logo.svg'))
    print("Copied Concept 1 as sakode-work-logo.png and sakode-work-logo.svg")

    # 2. Primary Emblem / Badge (Konsep 2)
    shutil.copy2(c2_png, os.path.join(public_dir, 'sakode-work-emblem.png'))
    shutil.copy2(c2_svg, os.path.join(public_dir, 'sakode-work-emblem.svg'))
    print("Copied Concept 2 as sakode-work-emblem.png and sakode-work-emblem.svg")

    # 3. Generate icon.png (512 x 512) from Concept 2 Bounty Emblem
    im_c2 = Image.open(c2_png).convert('RGBA')
    # Fit into 512x512 with 24px padding
    target_size = 464
    w, h = im_c2.size
    scale = target_size / max(w, h)
    new_w = int(w * scale)
    new_h = int(h * scale)
    im_c2_resized = im_c2.resize((new_w, new_h), Image.Resampling.LANCZOS)

    icon_canvas = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
    paste_x = (512 - new_w) // 2
    paste_y = (512 - new_h) // 2
    icon_canvas.paste(im_c2_resized, (paste_x, paste_y), im_c2_resized)
    icon_path = os.path.join(public_dir, 'icon.png')
    icon_canvas.save(icon_path)
    print(f"Generated {icon_path} (512x512)")

    # 4. Generate apple-icon.png (180 x 180 solid background) from Concept 2
    apple_target = 156
    scale_apple = apple_target / max(w, h)
    aw = int(w * scale_apple)
    ah = int(h * scale_apple)
    im_apple_resized = im_c2.resize((aw, ah), Image.Resampling.LANCZOS)

    apple_canvas = Image.new('RGBA', (180, 180), (15, 23, 42, 255)) # Solid Slate #0F172A
    # Subtle inner circle
    from PIL import ImageDraw
    adraw = ImageDraw.Draw(apple_canvas)
    adraw.ellipse([6, 6, 174, 174], outline=(113, 207, 254, 50), width=2)
    apaste_x = (180 - aw) // 2
    apaste_y = (180 - ah) // 2
    apple_canvas.paste(im_apple_resized, (apaste_x, apaste_y), im_apple_resized)
    apple_path = os.path.join(public_dir, 'apple-icon.png')
    apple_canvas.save(apple_path)
    print(f"Generated {apple_path} (180x180 solid)")

    # 5. Generate favicon.ico (16, 32, 48) from icon_canvas
    ico_path = os.path.join(public_dir, 'favicon.ico')
    icon_canvas.save(ico_path, format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])
    print(f"Generated multi-resolution {ico_path} (16, 32, 48)")

    # 6. Generate Updated opengraph-image.png (1200 x 630)
    og_canvas = Image.new('RGBA', (1200, 630), (11, 15, 25, 255)) # Midnight Slate
    og_draw = ImageDraw.Draw(og_canvas)

    # Ambient Glows
    # Top border cyan accent
    og_draw.rectangle([0, 0, 1200, 6], fill=(113, 207, 254, 255))

    # Eyebrow pill
    og_draw.rounded_rectangle([70, 70, 320, 106], radius=18, fill=(30, 41, 59, 255), outline=(51, 65, 85, 255), width=1)
    from PIL import ImageFont
    f_eyebrow = ImageFont.truetype('Nunito-Variable.ttf', 13)
    f_eyebrow.set_variation_by_axes([800])
    og_draw.ellipse([86, 84, 94, 92], fill=(16, 185, 129, 255))
    og_draw.text((106, 88), "SAKODE WORK PLATFORM", fill=(148, 163, 184, 255), font=f_eyebrow)

    # Paste Concept 1 Horizontal Wordmark (scaled to height ~120px)
    im_c1 = Image.open(c1_png).convert('RGBA')
    c1_h = 130
    c1_scale = c1_h / im_c1.height
    c1_w = int(im_c1.width * c1_scale)
    im_c1_resized = im_c1.resize((c1_w, c1_h), Image.Resampling.LANCZOS)
    og_canvas.paste(im_c1_resized, (70, 125), im_c1_resized)

    # Main Headline & Subtitle
    f_head = ImageFont.truetype('Nunito-Variable.ttf', 40)
    f_head.set_variation_by_axes([900])
    og_draw.text((70, 275), "Platform Task IT & Bounty Reward", fill=(248, 250, 252, 255), font=f_head)

    f_sub = ImageFont.truetype('Nunito-Variable.ttf', 20)
    f_sub.set_variation_by_axes([600])
    og_draw.text((70, 325), "Kerjakan proyek nyata, bentuk tim kolaborasi terstruktur, dan", fill=(148, 163, 184, 255), font=f_sub)
    og_draw.text((70, 355), "cairkan reward honorarium secara transparan & profesional.", fill=(148, 163, 184, 255), font=f_sub)

    # Feature Badges
    f_badge = ImageFont.truetype('Nunito-Variable.ttf', 14)
    f_badge.set_variation_by_axes([700])
    # 1
    og_draw.rounded_rectangle([70, 410, 245, 458], radius=12, fill=(30, 41, 59, 255), outline=(51, 65, 85, 255), width=1)
    og_draw.text((88, 424), "🎯  Verified Tasks", fill=(226, 232, 240, 255), font=f_badge)
    # 2
    og_draw.rounded_rectangle([260, 410, 445, 458], radius=12, fill=(30, 41, 59, 255), outline=(51, 65, 85, 255), width=1)
    og_draw.text((278, 424), "👥  Fair Team Split", fill=(226, 232, 240, 255), font=f_badge)
    # 3
    og_draw.rounded_rectangle([460, 410, 650, 458], radius=12, fill=(30, 41, 59, 255), outline=(51, 65, 85, 255), width=1)
    og_draw.text((478, 424), "💰  Instant Bounty", fill=(226, 232, 240, 255), font=f_badge)

    # URL Pill
    f_url = ImageFont.truetype('Nunito-Variable.ttf', 16)
    f_url.set_variation_by_axes([800])
    og_draw.rounded_rectangle([70, 500, 280, 542], radius=21, fill=(113, 207, 254, 255))
    og_draw.text((95, 511), "work.sakode.com →", fill=(15, 23, 42, 255), font=f_url)
    og_draw.text((305, 513), "by SAKODE Academy", fill=(100, 116, 139, 255), font=f_badge)

    # Right Side: Large Concept 2 Bounty Emblem Hero
    emblem_target_h = 490
    emblem_scale = emblem_target_h / im_c2.height
    emblem_w = int(im_c2.width * emblem_scale)
    im_emblem_resized = im_c2.resize((emblem_w, emblem_target_h), Image.Resampling.LANCZOS)
    og_canvas.paste(im_emblem_resized, (700, 70), im_emblem_resized)

    og_path = os.path.join(public_dir, 'opengraph-image.png')
    og_canvas.save(og_path)
    print(f"Generated {og_path} (1200x630)")

    # 7. Generate Updated email-header.png (600 x 160)
    email_canvas = Image.new('RGBA', (600, 160), (255, 255, 255, 255))
    edraw = ImageDraw.Draw(email_canvas)
    # Top accent bar
    edraw.rectangle([0, 0, 600, 4], fill=(113, 207, 254, 255))
    edraw.rectangle([0, 158, 600, 160], fill=(241, 245, 249, 255))

    # Paste Concept 1 logo scaled to height ~72px
    email_h = 72
    email_scale = email_h / im_c1.height
    ew = int(im_c1.width * email_scale)
    im_email_logo = im_c1.resize((ew, email_h), Image.Resampling.LANCZOS)
    email_canvas.paste(im_email_logo, (30, 44), im_email_logo)

    # Right side: official notification badge
    edraw.rounded_rectangle([425, 54, 570, 82], radius=14, fill=(224, 242, 254, 255))
    f_notif = ImageFont.truetype('Nunito-Variable.ttf', 11)
    f_notif.set_variation_by_axes([800])
    edraw.text((440, 61), "NOTIFIKASI RESMI", fill=(3, 105, 161, 255), font=f_notif)
    f_sub_email = ImageFont.truetype('Nunito-Variable.ttf', 11)
    f_sub_email.set_variation_by_axes([600])
    edraw.text((435, 92), "work.sakode.com", fill=(100, 116, 139, 255), font=f_sub_email)

    email_path = os.path.join(public_dir, 'email-header.png')
    email_canvas.save(email_path)
    print(f"Generated {email_path} (600x160)")

    print("=== ALL BRAND ASSETS APPLIED SUCCESSFULLY ===")

if __name__ == '__main__':
    apply_brand()
