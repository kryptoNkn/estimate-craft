// src/app/layout.tsx
import '../styles/globals.scss';
import Topbar from './Topbar/Topbar';
import { Cinzel, Plus_Jakarta_Sans } from 'next/font/google';

const cinzel = Cinzel({ 
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata = {
  title: 'AURA DEVELOPMENT — Премиальная недвижимость',
  description: '3D Конфигуратор материалов для вилл и коттеджей',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={`${cinzel.variable} ${jakarta.variable}`}>
      <body>
        <Topbar />
        <main>{children}</main>
      </body>
    </html>
  );
}