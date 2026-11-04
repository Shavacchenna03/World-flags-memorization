import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header } from '../components/Header';
import { generateThemeCssVariables, getActiveTheme } from '../lib/theme';

export const metadata: Metadata = {
  metadataBase: new URL('https://vexifer.vercel.app'),
  title: 'Vexifer — Master the 195 National Flags',
  description:
    'Learn and master the national flags of all 195 sovereign countries through structured lessons and active recall.',
  applicationName: 'Vexifer',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Vexifer — Master the 195 National Flags',
    description:
      'Learn and master the national flags of all 195 sovereign countries through structured lessons and active recall.',
    url: 'https://vexifer.vercel.app',
    siteName: 'Vexifer',
    type: 'website',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Vexifer — Master the 195 National Flags',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vexifer — Master the 195 National Flags',
    description:
      'Learn and master the national flags of all 195 sovereign countries through structured lessons and active recall.',
    images: ['/twitter-image.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const activeTheme = getActiveTheme();
  const themeCss = generateThemeCssVariables(activeTheme);

  return (
    <html lang="en">
      <head>
        <style id="world-flags-theme" dangerouslySetInnerHTML={{ __html: themeCss }} />
      </head>
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
