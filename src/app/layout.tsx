import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header } from '../components/Header';
import { generateThemeCssVariables, getActiveTheme } from '../lib/theme';

export const metadata: Metadata = {
  title: 'World Flags — Master the 195 National Flags',
  description:
    'A personal, local-first adaptive learning application for mastering the national flags of all 195 sovereign countries.',
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
