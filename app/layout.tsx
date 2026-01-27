import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';

const siteUrl = 'https://peril.lol/uncommit';
const title = '<uncommit/>';
const description = 'AI-generated release notes from your code';

export const metadata: Metadata = {
  title,
  description,
  metadataBase: new URL(siteUrl),
  icons: {
    icon: [
      { url: '/uncommit/favicon.ico', sizes: 'any' },
      { url: '/uncommit/favicon.svg', type: 'image/svg+xml' },
      { url: '/uncommit/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/uncommit/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/uncommit/favicon-256.png', sizes: '256x256', type: 'image/png' },
    ],
    apple: '/uncommit/apple-touch-icon.png',
  },
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: 'uncommit',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'uncommit - AI-generated release notes',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="color-scheme" content="light dark" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
