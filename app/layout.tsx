import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://sarabiashop.vercel.app'),
  title: { default: 'SarabiaShop · Preventa de playeras originales', template: '%s · SarabiaShop' },
  description: 'Playeras originales Banana Republic y GAP en preventa. $350 cada una, tallas S, M y L. Aparta tu talla desde el celular.',
  openGraph: {
    title: 'SarabiaShop · Preventa de playeras originales',
    description: 'Banana Republic y GAP originales a $350. Llegan el 15 de noviembre. Aparta tu talla.',
    images: [{ url: '/productos/br-script-azul-marino.jpg', width: 896, height: 1200 }],
    locale: 'es_MX',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#F4F4F1',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
