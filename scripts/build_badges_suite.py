import os

def generate_badges():
    print("=== BUILDING SAKODE HONORARY BADGES SUITE (9 SVGS) ===")
    base_dir = os.path.abspath('sakode-task-reward')
    badges_dir = os.path.join(base_dir, 'public', 'badges')
    os.makedirs(badges_dir, exist_ok=True)

    # Common Medallion Frame Function
    def make_frame(badge_id, accent_color, accent_tint, inner_icon, smile_accent="#EDAC1C"):
        return f'''<svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Radial Gradient -->
    <radialGradient id="bg-{badge_id}" cx="50%" cy="38%" r="65%">
      <stop offset="0%" stop-color="#1A2536" />
      <stop offset="65%" stop-color="#0E1624" />
      <stop offset="100%" stop-color="#070C14" />
    </radialGradient>

    <!-- Outer Rim Linear Gradient -->
    <linearGradient id="rim-{badge_id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{accent_tint}" />
      <stop offset="50%" stop-color="{accent_color}" />
      <stop offset="100%" stop-color="{accent_color}" stop-opacity="0.7" />
    </linearGradient>

    <!-- Subtle Drop Shadow -->
    <filter id="shadow-{badge_id}" x="-10%" y="-10%" width="120%" height="125%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.5" />
    </filter>
  </defs>

  <!-- LAYER 1: BASE MEDALLION (SQUIRCLE WITH DOUBLE BORDER) -->
  <g filter="url(#shadow-{badge_id})">
    <!-- Outer Medallion Body -->
    <rect x="10" y="8" width="108" height="108" rx="28" fill="url(#bg-{badge_id})" stroke="url(#rim-{badge_id})" stroke-width="2.5" />
    <!-- Inner Accent Border -->
    <rect x="15" y="13" width="98" height="98" rx="23" fill="none" stroke="white" stroke-opacity="0.1" stroke-width="1.2" />
  </g>

  <!-- Ambient Radar Arc -->
  <path d="M 32 30 A 48 48 0 0 1 96 30" stroke="{accent_color}" stroke-opacity="0.18" stroke-width="1.5" stroke-dasharray="3 3" />

  <!-- LAYER 2: ICONOGRAPHY (DISCIPLINE SPECIFIC) -->
  <g id="icon-{badge_id}">
{inner_icon}
  </g>

  <!-- LAYER 3: SAKODE SIGNATURE GOLD SMILE ARC -->
  <g id="smile-{badge_id}">
    <!-- Signature Smile Arc at bottom -->
    <path d="M 48 102 C 54 107.5 74 107.5 80 102" stroke="{smile_accent}" stroke-width="2.8" stroke-linecap="round" />
    <!-- Small Smile Dots -->
    <circle cx="48" cy="102" r="1.2" fill="{smile_accent}" />
    <circle cx="80" cy="102" r="1.2" fill="{smile_accent}" />
  </g>
</svg>'''

    # =========================================================================
    # 1. BADGE: Code Artisan (Clean architecture & zero defect code)
    # Accent: Cyan #71CFFE, Tint: #BAE6FD
    # Icon: Pure geometric curly braces { } flanking a sparkling faceted diamond
    # =========================================================================
    icon_code_artisan = '''    <!-- Left Curly Brace { -->
    <path d="M 38 42 C 33 42, 31 46, 31 52 C 31 57, 27 59, 23 59 C 27 59, 31 61, 31 66 C 31 72, 33 76, 38 76" stroke="#71CFFE" stroke-width="3" stroke-linecap="round" fill="none" />
    
    <!-- Right Curly Brace } -->
    <path d="M 90 42 C 95 42, 97 46, 97 52 C 97 57, 101 59, 105 59 C 101 59, 97 61, 97 66 C 97 72, 95 76, 90 76" stroke="#71CFFE" stroke-width="3" stroke-linecap="round" fill="none" />

    <!-- Central Artisan Gemstone / Diamond -->
    <g transform="translate(64, 59)">
      <!-- Diamond Top Table -->
      <polygon points="0,-22 14,-10 0,0 -14,-10" fill="#BAE6FD" />
      <!-- Diamond Bottom Facet -->
      <polygon points="-14,-10 0,0 0,20 -14,-10" fill="#71CFFE" />
      <polygon points="0,0 14,-10 0,20" fill="#38BDF8" />
      <!-- Top Center Sparkle -->
      <circle cx="0" cy="-22" r="2" fill="white" />
      <polygon points="18,-18 20,-24 22,-18 28,-16 22,-14 20,-8 18,-14 12,-16" fill="#EDAC1C" />
    </g>'''

    # =========================================================================
    # 2. BADGE: System Architect (Fullstack & DevOps integration mastery)
    # Accent: Cyan #71CFFE, Tint: #38BDF8
    # Icon: Layered 3D isometric infrastructure blocks with server nodes
    # =========================================================================
    icon_system_architect = '''    <g transform="translate(64, 57)">
      <!-- Top Layer (Cloud/Service Block) -->
      <polygon points="0,-22 22,-10 0,2 -22,-10" fill="#38BDF8" />
      <polygon points="-22,-10 0,2 0,7 -22,-5" fill="#0284C7" />
      <polygon points="0,2 22,-10 22,-5 0,7" fill="#0369A1" />

      <!-- Middle Layer (Container Block) -->
      <polygon points="0,-7 22,5 0,17 -22,5" fill="#71CFFE" />
      <polygon points="-22,5 0,17 0,22 -22,10" fill="#0284C7" />
      <polygon points="0,17 22,5 22,10 0,22" fill="#0369A1" />

      <!-- Interconnecting Server LED Nodes -->
      <circle cx="-14" cy="-3" r="2" fill="#00A86B" />
      <circle cx="0" cy="5" r="2" fill="#EDAC1C" />
      <circle cx="14" cy="-3" r="2" fill="#71CFFE" />

      <!-- DevOps Loop Accent -->
      <path d="M -26 -14 C -30 -6 -24 16 -10 18" stroke="#71CFFE" stroke-width="1.8" stroke-linecap="round" fill="none" stroke-dasharray="2 2" />
      <path d="M 26 -14 C 30 -6 24 16 10 18" stroke="#71CFFE" stroke-width="1.8" stroke-linecap="round" fill="none" stroke-dasharray="2 2" />
    </g>'''

    # =========================================================================
    # 3. BADGE: Bug Hunter (Security & edge-case discovery excellence)
    # Accent: Cyan #71CFFE, Tint: #00A3E0
    # Icon: Radar crosshairs locking onto a precision tech beetle
    # =========================================================================
    icon_bug_hunter = '''    <g transform="translate(64, 58)">
      <!-- Radar Crosshairs Circle -->
      <circle cx="0" cy="0" r="26" fill="none" stroke="#71CFFE" stroke-width="1.5" stroke-opacity="0.3" stroke-dasharray="4 3" />
      <line x1="-30" y1="0" x2="-20" y2="0" stroke="#71CFFE" stroke-width="2" stroke-linecap="round" />
      <line x1="20" y1="0" x2="30" y2="0" stroke="#71CFFE" stroke-width="2" stroke-linecap="round" />
      <line x1="0" y1="-30" x2="0" y2="-20" stroke="#71CFFE" stroke-width="2" stroke-linecap="round" />
      <line x1="0" y1="20" x2="0" y2="30" stroke="#71CFFE" stroke-width="2" stroke-linecap="round" />

      <!-- Cute Tech Bug / Beetle -->
      <!-- Antennae -->
      <path d="M -4 -8 C -7 -14 -12 -16 -15 -14" stroke="#71CFFE" stroke-width="1.8" stroke-linecap="round" fill="none" />
      <circle cx="-15" cy="-14" r="1.5" fill="#EDAC1C" />
      <path d="M 4 -8 C 7 -14 12 -16 15 -14" stroke="#71CFFE" stroke-width="1.8" stroke-linecap="round" fill="none" />
      <circle cx="15" cy="-14" r="1.5" fill="#EDAC1C" />

      <!-- Bug Legs (6 legs) -->
      <path d="M -10 -4 L -18 -7 M -12 2 L -20 2 M -10 8 L -18 13" stroke="#71CFFE" stroke-width="1.8" stroke-linecap="round" />
      <path d="M 10 -4 L 18 -7 M 12 2 L 20 2 M 10 8 L 18 13" stroke="#71CFFE" stroke-width="1.8" stroke-linecap="round" />

      <!-- Bug Head -->
      <circle cx="0" cy="-6" r="6" fill="#0284C7" />
      <!-- Bug Eyes -->
      <circle cx="-2.5" cy="-7" r="1.2" fill="#BAE6FD" />
      <circle cx="2.5" cy="-7" r="1.2" fill="#BAE6FD" />

      <!-- Bug Shell Body -->
      <path d="M -9 -1 C -9 12 9 12 9 -1 Z" fill="#71CFFE" />
      <line x1="0" y1="0" x2="0" y2="10" stroke="#0F172A" stroke-width="1.5" />
      <!-- Security Check Shield on Back -->
      <path d="M -4 3 L 0 1 L 4 3 L 4 6 C 4 8 0 10 0 10 C 0 10 -4 8 -4 6 Z" fill="#EDAC1C" />
    </g>'''

    # =========================================================================
    # 4. BADGE: Curriculum Pioneer (Authoring comprehensive labs & syllabus)
    # Accent: Purple #BC71FE, Tint: #E9D5FF
    # Icon: Open curriculum book with rising knowledge beacon / quill
    # =========================================================================
    icon_curriculum_pioneer = '''    <g transform="translate(64, 58)">
      <!-- Open Curriculum Book Pages -->
      <!-- Left Page -->
      <path d="M 0 14 C -10 10 -22 10 -30 14 L -30 -12 C -22 -16 -10 -16 0 -12 Z" fill="#A855F7" stroke="#E9D5FF" stroke-width="1.5" />
      <line x1="-24" y1="-5" x2="-6" y2="-5" stroke="white" stroke-opacity="0.4" stroke-width="1.5" stroke-linecap="round" />
      <line x1="-24" y1="0" x2="-6" y2="0" stroke="white" stroke-opacity="0.4" stroke-width="1.5" stroke-linecap="round" />
      <line x1="-24" y1="5" x2="-12" y2="5" stroke="white" stroke-opacity="0.4" stroke-width="1.5" stroke-linecap="round" />

      <!-- Right Page -->
      <path d="M 0 14 C 10 10 22 10 30 14 L 30 -12 C 22 -16 10 -16 0 -12 Z" fill="#BC71FE" stroke="#E9D5FF" stroke-width="1.5" />
      <line x1="6" y1="-5" x2="24" y2="-5" stroke="white" stroke-opacity="0.4" stroke-width="1.5" stroke-linecap="round" />
      <line x1="6" y1="0" x2="24" y2="0" stroke="white" stroke-opacity="0.4" stroke-width="1.5" stroke-linecap="round" />
      <line x1="6" y1="5" x2="18" y2="5" stroke="white" stroke-opacity="0.4" stroke-width="1.5" stroke-linecap="round" />

      <!-- Book Spine -->
      <line x1="0" y1="-12" x2="0" y2="15" stroke="#7E22CE" stroke-width="2" />

      <!-- Rising Compass / Knowledge Star -->
      <g transform="translate(0, -22)">
        <polygon points="0,-12 3,-3 12,0 3,3 0,12 -3,3 -12,0 -3,-3" fill="#EDAC1C" />
        <circle cx="0" cy="0" r="2.5" fill="white" />
      </g>
    </g>'''

    # =========================================================================
    # 5. BADGE: Knowledge Mentor (Top-tier pedagogy & code review guidance)
    # Accent: Purple #BC71FE, Tint: #D8B4FE
    # Icon: Mentoring dialogue balloons with code checkmark & wisdom beacon
    # =========================================================================
    icon_knowledge_mentor = '''    <g transform="translate(64, 57)">
      <!-- Mentor Dialogue Balloon (Purple, Left) -->
      <path d="M -6 -18 C 12 -18 18 -10 18 -1 C 18 8 10 14 -4 14 L -12 20 L -10 13 C -18 12 -22 6 -22 -1 C -22 -10 -15 -18 -6 -18 Z" fill="#BC71FE" />
      <!-- Code Brackets inside mentor balloon < / > -->
      <path d="M -13 -3 L -17 -1 L -13 1" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <path d="M 0 -3 L 4 -1 L 0 1" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <line x1="-8" y1="3" x2="-5" y2="-5" stroke="#EDAC1C" stroke-width="1.6" stroke-linecap="round" />

      <!-- Guidance Beacon / Sparkle (Top Right) -->
      <polygon points="20,-16 22,-21 24,-16 29,-14 24,-12 22,-7 20,-12 15,-14" fill="#EDAC1C" />

      <!-- Mentee Review Checkmark Bubble (Cyan, Right) -->
      <circle cx="16" cy="10" r="10" fill="#71CFFE" stroke="#0F172A" stroke-width="2" />
      <path d="M 12 10 L 15 13 L 21 7" stroke="#0F172A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    </g>'''

    # =========================================================================
    # 6. BADGE: Community Champion (Leading national tech events & outreach)
    # Accent: Coral #F9723B, Tint: #FED7AA
    # Icon: Energetic community bullhorn/megaphone with broadcast signal hearts
    # =========================================================================
    icon_community_champion = '''    <g transform="translate(62, 57)">
      <!-- Megaphone Body -->
      <path d="M -16 -4 L -4 -9 L 14 -18 L 14 18 L -4 9 L -16 4 Z" fill="#F9723B" stroke="#FED7AA" stroke-width="1.5" />
      <!-- Megaphone Cap -->
      <ellipse cx="14" cy="0" rx="4" ry="18" fill="#FB923C" stroke="#FED7AA" stroke-width="1.5" />
      <!-- Megaphone Handle -->
      <path d="M -8 8 L -10 20 L -3 20 L -4 9" fill="#C2410C" />
      <!-- Megaphone Mouthpiece -->
      <rect x="-20" y="-4" width="4" height="8" rx="1.5" fill="#EDAC1C" />

      <!-- Broadcast Soundwaves (Pop-art Unity Waves) -->
      <path d="M 22 -12 C 26 -6 26 6 22 12" stroke="#EDAC1C" stroke-width="2.2" stroke-linecap="round" fill="none" />
      <path d="M 28 -18 C 34 -8 34 8 28 18" stroke="#71CFFE" stroke-width="2" stroke-linecap="round" fill="none" />

      <!-- Community Star / Heart Accent -->
      <polygon points="34,-1 36,-6 38,-1 43,1 38,3 36,8 34,3 29,1" fill="#EDAC1C" />
    </g>'''

    # =========================================================================
    # 7. BADGE: Creative Storyteller (High-impact visual carousels & copy)
    # Accent: Coral #F9723B, Tint: #FFEDD5
    # Icon: Designer stylus / quill drawing a dynamic curved storytelling arc
    # =========================================================================
    icon_creative_storyteller = '''    <g transform="translate(64, 57)">
      <!-- Creative Stylus / Nib Pen (Angled) -->
      <g transform="rotate(-35)">
        <rect x="-4" y="-24" width="8" height="28" rx="2" fill="#F9723B" stroke="#FED7AA" stroke-width="1.5" />
        <polygon points="-4,4 4,4 0,14" fill="#EDAC1C" />
        <circle cx="0" cy="5" r="1.2" fill="#0F172A" />
      </g>

      <!-- Dynamic Swooshing Story Wave -->
      <path d="M -24 16 C -12 24 14 20 24 4 C 30 -6 16 -18 6 -16 C -6 -14 -4 0 8 4" stroke="#71CFFE" stroke-width="2.5" stroke-linecap="round" fill="none" />

      <!-- Floating Visual Carousel Card Accents -->
      <rect x="10" y="-22" width="14" height="10" rx="2" fill="#FB923C" stroke="white" stroke-width="1" transform="rotate(15 17 -17)" />
      <polygon points="-18,-12 -16,-16 -14,-12 -10,-10 -14,-8 -16,-4 -18,-8 -22,-10" fill="#EDAC1C" />
    </g>'''

    # =========================================================================
    # 8. BADGE: First Mission (First validated task accepted into SAKODE)
    # Accent: Emerald #00A86B, Tint: #A7F3D0
    # Icon: SAKODE developer mascot jumping with joy (\o/) with victory laurel
    # =========================================================================
    icon_first_blood = '''    <g transform="translate(64, 56)">
      <!-- SAKODE Mascot Developer Jumping in Victory -->
      <!-- Mascot Head (Cyan Circle) -->
      <circle cx="0" cy="-18" r="7" fill="#71CFFE" stroke="#0284C7" stroke-width="1.2" />

      <!-- Mascot Body (Emerald Green, Arms Raised \o/) -->
      <path d="M -16 -12 C -18 -8 -13 0 -6 2 L -7 16 C -7 19 -3 19 -3 16 L -1 7 L 1 7 L 3 16 C 3 19 7 19 7 16 L 6 2 C 13 0 18 -8 16 -12 C 14 -15 10 -9 6 -3 C 5 -1 -5 -1 -6 -3 C -10 -9 -14 -15 -16 -12 Z" fill="#00A86B" />

      <!-- Victory Milestone Flag / Laurel Base -->
      <path d="M -22 18 C -14 23 14 23 22 18" stroke="#EDAC1C" stroke-width="2.5" stroke-linecap="round" fill="none" />
      <polygon points="-22,18 -20,13 -24,14" fill="#EDAC1C" />
      <polygon points="22,18 20,13 24,14" fill="#EDAC1C" />
      <circle cx="0" cy="21" r="2.5" fill="#EDAC1C" />

      <!-- Sparkle of Achievement -->
      <polygon points="18,-18 20,-22 22,-18 26,-16 22,-14 20,-10 18,-14 14,-16" fill="#EDAC1C" />
    </g>'''

    # =========================================================================
    # 9. BADGE: Rapid Delivery (Fast turnaround under 24h with pristine QA)
    # Accent: Gold #EDAC1C, Tint: #FEF08A
    # Icon: High-speed stopwatch dial fused with a dynamic lightning bolt
    # =========================================================================
    icon_speed_demon = '''    <g transform="translate(64, 57)">
      <!-- Stopwatch Rim & Button -->
      <rect x="-3" y="-28" width="6" height="5" rx="1.5" fill="#EDAC1C" />
      <circle cx="0" cy="0" r="24" fill="none" stroke="#EDAC1C" stroke-width="2.5" stroke-dasharray="8 3" />
      <circle cx="0" cy="0" r="19" fill="#1E293B" fill-opacity="0.6" stroke="white" stroke-opacity="0.1" stroke-width="1" />

      <!-- Dial Hour Markers -->
      <circle cx="0" cy="-14" r="1.5" fill="#FEF08A" />
      <circle cx="14" cy="0" r="1.5" fill="#FEF08A" />
      <circle cx="0" cy="14" r="1.5" fill="#FEF08A" />
      <circle cx="-14" cy="0" r="1.5" fill="#FEF08A" />

      <!-- Dynamic Lightning Bolt (Slicing through center) -->
      <polygon points="3,-20 -10,0 -1,0 -6,18 12,-4 3,-4" fill="#EDAC1C" stroke="#FEF08A" stroke-width="1.2" />

      <!-- Speed Wind Trails -->
      <line x1="-28" y1="-8" x2="-20" y2="-8" stroke="#71CFFE" stroke-width="1.5" stroke-linecap="round" />
      <line x1="-30" y1="2" x2="-22" y2="2" stroke="#71CFFE" stroke-width="2" stroke-linecap="round" />
      <line x1="-26" y1="12" x2="-18" y2="12" stroke="#71CFFE" stroke-width="1.5" stroke-linecap="round" />
    </g>'''

    # =========================================================================
    # 10. BADGE: Golden Ledger / Precision Craft (5 consecutive deliverables zero defect)
    # Accent: Gold #EDAC1C, Tint: #FEF08A
    # Icon: Golden Ledger Book / Certificate with double checkmark seal & 5 constellation stars
    # =========================================================================
    icon_golden_ledger = '''    <g transform="translate(64, 57)">
      <!-- Golden Document / Ledger Base -->
      <rect x="-18" y="-22" width="36" height="42" rx="4" fill="#1E293B" stroke="#EDAC1C" stroke-width="2" />
      <rect x="-14" y="-18" width="28" height="34" rx="2" fill="#0E1624" stroke="white" stroke-opacity="0.1" stroke-width="1" />
      
      <!-- Ledger Header Ribbon & Rows -->
      <line x1="-10" y1="-12" x2="10" y2="-12" stroke="#FEF08A" stroke-width="2" stroke-linecap="round" />
      <line x1="-10" y1="-6" x2="6" y2="-6" stroke="#EDAC1C" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.7" />
      <line x1="-10" y1="-1" x2="8" y2="-1" stroke="#EDAC1C" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.7" />
      <line x1="-10" y1="4" x2="4" y2="4" stroke="#EDAC1C" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.7" />

      <!-- Golden Seal of Approval (Circular Rosette with checkmark) -->
      <g transform="translate(6, 10)">
        <circle cx="0" cy="0" r="11" fill="#EDAC1C" stroke="#FEF08A" stroke-width="1.5" />
        <!-- Inner checkmark -->
        <path d="M -5 -0.5 L -2 2.5 L 5 -4" fill="none" stroke="#0B0F19" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
      </g>

      <!-- 5 Golden Micro Stars (Symbolizing 5 Perfect Streak Deliverables) -->
      <g transform="translate(0, -28)">
        <polygon points="-16,-2 -15,-4 -14,-2 -12,-2 -13.5,-0.5 -13,1.5 -15,0 -17,1.5 -16.5,-0.5 -18,-2" fill="#FEF08A" />
        <polygon points="-8,-4 -7,-6 -6,-4 -4,-4 -5.5,-2.5 -5,-0.5 -7,-2 -9,-0.5 -8.5,-2.5 -10,-4" fill="#FEF08A" />
        <polygon points="0,-6 1,-8 2,-6 4,-6 2.5,-4.5 3,-2.5 1,-4 -1,-2.5 -0.5,-4.5 -2,-6" fill="#EDAC1C" />
        <polygon points="8,-4 9,-6 10,-4 12,-4 10.5,-2.5 11,-0.5 9,-2 7,-0.5 7.5,-2.5 6,-4" fill="#FEF08A" />
        <polygon points="16,-2 17,-4 18,-2 20,-2 18.5,-0.5 19,1.5 17,0 15,1.5 15.5,-0.5 14,-2" fill="#FEF08A" />
      </g>
    </g>'''

    # Catalog of all Badges
    badges = [
        ("badge-code-artisan.svg", "code-artisan", "#71CFFE", "#BAE6FD", icon_code_artisan),
        ("badge-system-architect.svg", "system-architect", "#71CFFE", "#38BDF8", icon_system_architect),
        ("badge-bug-hunter.svg", "bug-hunter", "#71CFFE", "#00A3E0", icon_bug_hunter),
        ("badge-curriculum-pioneer.svg", "curriculum-pioneer", "#BC71FE", "#E9D5FF", icon_curriculum_pioneer),
        ("badge-knowledge-mentor.svg", "knowledge-mentor", "#BC71FE", "#D8B4FE", icon_knowledge_mentor),
        ("badge-community-champion.svg", "community-champion", "#F9723B", "#FED7AA", icon_community_champion),
        ("badge-creative-storyteller.svg", "creative-storyteller", "#F9723B", "#FFEDD5", icon_creative_storyteller),
        ("badge-first-blood.svg", "first-blood", "#00A86B", "#A7F3D0", icon_first_blood),
        ("badge-speed-demon.svg", "speed-demon", "#EDAC1C", "#FEF08A", icon_speed_demon),
        ("badge-golden-ledger.svg", "golden-ledger", "#EDAC1C", "#FEF08A", icon_golden_ledger),
    ]

    for filename, badge_id, accent, tint, icon_svg in badges:
        svg_content = make_frame(badge_id, accent, tint, icon_svg)
        out_path = os.path.join(badges_dir, filename)
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(svg_content)
        print(f"Generated: {filename} (128x128 pure vector SVG)")

    print("=== ALL 10 HONORARY BADGES GENERATED SUCCESSFULLY ===")

if __name__ == '__main__':
    generate_badges()
