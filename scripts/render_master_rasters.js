const fs = require('fs');
const path = require('path');
const { Resvg } = require('../node_modules/@resvg/resvg-js');

const publicDir = path.resolve(__dirname, '..', 'public');

function renderSvg(svgPath, outPngPath, width) {
  const svg = fs.readFileSync(svgPath, 'utf8');
  const resvg = new Resvg(svg, {
    fitTo: width ? { mode: 'width', value: width } : { mode: 'original' },
    font: {
      loadSystemFonts: true,
      defaultFontFamily: 'Nunito',
    },
  });
  const png = resvg.render().asPng();
  fs.writeFileSync(outPngPath, png);
  console.log(`Rendered ${path.basename(outPngPath)} (${width || 'original'}px, ${png.length} bytes)`);
  return png;
}

function renderSvgString(svgString, outPngPath, width) {
  const resvg = new Resvg(svgString, {
    fitTo: width ? { mode: 'width', value: width } : { mode: 'original' },
    font: {
      loadSystemFonts: true,
      defaultFontFamily: 'Nunito',
    },
  });
  const png = resvg.render().asPng();
  fs.writeFileSync(outPngPath, png);
  console.log(`Rendered string to ${path.basename(outPngPath)} (${width || 'original'}px, ${png.length} bytes)`);
  return png;
}

// 1. Render sakode-work-logo.png (Horizontal Web Logo at 2400w)
renderSvg(
  path.join(publicDir, 'sakode-work-logo.svg'),
  path.join(publicDir, 'sakode-work-logo.png'),
  2400
);

// 2. Render sakode-work-emblem.png (Bounty Emblem at 1100w)
renderSvg(
  path.join(publicDir, 'sakode-work-emblem.svg'),
  path.join(publicDir, 'sakode-work-emblem.png'),
  1100
);

// 3. Render icon.png (512x512 transparent PNG)
// Fit emblem into 512x512 with safe padding (464x464)
const iconSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(24, 12) scale(0.44)">
    ${fs.readFileSync(path.join(publicDir, 'sakode-work-emblem.svg'), 'utf8')
      .replace(/<\?xml.*?\?>/g, '')
      .replace(/<svg[^>]*>/g, '')
      .replace(/<\/svg>/g, '')}
  </g>
</svg>
`;
renderSvgString(iconSvg, path.join(publicDir, 'icon.png'), 512);

// 4. Render apple-icon.png (180x180 solid background PNG)
const appleSvg = `
<svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Solid Dark Slate Background for Apple iOS Home Screen -->
  <rect width="180" height="180" fill="#0B0F19" />
  <circle cx="90" cy="90" r="76" fill="none" stroke="#71CFFE" stroke-width="1.5" stroke-opacity="0.3" stroke-dasharray="4 4" />
  <g transform="translate(10, 5) scale(0.15)">
    ${fs.readFileSync(path.join(publicDir, 'sakode-work-emblem.svg'), 'utf8')
      .replace(/<\?xml.*?\?>/g, '')
      .replace(/<svg[^>]*>/g, '')
      .replace(/<\/svg>/g, '')}
  </g>
