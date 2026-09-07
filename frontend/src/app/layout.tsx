import '../styles/globals.scss';
import Topbar from './Topbar/Topbar';
import Providers from '@/components/Providers';
import { Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google';

const playfair = Playfair_Display({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-serif',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext'],
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
        <Providers>
          <Topbar />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
