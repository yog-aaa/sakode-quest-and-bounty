import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

def create_showcase():
    print("=== BUILDING CONCEPTS SHOWCASE PRESENTATION CARD ===")
    base_dir = os.path.abspath('sakode-task-reward')
    concepts_dir = os.path.join(base_dir, 'public', 'concepts')
    
    W, H = 1920, 1600
    canvas = Image.new('RGBA', (W, H), (11, 15, 25, 255)) # Deep Midnight Slate
    draw = ImageDraw.Draw(canvas)

    # Ambient Glow
    # Top-Left Cyan Glow
    # Bottom-Right Emerald Glow

    # Header Section
    eyebrow_font = ImageFont.truetype('Nunito-Variable.ttf', 24)
    eyebrow_font.set_variation_by_axes([800])
    draw.rounded_rectangle([80, 60, 480, 105], radius=22, fill=(30, 41, 59, 255), outline=(51, 65, 85, 255), width=2)
    draw.text((280, 82), "SAKODE ACADEMY CREATIVE SUITE", fill=(113, 207, 254, 255), font=eyebrow_font, anchor="mm")

    title_font = ImageFont.truetype('Nunito-Variable.ttf', 56)
    title_font.set_variation_by_axes([900])
    draw.text((80, 125), "Eksplorasi Konsep Logo Independen: SAKODE Work", fill=(248, 250, 252, 255), font=title_font)

    desc_font = ImageFont.truetype('Nunito-Variable.ttf', 24)
    desc_font.set_variation_by_axes([600])
    draw.text((80, 195), "Silakan review dan tentukan arah visual resmi untuk platform work.sakode.com sebelum diimplementasikan ke sistem.", fill=(148, 163, 184, 255), font=desc_font)

    # Divider
    draw.line([80, 245, W - 80, 245], fill=(30, 41, 59, 255), width=2)

    # Load 3 Concepts
    c1 = Image.open(os.path.join(concepts_dir, 'concept-1-work-bubble.png')).convert('RGBA')
    c2 = Image.open(os.path.join(concepts_dir, 'concept-2-work-badge.png')).convert('RGBA')
    c3 = Image.open(os.path.join(concepts_dir, 'concept-3-work-lockup.png')).convert('RGBA')

    # Card 1: Horizontal Lockup (Top)
    # y = 270..650
    card1_y = 270
    draw.rounded_rectangle([80, card1_y, W - 80, card1_y + 380], radius=24, fill=(15, 23, 42, 255), outline=(30, 41, 59, 255), width=2)
    # Badge Pill
    draw.rounded_rectangle([110, card1_y + 25, 460, card1_y + 68], radius=20, fill=(0, 163, 224, 40), outline=(0, 163, 224, 255), width=2)
    badge_font = ImageFont.truetype('Nunito-Variable.ttf', 20)
    badge_font.set_variation_by_axes([800])
    draw.text((285, card1_y + 46), "KONSEP 1: BUBBLE POP-ART STICKER", fill=(113, 207, 254, 255), font=badge_font, anchor="mm")
    
    c1_title = ImageFont.truetype('Nunito-Variable.ttf', 28)
    c1_title.set_variation_by_axes([800])
    draw.text((485, card1_y + 46), "— Integrated Friendly Wordmark (Huruf Bubble & Senyum Khas)", fill=(241, 245, 249, 255), font=c1_title, anchor="lm")

    # Fit c1 image
    c1_target_h = 240
    c1_scale = c1_target_h / c1.height
    c1_resized = c1.resize((int(c1.width * c1_scale), c1_target_h), Image.Resampling.LANCZOS)
    canvas.paste(c1_resized, (120, card1_y + 105), c1_resized)

    # Card 2 & Card 3 Side by Side (Bottom)
    # y = 680..1520
    card_bot_y = 680
    col_w = (W - 160 - 40) // 2 # ~840px each

    # Column Left: Concept 2 (Bounty Quest Emblem)
    draw.rounded_rectangle([80, card_bot_y, 80 + col_w, card_bot_y + 840], radius=24, fill=(15, 23, 42, 255), outline=(30, 41, 59, 255), width=2)
    draw.rounded_rectangle([110, card_bot_y + 25, 480, card_bot_y + 68], radius=20, fill=(255, 168, 0, 40), outline=(255, 168, 0, 255), width=2)
    draw.text((295, card_bot_y + 46), "KONSEP 2: BOUNTY QUEST EMBLEM", fill=(251, 191, 36, 255), font=badge_font, anchor="mm")
    
    draw.text((110, card_bot_y + 90), "Gamified Developer Quest Badge", fill=(241, 245, 249, 255), font=c1_title)
    sub_desc = ImageFont.truetype('Nunito-Variable.ttf', 19)
    sub_desc.set_variation_by_axes([600])
    draw.text((110, card_bot_y + 130), "Maskot {k} selebrasi diapit koin bounty emas & plakat WORK 3D.", fill=(148, 163, 184, 255), font=sub_desc)

    # Fit c2 image
    c2_target_h = 600
    c2_scale = c2_target_h / c2.height
    c2_resized = c2.resize((int(c2.width * c2_scale), c2_target_h), Image.Resampling.LANCZOS)
    c2_x = 80 + (col_w - c2_resized.width) // 2
    canvas.paste(c2_resized, (c2_x, card_bot_y + 190), c2_resized)

    # Column Right: Concept 3 (Unified 3D Cyber Lockup)
    col3_x = 80 + col_w + 40
    draw.rounded_rectangle([col3_x, card_bot_y, col3_x + col_w, card_bot_y + 840], radius=24, fill=(15, 23, 42, 255), outline=(30, 41, 59, 255), width=2)
    draw.rounded_rectangle([col3_x + 30, card_bot_y + 25, col3_x + 430, card_bot_y + 68], radius=20, fill=(16, 185, 129, 40), outline=(16, 185, 129, 255), width=2)
    draw.text((col3_x + 230, card_bot_y + 46), "KONSEP 3: UNIFIED CYBER LOCKUP", fill=(52, 211, 153, 255), font=badge_font, anchor="mm")

    draw.text((col3_x + 30, card_bot_y + 90), "Dynamic 3D Pop-Art Sub-Brand Plate", fill=(241, 245, 249, 255), font=c1_title)
    draw.text((col3_x + 30, card_bot_y + 130), "Logo SAKODE dipadu plakat 3D Cyan beraksen terminal prompt >_.", fill=(148, 163, 184, 255), font=sub_desc)

    # Fit c3 image
    c3_target_w = col_w - 80
    c3_scale = c3_target_w / c3.width
    c3_resized = c3.resize((c3_target_w, int(c3.height * c3_scale)), Image.Resampling.LANCZOS)
    c3_y = card_bot_y + 300
    canvas.paste(c3_resized, (col3_x + 40, c3_y), c3_resized)

    # Save Showcase Image
    showcase_path = os.path.join(concepts_dir, 'concepts-showcase.png')
    canvas.save(showcase_path)
    print(f"Saved {showcase_path} ({canvas.size})")

if __name__ == '__main__':
    create_showcase()