</svg>
`;
renderSvgString(appleSvg, path.join(publicDir, 'apple-icon.png'), 180);

// 5. Render opengraph-image.png (1200x630 px)
const ogSvg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="og-glow" cx="15%" cy="20%" r="55%">
      <stop offset="0%" stop-color="#1E293B" />
      <stop offset="70%" stop-color="#0F172A" />
      <stop offset="100%" stop-color="#0B0F19" />
    </radialGradient>
    <linearGradient id="cyan-bar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#71CFFE" />
      <stop offset="50%" stop-color="#00A3E0" />
      <stop offset="100%" stop-color="#00A86B" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#og-glow)" />
  <rect x="0" y="0" width="1200" height="6" fill="url(#cyan-bar)" />

  <!-- Left Column: Branding & Value Proposition -->
  <g transform="translate(70, 70)">
    <!-- Eyebrow Pill -->
    <rect x="0" y="0" width="230" height="34" rx="17" fill="#1E293B" stroke="#334155" stroke-width="1.5" />
    <circle cx="18" cy="17" r="5" fill="#10B981" />
    <text x="32" y="22" fill="#94A3B8" font-family="Nunito, sans-serif" font-weight="800" font-size="12" letter-spacing="1">SAKODE WORK PLATFORM</text>

    <!-- Scaled Master Horizontal Logo -->
    <g transform="translate(0, 52) scale(0.145)">
      ${fs.readFileSync(path.join(publicDir, 'sakode-work-logo.svg'), 'utf8')
        .replace(/<\?xml.*?\?>/g, '')
        .replace(/<svg[^>]*>/g, '')
        .replace(/<\/svg>/g, '')}
    </g>

    <!-- Headline -->
    <text x="0" y="200" fill="#F8FAFC" font-family="Nunito, sans-serif" font-weight="900" font-size="40" letter-spacing="-0.5">
      Platform Task IT &amp; Bounty Reward
    </text>

    <!-- Subtitle -->
    <text x="0" y="242" fill="#94A3B8" font-family="Nunito, sans-serif" font-weight="600" font-size="20">
      Kerjakan proyek nyata, bentuk tim kolaborasi terstruktur, dan
    </text>
    <text x="0" y="270" fill="#94A3B8" font-family="Nunito, sans-serif" font-weight="600" font-size="20">
      cairkan reward honorarium secara transparan &amp; profesional.
    </text>

    <!-- Badges Row -->
    <g transform="translate(0, 318)">
      <rect x="0" y="0" width="170" height="48" rx="12" fill="#1E293B" stroke="#334155" stroke-width="1" />
      <text x="16" y="30" fill="#71CFFE" font-family="Nunito, sans-serif" font-weight="900" font-size="16">🎯</text>
      <text x="42" y="30" fill="#E2E8F0" font-family="Nunito, sans-serif" font-weight="700" font-size="13.5">Verified Tasks</text>

      <rect x="185" y="0" width="175" height="48" rx="12" fill="#1E293B" stroke="#334155" stroke-width="1" />
      <text x="201" y="30" fill="#BC71FE" font-family="Nunito, sans-serif" font-weight="900" font-size="16">👥</text>
      <text x="227" y="30" fill="#E2E8F0" font-family="Nunito, sans-serif" font-weight="700" font-size="13.5">Fair Team Split</text>

      <rect x="375" y="0" width="175" height="48" rx="12" fill="#1E293B" stroke="#334155" stroke-width="1" />
      <text x="391" y="30" fill="#F9723B" font-family="Nunito, sans-serif" font-weight="900" font-size="16">💰</text>
      <text x="417" y="30" fill="#E2E8F0" font-family="Nunito, sans-serif" font-weight="700" font-size="13.5">Instant Bounty</text>
    </g>

    <!-- URL Pill -->
    <g transform="translate(0, 405)">
      <rect x="0" y="0" width="220" height="42" rx="21" fill="#71CFFE" />
      <text x="24" y="27" fill="#0F172A" font-family="Nunito, sans-serif" font-weight="900" font-size="16">work.sakode.com →</text>
      <text x="245" y="27" fill="#64748B" font-family="Nunito, sans-serif" font-weight="700" font-size="15">by SAKODE Academy</text>
    </g>
  </g>

  <!-- Right Column: Hero Master Bounty Quest Emblem -->
  <g transform="translate(680, 50) scale(0.47)">
    ${fs.readFileSync(path.join(publicDir, 'sakode-work-emblem.svg'), 'utf8')
      .replace(/<\?xml.*?\?>/g, '')
      .replace(/<svg[^>]*>/g, '')
      .replace(/<\/svg>/g, '')}
  </g>
</svg>
`;
renderSvgString(ogSvg, path.join(publicDir, 'opengraph-image.png'), 1200);

// 6. Render email-header.png (600x160 px)
const emailSvg = `
<svg width="600" height="160" viewBox="0 0 600 160" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="600" height="160" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
  <rect x="0" y="0" width="600" height="4" fill="#71CFFE" />
  
  <!-- Scaled Master Horizontal Logo -->
  <g transform="translate(24, 48) scale(0.095)">
    ${fs.readFileSync(path.join(publicDir, 'sakode-work-logo.svg'), 'utf8')
      .replace(/<\?xml.*?\?>/g, '')
      .replace(/<svg[^>]*>/g, '')
      .replace(/<\/svg>/g, '')}
  </g>

  <!-- Official Badge on Right -->
  <g transform="translate(435, 54)">
    <rect x="0" y="0" width="135" height="26" rx="13" fill="#E0F2FE" />
    <text x="12" y="17" fill="#0369A1" font-family="Nunito, sans-serif" font-weight="800" font-size="10.5" letter-spacing="0.8">NOTIFIKASI RESMI</text>
    <text x="5" y="42" fill="#64748B" font-family="Nunito, sans-serif" font-weight="600" font-size="11">work.sakode.com</text>
  </g>
  <line x1="24" y1="135" x2="576" y2="135" stroke="#F1F5F9" stroke-width="1.5" />
</svg>
`;
renderSvgString(emailSvg, path.join(publicDir, 'email-header.png'), 600);

console.log('All master raster assets rendered successfully via Resvg!');
