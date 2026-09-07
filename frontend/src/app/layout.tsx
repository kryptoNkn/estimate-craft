// src/app/layout.tsx
import '../styles/globals.scss';
import Topbar from './Topbar/Topbar';
import { Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google';
import { Bodoni_Moda, Inter } from 'next/font/google';
import { Cormorant_Garamond, Montserrat } from 'next/font/google';

const cormorant = Cormorant_Garamond({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-luxury-serif',
});

const montserrat = Montserrat({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '500', '800'],
  variable: '--font-luxury-sans',
});
const bodoni = Bodoni_Moda({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '600', '700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
});
// Подключаем антикву с поддержкой кириллицы для русских заголовков
const playfair = Playfair_Display({ 
  subsets: ['latin', 'cyrillic'],
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
    <html lang="ru" className={`${playfair.variable} ${jakarta.variable}`}>
      <body>
        <Topbar />
        <main>{children}</main>
      </body>
    </html>
  );
}