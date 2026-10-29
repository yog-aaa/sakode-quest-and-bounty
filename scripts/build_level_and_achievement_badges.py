import os

def generate_badges():
    print("=== BUILDING SAKODE LEVEL & COMPREHENSIVE ACHIEVEMENT BADGES ===")
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    badges_dir = os.path.join(base_dir, 'public', 'badges')
    os.makedirs(badges_dir, exist_ok=True)

    # Base Medallion Frame Generator
    def make_frame(badge_id, accent_color, accent_tint, inner_icon, smile_accent="#EDAC1C", level_tag=None):
        tag_svg = ""
        if level_tag:
            tag_svg = f'''  <!-- Level Ribbon Tag -->
  <g transform="translate(64, 25)">
    <rect x="-24" y="-8" width="48" height="15" rx="7.5" fill="{accent_color}" />
    <text x="0" y="3" font-family="system-ui, -apple-system, sans-serif" font-size="9" font-weight="900" fill="#070C14" text-anchor="middle" letter-spacing="0.5">{level_tag}</text>
  </g>'''

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
    <rect x="10" y="8" width="108" height="108" rx="28" fill="url(#bg-{badge_id})" stroke="url(#rim-{badge_id})" stroke-width="2.5" />
    <rect x="15" y="13" width="98" height="98" rx="23" fill="none" stroke="white" stroke-opacity="0.1" stroke-width="1.2" />
  </g>

  <!-- Ambient Radar Arc -->
  <path d="M 32 30 A 48 48 0 0 1 96 30" stroke="{accent_color}" stroke-opacity="0.18" stroke-width="1.5" stroke-dasharray="3 3" />

{tag_svg}

  <!-- LAYER 2: ICONOGRAPHY -->
  <g id="icon-{badge_id}">
{inner_icon}
  </g>

  <!-- LAYER 3: SAKODE SIGNATURE GOLD SMILE ARC -->
  <g id="smile-{badge_id}">
    <path d="M 48 102 C 54 107.5 74 107.5 80 102" stroke="{smile_accent}" stroke-width="2.8" stroke-linecap="round" />
    <circle cx="48" cy="102" r="1.2" fill="{smile_accent}" />
    <circle cx="80" cy="102" r="1.2" fill="{smile_accent}" />
  </g>
