import type { Metadata, Viewport } from "next";
import { GeistPixelSquare } from "geist/font/pixel";
import "@/styles/globals.css";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { AgentKyleDock } from "@/components/AgentKyleDock";
import { THEME_PALETTE } from "@/lib/theme/palette";
import { Analytics } from "@vercel/analytics/next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kylespringfield.dev";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Kyle Springfield",
    template: "%s | Kyle Springfield"
  },
  description: "Kyle Springfield builds data pipelines, analytics systems, and AI-powered apps.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico"
  },
  keywords: [
    "data engineering",
    "analytics engineering",
    "AI engineering",
    "dbt",
    "Snowflake",
    "AWS",
    "Python",
    "SQL"
  ],
  openGraph: {
    title: "Kyle Springfield",
    description: "Data pipelines, analytics systems, and AI-powered apps.",
    type: "website",
    images: [{ url: "/opengraph-image" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Kyle Springfield",
    description: "Data pipelines, analytics systems, and AI-powered apps.",
    images: ["/opengraph-image"]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: THEME_PALETTE.black
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={GeistPixelSquare.variable}>
      <body className="font-sans">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
        <AgentKyleDock />
        <AnalyticsProvider />
        <Analytics />
      </body>
    </html>
  );
}
