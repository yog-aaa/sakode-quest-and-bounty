import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-nunito',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://work.sakode.com'),
  title: {
    template: '%s | SAKODE Work',
    default: 'SAKODE Work - Platform Task IT & Bounty Reward',
  },
  description:
    'Platform resmi SAKODE Academy untuk pengerjaan task IT profesional, kolaborasi tim transparan, dan pencairan bounty reward.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'SAKODE Work - Platform Task IT & Bounty Reward Developer',
    description:
      'Platform resmi SAKODE Academy untuk pengerjaan task IT profesional, kolaborasi tim transparan, dan pencairan bounty reward.',
    url: 'https://work.sakode.com',
    siteName: 'SAKODE Work',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'SAKODE Work - Platform Task IT & Bounty Reward Developer',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SAKODE Work - Platform Task IT & Bounty Reward Developer',
    description:
      'Platform resmi SAKODE Academy untuk pengerjaan task IT profesional dan pencairan bounty reward.',
    images: ['/opengraph-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${nunito.variable} h-full antialiased`}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('sakode-theme');
                  if (saved === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className="min-h-full flex flex-col bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 font-sans selection:bg-sakode-cyan/30"
        suppressHydrationWarning
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
