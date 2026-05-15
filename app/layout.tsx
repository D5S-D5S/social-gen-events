import type { Metadata } from "next";
import "./globals.css";

const APP_URL = "https://social-gen-events.netlify.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: { default: "Social Gen Events", template: "%s | Social Gen Events" },
  description: "Bespoke balloon displays, styled backdrops and decor for celebrations.",
  keywords: ["balloon displays", "event decor", "balloon styling", "party backdrop"],
  authors: [{ name: "Social Gen Events" }],
  openGraph: {
    type: "website",
    url: APP_URL,
    title: "Social Gen Events",
    description: "Bespoke balloon displays, styled backdrops and decor for celebrations.",
    siteName: "Social Gen Events",
  },
  twitter: {
    card: "summary_large_image",
    title: "Social Gen Events",
    description: "Bespoke balloon displays, styled backdrops and decor for celebrations.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
