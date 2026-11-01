const fs = require('fs');
const path = require('path');
const { Resvg } = require('../node_modules/@resvg/resvg-js');

const publicDir = path.resolve(__dirname, '..', 'public');
const badgesDir = path.join(publicDir, 'badges');

const badges = [
  { file: 'badge-code-artisan.svg', title: 'Code Artisan', desc: 'Clean architecture & zero defect code', discipline: 'Technology • IT', accent: '#71CFFE' },
  { file: 'badge-system-architect.svg', title: 'System Architect', desc: 'Fullstack & DevOps integration mastery', discipline: 'Technology • IT', accent: '#71CFFE' },
  { file: 'badge-bug-hunter.svg', title: 'Bug Hunter', desc: 'Security & edge-case discovery excellence', discipline: 'Technology • IT', accent: '#71CFFE' },
  { file: 'badge-curriculum-pioneer.svg', title: 'Curriculum Pioneer', desc: 'Authoring comprehensive labs & syllabus', discipline: 'Education • Modul', accent: '#BC71FE' },
  { file: 'badge-knowledge-mentor.svg', title: 'Knowledge Mentor', desc: 'Top-tier pedagogy & code review guidance', discipline: 'Education • Mentoring', accent: '#BC71FE' },
  { file: 'badge-community-champion.svg', title: 'Community Champion', desc: 'Leading national tech events & outreach', discipline: 'Community • Outreach', accent: '#F9723B' },
  { file: 'badge-creative-storyteller.svg', title: 'Creative Storyteller', desc: 'High-impact visual carousels & copy', discipline: 'Creative • Marketing', accent: '#F9723B' },
  { file: 'badge-first-blood.svg', title: 'First Mission', desc: 'First validated task accepted into SAKODE', discipline: 'Induction • Milestone', accent: '#00A86B' },
  { file: 'badge-speed-demon.svg', title: 'Rapid Delivery', desc: 'Fast turnaround under 24h with pristine QA', discipline: 'Speed • Execution', accent: '#EDAC1C' },
  { file: 'badge-golden-ledger.svg', title: 'Golden Ledger', desc: '5 consecutive streak zero defect deliverables', discipline: 'Quality • Milestone', accent: '#EDAC1C' },
];

console.log('Testing individual badge SVG renders...');
badges.forEach(b => {
  const svgPath = path.join(badgesDir, b.file);
  const svg = fs.readFileSync(svgPath, 'utf8');
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 256 } });
  const png = resvg.render().asPng();
  const pngName = b.file.replace('.svg', '.png');
  fs.writeFileSync(path.join(badgesDir, pngName), png);
  console.log(`✓ Rendered ${pngName} (256x256, ${png.length} bytes)`);
});

// Build Presentation Showcase SVG (10 Badges in clean responsive layout)
const W = 1400;
const H = 1380;

let gridItems = '';
badges.forEach((b, i) => {
  let col, row, x, y;
  if (i < 9) {
    col = i % 3;
    row = Math.floor(i / 3);
    x = 70 + col * 430;
    y = 200 + row * 280;
  } else {
    // 10th badge centered on row 3
    col = 1;
    row = 3;
    x = 70 + 430;
    y = 200 + row * 280;
  }

  const svgInner = fs.readFileSync(path.join(badgesDir, b.file), 'utf8')
    .replace(/<\?xml.*?\?>/g, '')
    .replace(/<svg[^>]*>/g, '')
    .replace(/<\/svg>/g, '');

  const safeDesc = (b.desc.length > 28 ? b.desc.slice(0, 26) + '...' : b.desc).replace(/&/g, '&amp;');
  const safeDiscipline = b.discipline.replace(/&/g, '&amp;');

  gridItems += `
  <!-- CARD ${i+1}: ${b.title} -->
  <g transform="translate(${x}, ${y})">
    <!-- Card Base -->
    <rect x="0" y="0" width="390" height="240" rx="20" fill="#0E1624" stroke="#1E293B" stroke-width="1.5" />
    
    <!-- Render Badge SVG at 128x128 -->
    <g transform="translate(20, 26) scale(1.0)">
      ${svgInner}
    </g>

    <!-- Meta Info -->
    <g transform="translate(160, 42)">
      <!-- Discipline Pill -->
      <rect x="0" y="0" width="130" height="24" rx="12" fill="${b.accent}18" stroke="${b.accent}" stroke-width="1" />
      <text x="65" y="16" fill="${b.accent}" font-family="Nunito, sans-serif" font-weight="800" font-size="10.5" text-anchor="middle" letter-spacing="0.5">${safeDiscipline}</text>

      <!-- Badge Title -->
      <text x="0" y="54" fill="#F8FAFC" font-family="Nunito, sans-serif" font-weight="900" font-size="20">${b.title}</text>

      <!-- Badge Description -->
      <text x="0" y="80" fill="#94A3B8" font-family="Nunito, sans-serif" font-weight="600" font-size="12.5">${safeDesc}</text>

      <!-- Specs Tag -->
      <text x="0" y="125" fill="#64748B" font-family="Nunito, sans-serif" font-weight="700" font-size="11">128x128 Pure Vector SVG</text>
    </g>
  </g>
  `;
});

