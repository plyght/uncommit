import type { Metadata } from "next";
import { headers } from "next/headers";
import { Providers } from "./providers";
import "./styles.css";

const productionUrl = "https://0ni.uncommit.sh";
const title = "<uncommit/>";
const description = "AI-generated release notes from your code";

const getSiteUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL;
  if (envUrl) return envUrl;

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  if (process.env.NODE_ENV === "production") {
    return productionUrl;
  }

  const host = headers().get("host");
  if (host) {
    return `http://${host}`;
  }

  const port = process.env.PORT ?? "3000";
  return `http://localhost:${port}`;
};

export const generateMetadata = (): Metadata => {
  const siteUrl = getSiteUrl();

  return {
    title,
    description,
    metadataBase: new URL(siteUrl),
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-256.png", sizes: "256x256", type: "image/png" },
      ],
      apple: "/apple-touch-icon.png",
    },
    openGraph: {
      title,
      description,
      url: siteUrl,
      siteName: "uncommit",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "uncommit - AI-generated release notes",
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
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
      <body className="min-h-screen bg-[var(--bg)] text-[var(--fg)] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
