import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'sakode-text': '#172033',
        'sakode-text-muted': '#64748B',
        'sakode-cyan': '#71CFFE',
        'sakode-purple': '#BC71FE',
        'sakode-orange': '#F9723B',
        'sakode-border': '#DBE8F0',
        'sakode-bg': '#F7FBFE',
        'sakode-card': '#FFFFFF',
      },
      borderRadius: {
        DEFAULT: '8px',
        sakode: '8px',
      },
      fontFamily: {
        sans: ['var(--font-nunito)', 'Nunito', 'sans-serif'],
        nunito: ['var(--font-nunito)', 'Nunito', 'sans-serif'],
      },
      boxShadow: {
        'sakode-card':
          '0 1px 3px 0 rgba(23, 32, 51, 0.05), 0 1px 2px -1px rgba(23, 32, 51, 0.05)',
        'sakode-elevated':
          '0 10px 15px -3px rgba(23, 32, 51, 0.08), 0 4px 6px -4px rgba(23, 32, 51, 0.04)',
      },
      spacing: {
        '4': '4px',
        '8': '8px',
        '12': '12px',
        '16': '16px',
        '20': '20px',
        '24': '24px',
        '32': '32px',
        '40': '40px',
        '56': '56px',
        '64': '64px',
      },
    },
  },
  plugins: [],
};

export default config;
