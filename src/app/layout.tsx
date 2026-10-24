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
  title: {
    template: '%s | SAKODE Task & Reward',
    default: 'SAKODE Task & Reward Platform - SAKODE Academy',
  },
  description:
    'Platform resmi SAKODE Academy untuk pengerjaan task IT profesional, kolaborasi tim transparan, dan pencairan bounty reward.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${nunito.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-sakode-bg text-sakode-text font-sans selection:bg-sakode-cyan/30">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