const showcaseSvg = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="showcase-bg" cx="50%" cy="10%" r="70%">
      <stop offset="0%" stop-color="#141E2E" />
      <stop offset="60%" stop-color="#0A101A" />
      <stop offset="100%" stop-color="#05080E" />
    </radialGradient>
    <linearGradient id="top-bar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#71CFFE" />
      <stop offset="35%" stop-color="#BC71FE" />
      <stop offset="70%" stop-color="#F9723B" />
      <stop offset="100%" stop-color="#EDAC1C" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#showcase-bg)" />
  <rect x="0" y="0" width="${W}" height="5" fill="url(#top-bar)" />

  <!-- Header -->
  <g transform="translate(70, 50)">
    <rect x="0" y="0" width="220" height="32" rx="16" fill="#1E293B" stroke="#334155" stroke-width="1.2" />
    <circle cx="16" cy="16" r="4.5" fill="#EDAC1C" />
    <text x="30" y="21" fill="#EDAC1C" font-family="Nunito, sans-serif" font-weight="800" font-size="11.5" letter-spacing="1">SAKODE HONORARY SUITE</text>

    <text x="0" y="70" fill="#F8FAFC" font-family="Nunito, sans-serif" font-weight="900" font-size="34">
      Official SAKODE Work Honorary Badges (10 Vector Emblems)
    </text>

    <text x="0" y="102" fill="#94A3B8" font-family="Nunito, sans-serif" font-weight="600" font-size="16">
      Sistem lencana kehormatan lintas disiplin (Teknologi, Edukasi, Marketing, Milestone) dengan estetika medallion SAKODE.
    </text>
  </g>

  <!-- Divider -->
  <line x1="70" y1="175" x2="${W - 70}" y2="175" stroke="#1E293B" stroke-width="1.5" />

  <!-- Grid Items -->
  ${gridItems}

  <!-- Footer Info -->
  <g transform="translate(70, ${H - 40})">
    <text x="0" y="0" fill="#64748B" font-family="Nunito, sans-serif" font-weight="600" font-size="13">
      • Standar Desain: Squircle Medallion, Double Border, Signature Gold Smile Arc, Zero Raster, Zero Font Dependency
    </text>
    <text x="${W - 140}" y="0" fill="#71CFFE" font-family="Nunito, sans-serif" font-weight="800" font-size="13" text-anchor="end">
      public/badges/ • 128x128 Pure SVG
    </text>
  </g>
</svg>
`;

const resvgShowcase = new Resvg(showcaseSvg, {
  fitTo: { mode: 'width', value: W },
  font: { loadSystemFonts: true, defaultFontFamily: 'Nunito' }
});
const pngShowcase = resvgShowcase.render().asPng();
const showcaseOut = path.join(badgesDir, 'badges-showcase.png');
fs.writeFileSync(showcaseOut, pngShowcase);
console.log(`✓ Generated ${showcaseOut} (${W}x${H}, ${pngShowcase.length} bytes)`);

// Copy showcase to artifact directory for markdown display
const artifactDir = 'C:/Users/yogaa/.gemini/antigravity/brain/51755b30-e706-4a5e-9da1-ce1000f53ba4';
fs.copyFileSync(showcaseOut, path.join(artifactDir, 'badges-showcase.png'));
console.log('✓ Copied badges-showcase.png to artifact directory');
