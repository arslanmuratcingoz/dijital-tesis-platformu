import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dijital Tesis Platformu',
  description: 'AI destekli endüstriyel tesis, envanter ve proje yönetim platformu.',
  metadataBase: new URL('https://dijital-tesis.vercel.app')
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