</svg>'''

    # =========================================================================
    # LEVEL BADGES (5 LEVELS)
    # =========================================================================

    # 1. Level 1: Onboarded Contributor (Entry / Novice)
    # Slate/Bronze with Compass & Launch Paper Plane
    icon_lvl_1 = '''    <!-- Compass Ring & Paper Plane -->
    <g transform="translate(64, 63)">
      <circle cx="0" cy="0" r="22" stroke="#94A3B8" stroke-width="2" stroke-dasharray="2 4" fill="none" />
      <circle cx="0" cy="0" r="3" fill="#EDAC1C" />
      <!-- Paper Plane Launcher -->
      <polygon points="0,-16 14,14 0,8 -14,14" fill="#CBD5E1" stroke="#94A3B8" stroke-width="1.5" stroke-linejoin="round" />
      <polygon points="0,-16 14,14 0,8" fill="#94A3B8" />
      <line x1="0" y1="-16" x2="0" y2="8" stroke="#475569" stroke-width="1.2" />
    </g>'''

    # 2. Level 2: Active Contributor (Intermediate)
    # Cyan SAKODE with Double Chevron & Code Spark
    icon_lvl_2 = '''    <!-- Double Fast Upward Chevrons & Code Node -->
    <g transform="translate(64, 62)">
      <!-- Lower Chevron -->
      <path d="M -18 10 L 0 -4 L 18 10" stroke="#0284C7" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <!-- Upper Chevron -->
      <path d="M -18 -2 L 0 -16 L 18 -2" stroke="#71CFFE" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <!-- Central Glowing Energy Node -->
      <circle cx="0" cy="3" r="5" fill="#BAE6FD" />
      <circle cx="0" cy="3" r="2" fill="#0369A1" />
      <!-- Side Sparks -->
      <circle cx="-25" cy="-2" r="1.8" fill="#71CFFE" />
      <circle cx="25" cy="-2" r="1.8" fill="#71CFFE" />
    </g>'''

    # 3. Level 3: Senior Specialist (Advanced)
    # Royal Purple with Faceted Hexagonal Gemstone & Orbiting Quantum Satellites
    icon_lvl_3 = '''    <!-- 3D Hexagonal Faceted Crystal Core -->
    <g transform="translate(64, 62)">
      <!-- Outer Orbit Ring -->
      <ellipse cx="0" cy="0" rx="27" ry="11" stroke="#BC71FE" stroke-opacity="0.4" stroke-width="1.5" transform="rotate(-20)" fill="none" />
      <circle cx="-24" cy="8" r="2.5" fill="#71CFFE" />
      <circle cx="24" cy="-8" r="2.5" fill="#EDAC1C" />
      
      <!-- Faceted Hex Crystal -->
      <polygon points="0,-20 17,-10 17,10 0,20 -17,10 -17,-10" fill="#7E22CE" stroke="#BC71FE" stroke-width="2" />
      <!-- Top Facet Table -->
      <polygon points="0,-20 17,-10 0,0 -17,-10" fill="#E9D5FF" />
      <!-- Left Facet -->
      <polygon points="-17,-10 0,0 0,20 -17,10" fill="#9333EA" />
      <!-- Right Facet -->
      <polygon points="17,-10 0,0 0,20 17,10" fill="#BC71FE" />
      <!-- Core Gleam -->
      <polygon points="0,-6 2,-1 7,0 2,1 0,6 -2,1 -7,0 -2,-1" fill="white" />
    </g>'''

    # 4. Level 4: Lead Fellow (Party Leader)
    # Solar Amber with Laurel Wreath & Pinnacle Fortress Crown
    icon_lvl_4 = '''    <!-- Laurel Wreath & Fortress Shield Crown -->
    <g transform="translate(64, 61)">
      <!-- Left Laurel Branch -->
      <path d="M -8 18 C -22 14, -28 -2, -22 -14" stroke="#EDAC1C" stroke-width="2.2" stroke-linecap="round" fill="none" />
      <circle cx="-23" cy="-11" r="2.5" fill="#FEF08A" />
      <circle cx="-27" cy="-2" r="2.5" fill="#EDAC1C" />
      <circle cx="-23" cy="8" r="2.5" fill="#B45309" />

      <!-- Right Laurel Branch -->
      <path d="M 8 18 C 22 14, 28 -2, 22 -14" stroke="#EDAC1C" stroke-width="2.2" stroke-linecap="round" fill="none" />
      <circle cx="23" cy="-11" r="2.5" fill="#FEF08A" />
      <circle cx="27" cy="-2" r="2.5" fill="#EDAC1C" />
      <circle cx="23" cy="8" r="2.5" fill="#B45309" />

      <!-- Central Fortress Shield -->
      <path d="M -14 -12 L 0 -20 L 14 -12 L 14 5 C 14 14, 0 19, 0 19 C 0 19, -14 14, -14 5 Z" fill="#F59E0B" stroke="#FEF08A" stroke-width="1.8" />
      <!-- Shield Core Star -->
      <polygon points="0,-6 3,1 10,2 5,6 7,13 0,9 -7,13 -5,6 -10,2 -3,1" fill="#FEF08A" />
      <circle cx="0" cy="4" r="2" fill="#78350F" />
    </g>'''

    # 5. Level 5: Grandmaster Fellow (Apex Legend)
    # Prismatic Imperial Crown with Radiant Wings & Floating Diamond
    icon_lvl_5 = '''    <!-- Grand Apex Imperial Crown & Radiant Wings -->
    <g transform="translate(64, 60)">
      <!-- Aura Glow Radiance -->
      <circle cx="0" cy="-2" r="26" fill="#F59E0B" fill-opacity="0.15" />

      <!-- Left Radiant Wing -->
      <path d="M -8 12 C -24 8, -32 -4, -30 -16 C -20 -10, -14 -6, -8 0" fill="#0284C7" stroke="#71CFFE" stroke-width="1.5" />
      <!-- Right Radiant Wing -->
      <path d="M 8 12 C 24 8, 32 -4, 30 -16 C 20 -10, 14 -6, 8 0" fill="#0284C7" stroke="#71CFFE" stroke-width="1.5" />

      <!-- Imperial Apex Crown Base -->
      <path d="M -18 8 L -14 -8 L -6 0 L 0 -18 L 6 0 L 14 -8 L 18 8 Z" fill="#F59E0B" stroke="#FEF08A" stroke-width="2" stroke-linejoin="round" />
      <!-- Crown Jewels -->
      <circle cx="-14" cy="-8" r="2.5" fill="#71CFFE" />
      <circle cx="0" cy="-18" r="3.2" fill="#FEF08A" />
      <circle cx="14" cy="-8" r="2.5" fill="#71CFFE" />

      <!-- Floating Apex Diamond above Crown -->
      <polygon points="0,-28 6,-22 0,-16 -6,-22" fill="#FEF08A" stroke="#F59E0B" stroke-width="1" />
      <circle cx="0" cy="-22" r="1.5" fill="#78350F" />

      <!-- Lower Crest Bar -->
      <rect x="-16" y="8" width="32" height="5" rx="2.5" fill="#B45309" stroke="#FEF08A" stroke-width="1" />
      <circle cx="-8" cy="10.5" r="1.2" fill="#FEF08A" />
      <circle cx="0" cy="10.5" r="1.2" fill="#71CFFE" />
      <circle cx="8" cy="10.5" r="1.2" fill="#FEF08A" />
    </g>'''

    level_badges = [
        ('badge-level-1.svg', 'lvl1', '#94A3B8', '#CBD5E1', icon_lvl_1, '#94A3B8', 'LVL 1'),
        ('badge-level-2.svg', 'lvl2', '#71CFFE', '#BAE6FD', icon_lvl_2, '#71CFFE', 'LVL 2'),
        ('badge-level-3.svg', 'lvl3', '#BC71FE', '#E9D5FF', icon_lvl_3, '#BC71FE', 'LVL 3'),
        ('badge-level-4.svg', 'lvl4', '#EDAC1C', '#FEF08A', icon_lvl_4, '#EDAC1C', 'LVL 4'),
        ('badge-level-5.svg', 'lvl5', '#F59E0B', '#FEF08A', icon_lvl_5, '#EDAC1C', 'LVL 5'),
    ]

    for fname, bid, acc, tint, icon, smile, tag in level_badges:
        path = os.path.join(badges_dir, fname)
        svg_content = make_frame(bid, acc, tint, icon, smile, tag)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(svg_content)
        print(f"Generated Level Badge: {fname}")

    # =========================================================================
    # REMAINING 14 ACHIEVEMENT BADGES (24 MATRIX COMPLETION)
    # =========================================================================

    # --- PILAR 1: TEKNOLOGI & IT ---
    # 1. First Commit
    icon_first_commit = '''    <!-- Git Branch Node & First Commit Marker -->
    <g transform="translate(64, 58)">
      <line x1="-12" y1="-20" x2="-12" y2="20" stroke="#71CFFE" stroke-width="3" stroke-linecap="round" />
      <path d="M -12 0 C 4 0, 14 -10, 14 -18" stroke="#38BDF8" stroke-width="3" fill="none" stroke-linecap="round" />
      <!-- Commit Nodes -->
      <circle cx="-12" cy="-18" r="5" fill="#BAE6FD" stroke="#0369A1" stroke-width="2" />
      <circle cx="-12" cy="14" r="5" fill="#71CFFE" stroke="#0369A1" stroke-width="2" />
      <circle cx="14" cy="-18" r="6" fill="#EDAC1C" stroke="#78350F" stroke-width="2" />
      <polygon points="14,-22 17,-18 14,-14 11,-18" fill="white" />
    </g>'''

    # 2. DevOps Runner
    icon_devops = '''    <!-- Infinity Loop Pipeline with Deployment Arrow -->
    <g transform="translate(64, 58)">
      <!-- Left Loop -->
      <path d="M 0 0 C -12 -16, -28 -16, -28 0 C -28 16, -12 16, 0 0 C 12 -16, 28 -16, 28 0 C 28 16, 12 16, 0 0" stroke="#38BDF8" stroke-width="3.5" stroke-linecap="round" fill="none" />
      <circle cx="-18" cy="0" r="4" fill="#00A86B" />
      <circle cx="18" cy="0" r="4" fill="#71CFFE" />
      <polygon points="0,-6 6,0 0,6" fill="#EDAC1C" />
    </g>'''

    # 3. Sistem Integrator
    icon_integrator = '''    <!-- Multi-Cloud Database & Microservices Nexus -->
    <g transform="translate(64, 58)">
      <!-- Central Hub Cylinder -->
      <ellipse cx="0" cy="-12" rx="14" ry="5" fill="#38BDF8" />
      <path d="M -14 -12 L -14 0 C -14 3, 0 5, 0 5 C 0 5, 14 3, 14 0 L 14 -12 Z" fill="#0284C7" />
      <path d="M -14 0 L -14 12 C -14 15, 0 17, 0 17 C 0 17, 14 15, 14 12 L 14 0 Z" fill="#0369A1" />
      <!-- Connected Bus Nodes -->
      <circle cx="-24" cy="-8" r="4" fill="#71CFFE" />
      <line x1="-20" y1="-8" x2="-14" y2="-8" stroke="#71CFFE" stroke-width="2" />
      <circle cx="24" cy="-8" r="4" fill="#BC71FE" />
      <line x1="20" y1="-8" x2="14" y2="-8" stroke="#BC71FE" stroke-width="2" />
      <circle cx="0" cy="24" r="3.5" fill="#EDAC1C" />
      <line x1="0" y1="17" x2="0" y2="21" stroke="#EDAC1C" stroke-width="2" />
    </g>'''

    # 4. Titan of Code
    icon_titan = '''    <!-- Giant Monolith Fortress with Golden Diamond Braces -->
    <g transform="translate(64, 58)">
      <!-- Monolith Pillar -->
      <rect x="-16" y="-22" width="32" height="44" rx="4" fill="#0F172A" stroke="#71CFFE" stroke-width="2.5" />
      <line x1="-10" y1="-14" x2="10" y2="-14" stroke="#38BDF8" stroke-width="2" stroke-linecap="round" />
      <line x1="-10" y1="-7" x2="4" y2="-7" stroke="#38BDF8" stroke-width="2" stroke-linecap="round" />
      <line x1="-10" y1="0" x2="8" y2="0" stroke="#38BDF8" stroke-width="2" stroke-linecap="round" />
      <!-- Golden Titan Crest -->
      <polygon points="0,-28 14,-22 0,-16 -14,-22" fill="#EDAC1C" stroke="#FEF08A" stroke-width="1.5" />
      <circle cx="0" cy="12" r="3" fill="#00A86B" />
    </g>'''

    # --- PILAR 2: MODUL & EDUKASI ---
    # 5. Penulis Catatan
    icon_note_writer = '''    <!-- Open Manual / Cheatsheet with Fountain Pen -->
    <g transform="translate(64, 58)">
      <path d="M -22 -14 L -4 -16 L -4 16 L -22 14 Z" fill="#9333EA" stroke="#BC71FE" stroke-width="1.8" />
      <path d="M 22 -14 L 4 -16 L 4 16 L 22 14 Z" fill="#A855F7" stroke="#BC71FE" stroke-width="1.8" />
      <!-- Golden Quill Pen -->
      <path d="M 6 -24 L 18 -12 L 0 6 L -6 6 L -6 0 Z" fill="#EDAC1C" stroke="#FEF08A" stroke-width="1.2" />
      <circle cx="-5" cy="5" r="1.5" fill="#78350F" />
    </g>'''

    # 6. Pembuat Kuis
    icon_quiz_creator = '''    <!-- Question Mark Spark & Checkmarks Shield -->
    <g transform="translate(64, 58)">
      <circle cx="0" cy="0" r="22" stroke="#BC71FE" stroke-width="2" fill="#581C87" fill-opacity="0.3" />
      <!-- Question Mark Node -->
      <path d="M -7 -10 C -7 -16, 7 -16, 7 -10 C 7 -4, 0 -3, 0 3" stroke="#E9D5FF" stroke-width="3" stroke-linecap="round" fill="none" />
      <circle cx="0" cy="10" r="2" fill="#EDAC1C" />
      <!-- Small Sparkle Stars -->
      <polygon points="16,-12 18,-15 20,-12 23,-10 20,-8 18,-5 16,-8 13,-10" fill="#EDAC1C" />
    </g>'''

    # 7. Master Kurator
    icon_master_curator = '''    <!-- Golden Compass & Triple Curated Scrolls -->
    <g transform="translate(64, 58)">
      <!-- Triple Scroll Shelf -->
      <rect x="-18" y="-14" width="36" height="7" rx="3.5" fill="#BC71FE" stroke="#E9D5FF" stroke-width="1.5" />
      <rect x="-14" y="-4" width="28" height="7" rx="3.5" fill="#9333EA" stroke="#E9D5FF" stroke-width="1.5" />
      <rect x="-18" y="6" width="36" height="7" rx="3.5" fill="#7E22CE" stroke="#E9D5FF" stroke-width="1.5" />
      <!-- Curatorial Seal -->
      <circle cx="0" cy="18" r="5" fill="#EDAC1C" />
      <circle cx="0" cy="18" r="2" fill="#78350F" />
    </g>'''

    # 8. Begawan Edukasi
    icon_education_sage = '''    <!-- Luminescent Temple / Torch of Wisdom -->
    <g transform="translate(64, 58)">
      <!-- Torch Flame -->
      <path d="M 0 -24 C -10 -14, -6 -6, 0 0 C 6 -6, 10 -14, 0 -24 Z" fill="#F59E0B" />
      <path d="M 0 -18 C -5 -12, -3 -7, 0 -3 C 3 -7, 5 -12, 0 -18 Z" fill="#FEF08A" />
      <!-- Torch Base -->
      <polygon points="-8,0 8,0 4,20 -4,20" fill="#9333EA" stroke="#BC71FE" stroke-width="1.8" />
      <!-- Radiant Rays -->
      <line x1="-16" y1="-14" x2="-22" y2="-18" stroke="#EDAC1C" stroke-width="2" stroke-linecap="round" />
      <line x1="16" y1="-14" x2="22" y2="-18" stroke="#EDAC1C" stroke-width="2" stroke-linecap="round" />
    </g>'''

    # --- PILAR 3: MARKETING & KOMUNITAS ---
    # 9. Penyebar Kabar
    icon_word_spreader = '''    <!-- Megaphone Broadcast Waves -->
    <g transform="translate(64, 58)">
      <!-- Megaphone Horn -->
      <polygon points="-16,-4 -4,-4 8,-14 8,14 -4,4 -16,4" fill="#EDAC1C" stroke="#FEF08A" stroke-width="1.5" />
      <rect x="-18" y="-4" width="4" height="8" rx="2" fill="#B45309" />
      <!-- Sound Broadcast Waves -->
      <path d="M 14 -10 C 18 -6, 18 6, 14 10" stroke="#FEF08A" stroke-width="2.2" stroke-linecap="round" fill="none" />
      <path d="M 20 -15 C 26 -8, 26 8, 20 15" stroke="#EDAC1C" stroke-width="2.2" stroke-linecap="round" fill="none" />
    </g>'''

    # 10. Event Coordinator
    icon_event_coord = '''    <!-- Calendar Stage with Spotlight Star -->
    <g transform="translate(64, 58)">
      <rect x="-18" y="-14" width="36" height="32" rx="6" fill="#1E293B" stroke="#EDAC1C" stroke-width="2" />
      <rect x="-18" y="-14" width="36" height="10" rx="4" fill="#F59E0B" />
      <!-- Hanging Rings -->
      <line x1="-10" y1="-18" x2="-10" y2="-12" stroke="#FEF08A" stroke-width="2.5" stroke-linecap="round" />
      <line x1="10" y1="-18" x2="10" y2="-12" stroke="#FEF08A" stroke-width="2.5" stroke-linecap="round" />
      <!-- Calendar Stage Star -->
      <polygon points="0,0 3,6 10,7 5,12 6,18 0,15 -6,18 -5,12 -10,7 -3,6" fill="#EDAC1C" />
    </g>'''

    # 11. Grand Evangelist
    icon_grand_evangelist = '''    <!-- Triple Connected People Nodes & Globe Beacon -->
    <g transform="translate(64, 58)">
      <!-- Globe Arc -->
      <ellipse cx="0" cy="6" rx="26" ry="12" stroke="#EDAC1C" stroke-opacity="0.4" stroke-width="1.8" fill="none" />
      <!-- Center Leader -->
      <circle cx="0" cy="-12" r="6" fill="#FEF08A" stroke="#B45309" stroke-width="1.5" />
      <path d="M -9 4 C -9 -3, 9 -3, 9 4 Z" fill="#F59E0B" />
      <!-- Left Follower -->
      <circle cx="-18" cy="-4" r="4.5" fill="#EDAC1C" />
      <path d="M -24 9 C -24 4, -12 4, -12 9 Z" fill="#B45309" />
      <!-- Right Follower -->
      <circle cx="18" cy="-4" r="4.5" fill="#EDAC1C" />
      <path d="M 12 9 C 12 4, 24 4, 24 9 Z" fill="#B45309" />
    </g>'''

    # 12. Duta Kehormatan
    icon_honor_ambassador = '''    <!-- Golden Diplomatic Ribbon & Grand Seal -->
    <g transform="translate(64, 58)">
      <!-- Twin Ribbon Tails -->
      <polygon points="-12,10 -18,26 -6,22 0,26" fill="#B45309" />
      <polygon points="12,10 18,26 6,22 0,26" fill="#92400E" />
      <!-- Medallion Center Seal -->
      <circle cx="0" cy="0" r="18" fill="#F59E0B" stroke="#FEF08A" stroke-width="2.5" />
      <polygon points="0,-12 4,-3 13,-2 6,5 8,14 0,9 -8,14 -6,5 -13,-2 -4,-3" fill="#FEF08A" />
      <circle cx="0" cy="2" r="2.5" fill="#78350F" />
    </g>'''

    # --- PILAR 4: MILESTONES & PLATFORM PRESTIGE ---
    # 13. Pilar Konsensus
    icon_consensus = '''    <!-- Symmetrical Balance Scales with Handshake Core -->
    <g transform="translate(64, 58)">
      <line x1="0" y1="-20" x2="0" y2="18" stroke="#00A86B" stroke-width="3" stroke-linecap="round" />
      <!-- Scale Beam -->
      <line x1="-22" y1="-12" x2="22" y2="-12" stroke="#34D399" stroke-width="2.5" stroke-linecap="round" />
      <!-- Left Pan -->
      <path d="M -28 4 L -16 4 L -22 14 Z" fill="#00A86B" />
      <line x1="-22" y1="-12" x2="-22" y2="4" stroke="#6EE7B7" stroke-width="1.5" />
      <!-- Right Pan -->
      <path d="M 16 4 L 28 4 L 22 14 Z" fill="#00A86B" />
      <line x1="22" y1="-12" x2="22" y2="4" stroke="#6EE7B7" stroke-width="1.5" />
      <!-- Consensus 100% Core -->
      <circle cx="0" cy="-12" r="5" fill="#EDAC1C" />
    </g>'''

    # 14. Pengawal Deadline
    icon_deadline_guard = '''    <!-- Stopwatch Clock surrounded by Protective Shield -->
    <g transform="translate(64, 58)">
      <!-- Clock Face -->
      <circle cx="0" cy="0" r="18" fill="#1E293B" stroke="#F9723B" stroke-width="2.5" />
      <!-- Clock Hands pointing to WIB on-time -->
      <line x1="0" y1="0" x2="0" y2="-10" stroke="#FDBA74" stroke-width="2.2" stroke-linecap="round" />
      <line x1="0" y1="0" x2="7" y2="4" stroke="#F9723B" stroke-width="2.2" stroke-linecap="round" />
      <circle cx="0" cy="0" r="3" fill="#EDAC1C" />
      <!-- Stopwatch Top Plunger -->
      <rect x="-3" y="-23" width="6" height="5" rx="1.5" fill="#F9723B" />
      <!-- Zero-Cron Safe Check -->
      <circle cx="16" cy="-12" r="4.5" fill="#00A86B" />
      <polyline points="14,-12 16,-10 19,-14" stroke="white" stroke-width="1.5" stroke-linecap="round" fill="none" />
    </g>'''

    # 15. Pelindung Ekosistem
    icon_ecosystem_guard = '''    <!-- Invariant Vault & Immutable Append-Only Chain -->
    <g transform="translate(64, 58)">
      <!-- Central Cryptographic Vault -->
      <rect x="-16" y="-12" width="32" height="26" rx="6" fill="#065F46" stroke="#34D399" stroke-width="2" />
      <circle cx="0" cy="0" r="5" fill="#FEF08A" />
      <circle cx="0" cy="0" r="2.5" fill="#064E3B" />
      <line x1="0" y1="5" x2="0" y2="9" stroke="#FEF08A" stroke-width="2" />
      <!-- Vault Shackle -->
      <path d="M -9 -12 L -9 -18 C -9 -24, 9 -24, 9 -18 L 9 -12" stroke="#34D399" stroke-width="3" stroke-linecap="round" fill="none" />
      <!-- Side Security Nodes -->
      <circle cx="-22" cy="0" r="3" fill="#00A86B" />
      <circle cx="22" cy="0" r="3" fill="#00A86B" />
    </g>'''

    achievements = [
        ('badge-first-commit.svg', 'first-commit', '#71CFFE', '#BAE6FD', icon_first_commit, '#EDAC1C'),
        ('badge-devops-runner.svg', 'devops-runner', '#38BDF8', '#BAE6FD', icon_devops, '#EDAC1C'),
        ('badge-system-integrator.svg', 'system-integrator', '#71CFFE', '#BAE6FD', icon_integrator, '#EDAC1C'),
        ('badge-titan-of-code.svg', 'titan-of-code', '#EDAC1C', '#FEF08A', icon_titan, '#EDAC1C'),
        ('badge-note-writer.svg', 'note-writer', '#BC71FE', '#E9D5FF', icon_note_writer, '#EDAC1C'),
        ('badge-quiz-creator.svg', 'quiz-creator', '#BC71FE', '#E9D5FF', icon_quiz_creator, '#EDAC1C'),
        ('badge-master-curator.svg', 'master-curator', '#BC71FE', '#E9D5FF', icon_master_curator, '#EDAC1C'),
        ('badge-education-sage.svg', 'education-sage', '#EDAC1C', '#FEF08A', icon_education_sage, '#EDAC1C'),
        ('badge-word-spreader.svg', 'word-spreader', '#EDAC1C', '#FEF08A', icon_word_spreader, '#EDAC1C'),
        ('badge-event-coordinator.svg', 'event-coordinator', '#EDAC1C', '#FEF08A', icon_event_coord, '#EDAC1C'),
        ('badge-grand-evangelist.svg', 'grand-evangelist', '#EDAC1C', '#FEF08A', icon_grand_evangelist, '#EDAC1C'),
        ('badge-honor-ambassador.svg', 'honor-ambassador', '#EDAC1C', '#FEF08A', icon_honor_ambassador, '#EDAC1C'),
        ('badge-consensus-pillar.svg', 'consensus-pillar', '#00A86B', '#A7F3D0', icon_consensus, '#EDAC1C'),
        ('badge-deadline-guardian.svg', 'deadline-guardian', '#F9723B', '#FDBA74', icon_deadline_guard, '#EDAC1C'),
        ('badge-ecosystem-guardian.svg', 'ecosystem-guardian', '#00A86B', '#A7F3D0', icon_ecosystem_guard, '#EDAC1C'),
    ]

    for fname, bid, acc, tint, icon, smile in achievements:
        path = os.path.join(badges_dir, fname)
        svg_content = make_frame(bid, acc, tint, icon, smile)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(svg_content)
        print(f"Generated Achievement Badge: {fname}")

    print("=== ALL BADGES SUCCESSFULLY GENERATED ===")

if __name__ == '__main__':
    generate_badges()
