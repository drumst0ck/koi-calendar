import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
    url: "https://koi-calendar.vercel.app",
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
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#8b5cf6" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  metadataBase: new URL("https://koi-calendar.vercel.app"),
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "KOI Calendar",
    "description": "Calendario oficial de partidos del equipo de esports KOI",
    "url": "https://koi-calendar.vercel.app",
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
        "url": "https://koi-calendar.vercel.app/logokoi.svg"
      }
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://koi-calendar.vercel.app/?search={search_term_string}",
      "query-input": "required name=search_term_string"
    },
    "about": {
      "@type": "SportsTeam",
      "name": "KOI",
      "sport": "Esports"
    }
  };

  return (
    <html lang="es">
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
      >
        {children}
      </body>
    </html>
  );
}
