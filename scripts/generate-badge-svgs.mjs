import fs from 'fs';
import path from 'path';

const badgesDir = path.resolve('public/badges');
if (!fs.existsSync(badgesDir)) {
  fs.mkdirSync(badgesDir, { recursive: true });
}

const BADGES = [
  {
    file: 'badge-code-artisan.svg',
    fromColor: '#8B5CF6',
    toColor: '#6366F1',
    symbolPath: '<path d="m18 16-6 8 6 8M30 16l6 8-6 8M26 14l-4 20" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  {
    file: 'badge-system-architect.svg',
    fromColor: '#7C3AED',
    toColor: '#A855F7',
    symbolPath: '<path d="m12 18 12-6 12 6-12 6-12-6ZM12 24l12 6 12-6M12 30l12 6 12-6" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  {
    file: 'badge-bug-hunter.svg',
    fromColor: '#0284C7',
    toColor: '#38BDF8',
    symbolPath: '<path d="M24 14v6M18 19l-3-3M30 19l3-3M16 26h-4M36 26h-4M18 31l-3 3M30 31l3 3" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/><circle cx="24" cy="26" r="6" stroke="#FFFFFF" stroke-width="2.5"/>',
  },
  {
    file: 'badge-curriculum-pioneer.svg',
    fromColor: '#0284C7',
    toColor: '#0EA5E9',
    symbolPath: '<path d="M12 15h9a3 3 0 0 1 3 3v16a3 3 0 0 0-3-3h-9V15ZM36 15h-9a3 3 0 0 0-3 3v16a3 3 0 0 1 3-3h9V15Z" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  {
    file: 'badge-knowledge-mentor.svg',
    fromColor: '#7C3AED',
    toColor: '#C084FC',
    symbolPath: '<circle cx="24" cy="20" r="7" stroke="#FFFFFF" stroke-width="2.5"/><path d="M20 26l-3 10 7-3 7 3-3-10" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  {
    file: 'badge-community-champion.svg',
    fromColor: '#0284C7',
    toColor: '#38BDF8',
    symbolPath: '<path d="m13 20 11-5v18l-11-5v-8ZM24 23l10 5M24 17l10-5" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  {
    file: 'badge-creative-storyteller.svg',
    fromColor: '#0284C7',
    toColor: '#06B6D4',
    symbolPath: '<path d="M16 14h16a2 2 0 0 1 2 2v20a2 2 0 0 1-2 2H16a2 2 0 0 1-2-2V16a2 2 0 0 1 2-2ZM20 20h8M20 25h8M20 30h5" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>',
  },
  {
    file: 'badge-first-blood.svg',
    fromColor: '#059669',
    toColor: '#10B981',
    symbolPath: '<path d="M26 12 16 26h8l-2 10 12-16h-8l2-8Z" fill="#FFFFFF"/>',
  },
  {
    file: 'badge-speed-demon.svg',
    fromColor: '#D97706',
    toColor: '#F59E0B',
    symbolPath: '<circle cx="24" cy="24" r="11" stroke="#FFFFFF" stroke-width="2.5"/><path d="M24 18v6l4 2" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>',
  },
  {
    file: 'badge-golden-ledger.svg',
    fromColor: '#D97706',
    toColor: '#FBBF24',
    symbolPath: '<circle cx="24" cy="24" r="11" stroke="#FFFFFF" stroke-width="2.5"/><path d="m19 24 3.5 3.5 6.5-7" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>',
  },
];

for (const b of BADGES) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48" fill="none">
  <defs>
    <linearGradient id="g_${b.file.replace(/[^a-z0-9]/gi, '')}" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${b.fromColor}"/>
      <stop offset="100%" stop-color="${b.toColor}"/>
    </linearGradient>
  </defs>
  <rect width="48" height="48" rx="14" fill="url(#g_${b.file.replace(/[^a-z0-9]/gi, '')})"/>
  <rect x="1" y="1" width="46" height="46" rx="13" stroke="#FFFFFF" stroke-opacity="0.25" stroke-width="1.5"/>
  ${b.symbolPath}
</svg>`;

  fs.writeFileSync(path.join(badgesDir, b.file), svg, 'utf-8');
}

console.log('10 Badge SVGs generated successfully in public/badges/');
