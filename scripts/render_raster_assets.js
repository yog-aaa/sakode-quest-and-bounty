const fs = require('fs');
const path = require('path');
const { Resvg } = require('../node_modules/@resvg/resvg-js');

const publicDir = path.resolve(__dirname, '..', 'public');

function renderSvgToPng(svgString, outPath, options = {}) {
  const resvg = new Resvg(svgString, {
    fitTo: options.fitTo || { mode: 'original' },
    font: {
      loadSystemFonts: true,
      defaultFontFamily: 'Nunito',
    },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  fs.writeFileSync(outPath, pngBuffer);
  console.log(`Rendered ${path.basename(outPath)} (${pngData.width}x${pngData.height}, ${pngBuffer.length} bytes)`);
  return pngBuffer;
}

// 1. Render icon.png (512x512 transparent PNG)
const brandmarkStickerSvg = fs.readFileSync(path.join(publicDir, 'sakode-brandmark-sticker.svg'), 'utf8');
renderSvgToPng(brandmarkStickerSvg, path.join(publicDir, 'icon.png'), {
  fitTo: { mode: 'width', value: 512 }
});

// 2. Render apple-icon.png (180x180 solid background PNG)
// We embed the brandmark inside a 180x180 solid rounded canvas
const appleIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="180" height="180">
  <defs>
    <linearGradient id="apple-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A" />
      <stop offset="100%" stop-color="#1E293B" />
    </linearGradient>
    <filter id="badge-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#71CFFE" flood-opacity="0.35" />
    </filter>
  </defs>
  <!-- Solid Background -->
  <rect width="180" height="180" fill="url(#apple-bg)" />
  
  <!-- Subtle cyan ambient light ring -->
  <circle cx="90" cy="90" r="72" fill="none" stroke="#71CFFE" stroke-width="1.5" stroke-opacity="0.25" />
  
  <!-- Scaled Brandmark Sticker -->
  <g transform="translate(18, 18) scale(0.342)">
    ${fs.readFileSync(path.join(publicDir, 'sakode-brandmark-sticker.svg'), 'utf8')
      .replace(/<\?xml.*?\?>/g, '')
      .replace(/<svg[^>]*>/g, '')
      .replace(/<\/svg>/g, '')}
  </g>
</svg>
`;
renderSvgToPng(appleIconSvg, path.join(publicDir, 'apple-icon.png'), {
  fitTo: { mode: 'width', value: 180 }
});

// 3. Render opengraph-image.png (1200x630 px)
const ogImageSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="og-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B0F19" />
      <stop offset="50%" stop-color="#0F172A" />
      <stop offset="100%" stop-color="#1E293B" />
    </linearGradient>
    
    <radialGradient id="cyan-glow" cx="15%" cy="20%" r="50%">
      <stop offset="0%" stop-color="#71CFFE" stop-opacity="0.22" />
      <stop offset="100%" stop-color="#0B0F19" stop-opacity="0" />
    </radialGradient>
    
    <radialGradient id="green-glow" cx="85%" cy="80%" r="60%">
      <stop offset="0%" stop-color="#00A86B" stop-opacity="0.20" />
      <stop offset="100%" stop-color="#0B0F19" stop-opacity="0" />
    </radialGradient>

    <pattern id="dot-grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.2" fill="#334155" fill-opacity="0.45" />
    </pattern>
    
    <filter id="sticker-shadow-og" x="-20%" y="-20%" width="150%" height="150%">
      <feDropShadow dx="0" dy="16" stdDeviation="16" flood-color="#000000" flood-opacity="0.6" />
    </filter>
  </defs>

  <!-- Canvas Background -->
  <rect width="1200" height="630" fill="url(#og-bg)" />
  <rect width="1200" height="630" fill="url(#cyan-glow)" />
  <rect width="1200" height="630" fill="url(#green-glow)" />
  <rect width="1200" height="630" fill="url(#dot-grid)" />

  <!-- Top Accent Bar -->
  <rect x="0" y="0" width="1200" height="6" fill="#71CFFE" />

  <!-- Left Column: Branding & Value Proposition -->
  <g transform="translate(80, 80)">
    <!-- Eyebrow Pill -->
    <rect x="0" y="0" width="240" height="36" rx="18" fill="#1E293B" stroke="#334155" stroke-width="1.5" />
    <circle cx="20" cy="18" r="6" fill="#10B981" />
    <text x="36" y="23" fill="#94A3B8" font-family="Nunito, system-ui, sans-serif" font-weight="700" font-size="13" letter-spacing="1">SAKODE WORK PLATFORM</text>

    <!-- Logo SAKODE Work Dark -->
    <g transform="translate(0, 56) scale(0.36)">
      ${fs.readFileSync(path.join(publicDir, 'sakode-work-logo-dark.svg'), 'utf8')
        .replace(/<\?xml.*?\?>/g, '')
        .replace(/<svg[^>]*>/g, '')
        .replace(/<\/svg>/g, '')}
    </g>

    <!-- Catchy Headline -->
    <text x="0" y="200" fill="#F8FAFC" font-family="Nunito, system-ui, sans-serif" font-weight="800" font-size="44" letter-spacing="-0.5">
      Platform Task IT &amp; Bounty Reward
    </text>
    
    <!-- Subtitle -->
    <text x="0" y="245" fill="#94A3B8" font-family="Nunito, system-ui, sans-serif" font-weight="600" font-size="21">
      Kerjakan proyek nyata, bentuk tim kolaborasi, dan cairkan
    </text>
    <text x="0" y="275" fill="#94A3B8" font-family="Nunito, system-ui, sans-serif" font-weight="600" font-size="21">
      reward honorarium secara transparan &amp; profesional.
    </text>

    <!-- Feature Cards / Badges Row -->
    <g transform="translate(0, 325)">
      <!-- Feature 1 -->
      <rect x="0" y="0" width="180" height="52" rx="12" fill="#1E293B" stroke="#334155" stroke-width="1" />
      <text x="18" y="32" fill="#71CFFE" font-family="Nunito, sans-serif" font-weight="800" font-size="18">🎯</text>
      <text x="46" y="32" fill="#E2E8F0" font-family="Nunito, sans-serif" font-weight="700" font-size="14">Verified Tasks</text>

      <!-- Feature 2 -->
      <rect x="195" y="0" width="180" height="52" rx="12" fill="#1E293B" stroke="#334155" stroke-width="1" />
      <text x="213" y="32" fill="#BC71FE" font-family="Nunito, sans-serif" font-weight="800" font-size="18">👥</text>
      <text x="241" y="32" fill="#E2E8F0" font-family="Nunito, sans-serif" font-weight="700" font-size="14">Fair Team Split</text>

      <!-- Feature 3 -->
      <rect x="390" y="0" width="190" height="52" rx="12" fill="#1E293B" stroke="#334155" stroke-width="1" />
      <text x="408" y="32" fill="#F9723B" font-family="Nunito, sans-serif" font-weight="800" font-size="18">💰</text>
      <text x="436" y="32" fill="#E2E8F0" font-family="Nunito, sans-serif" font-weight="700" font-size="14">Instant Bounty</text>
    </g>

    <!-- Bottom URL Link Pill -->
    <g transform="translate(0, 420)">
      <rect x="0" y="0" width="220" height="42" rx="21" fill="#71CFFE" />
      <text x="24" y="27" fill="#0F172A" font-family="Nunito, sans-serif" font-weight="800" font-size="16" letter-spacing="0.5">work.sakode.com →</text>
      <text x="245" y="27" fill="#64748B" font-family="Nunito, sans-serif" font-weight="600" font-size="15">by SAKODE Academy</text>
    </g>
  </g>

  <!-- Right Column: Hero Mascot Badge Sticker -->
  <g transform="translate(730, 85)" filter="url(#sticker-shadow-og)">
    <!-- Decorative background glow ring -->
    <circle cx="200" cy="200" r="185" fill="#71CFFE" fill-opacity="0.1" stroke="#71CFFE" stroke-width="2" stroke-opacity="0.3" stroke-dasharray="8 8" />
    
    <g transform="translate(-20, -10) scale(1.05)">
      ${fs.readFileSync(path.join(publicDir, 'sakode-brandmark-sticker.svg'), 'utf8')
        .replace(/<\?xml.*?\?>/g, '')
        .replace(/<svg[^>]*>/g, '')
        .replace(/<\/svg>/g, '')}
    </g>
  </g>
</svg>
`;
renderSvgToPng(ogImageSvg, path.join(publicDir, 'opengraph-image.png'), {
  fitTo: { mode: 'width', value: 1200 }
});

// 4. Render email-header.png (600x160 px)
const emailHeaderSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 160" width="600" height="160">
  <defs>
    <linearGradient id="email-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F8FAFC" />
      <stop offset="100%" stop-color="#FFFFFF" />
    </linearGradient>
  </defs>

  <!-- Clean Header Canvas -->
  <rect width="600" height="160" fill="url(#email-bg)" stroke="#E2E8F0" stroke-width="1" />
  
  <!-- Vibrant Top Brand Accent Line -->
  <rect x="0" y="0" width="600" height="5" fill="#71CFFE" />

  <!-- Logo Group -->
  <g transform="translate(36, 45) scale(0.32)">
    ${fs.readFileSync(path.join(publicDir, 'sakode-work-logo-light.svg'), 'utf8')
      .replace(/<\?xml.*?\?>/g, '')
      .replace(/<svg[^>]*>/g, '')
      .replace(/<\/svg>/g, '')}
  </g>

  <!-- Header Right Label -->
  <g transform="translate(420, 58)">
    <rect x="0" y="0" width="144" height="28" rx="14" fill="#E0F2FE" />
    <text x="14" y="19" fill="#0369A1" font-family="Nunito, system-ui, sans-serif" font-weight="700" font-size="11" letter-spacing="0.8">NOTIFIKASI RESMI</text>
    <text x="5" y="44" fill="#64748B" font-family="Nunito, system-ui, sans-serif" font-weight="500" font-size="11">work.sakode.com</text>
  </g>

  <!-- Bottom Divider Line -->
  <line x1="36" y1="135" x2="564" y2="135" stroke="#F1F5F9" stroke-width="1.5" />
</svg>
`;
renderSvgToPng(emailHeaderSvg, path.join(publicDir, 'email-header.png'), {
  fitTo: { mode: 'width', value: 600 }
});

console.log('All PNG raster assets rendered successfully!');
