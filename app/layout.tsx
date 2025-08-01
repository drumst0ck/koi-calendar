import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import "./globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import { GoogleTagManager } from "@next/third-parties/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KOI Calendar - Calendario de Partidos | Esports KOI",
  description: "Calendario oficial de partidos del equipo de esports KOI. Sigue todos los matches de Valorant, League of Legends, CS2 y más juegos en tiempo real con enlaces a streams de Twitch y YouTube.",
  keywords: ["KOI", "esports", "calendario", "partidos", "Valorant", "League of Legends", "CS2", "Twitch", "YouTube", "gaming", "competitivo"],
  authors: [{ name: "drumst0ck", url: "https://github.com/drumst0ck" }],
  creator: "drumst0ck",
  publisher: "KOI Calendar",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://koicalendar.nexuslegends.com",
    title: "KOI Calendar - Calendario de Partidos | Esports KOI",
    description: "Calendario oficial de partidos del equipo de esports KOI. Sigue todos los matches de Valorant, League of Legends, CS2 y más juegos en tiempo real.",
    siteName: "KOI Calendar",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "KOI Calendar - Calendario de Partidos de Esports",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KOI Calendar - Calendario de Partidos | Esports KOI",
    description: "Sigue todos los partidos del equipo de esports KOI en tiempo real. Valorant, LoL, CS2 y más.",
    images: ["/og-image.svg"],
    creator: "@drumst0ck",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16", type: "image/x-icon" },
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/logokoi.svg", sizes: "any", type: "image/svg+xml" }
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/favicon.ico", sizes: "180x180", type: "image/x-icon" },
      { url: "/logokoi.svg", sizes: "any", type: "image/svg+xml" }
    ],
  },
  metadataBase: new URL("https://koicalendar.nexuslegends.com"),
  alternates: {
    canonical: "/",
  },
  other: {
    "format-detection": "telephone=no, date=no, email=no, address=no",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#8b5cf6" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "KOI Calendar",
    "description": "Calendario oficial de partidos del equipo de esports KOI",
    "url": "https://koicalendar.nexuslegends.com",
    "author": {
      "@type": "Person",
      "name": "drumst0ck",
      "url": "https://github.com/drumst0ck"
    },
    "publisher": {
      "@type": "Organization",
      "name": "KOI Calendar",
      "logo": {
        "@type": "ImageObject",
        "url": "https://koicalendar.nexuslegends.com/logokoi.svg"
      }
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://koicalendar.nexuslegends.com/?search={search_term_string}",
      "query-input": "required name=search_term_string"
    },
    "about": {
      "@type": "SportsTeam",
      "name": "KOI",
      "sport": "Esports"
    }
  };

  return (
    <html lang={locale}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        {process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID &&
        process.env.NODE_ENV === "production" && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID} />
          )}
        {process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID &&
        process.env.NODE_ENV === "production" && (
          <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID} />
        )}
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
