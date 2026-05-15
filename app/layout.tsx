import type { Metadata } from "next";
import "./globals.css";

const APP_URL = "https://balloon-base.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: { default: "BalloonBase — The Balloon Business Platform", template: "%s | BalloonBase" },
  description: "All-in-one software for balloon decoration businesses. Manage bookings, quotes, inventory, and clients in one place.",
  keywords: ["balloon decorator software", "balloon business management", "event decorator app", "balloon quote generator"],
  authors: [{ name: "BalloonBase" }],
  openGraph: {
    type: "website",
    url: APP_URL,
    title: "BalloonBase — The Balloon Business Platform",
    description: "Run your balloon business without the chaos. Bookings, quotes, inventory, and clients — all in one place.",
    siteName: "BalloonBase",
  },
  twitter: {
    card: "summary_large_image",
    title: "BalloonBase — The Balloon Business Platform",
    description: "Run your balloon business without the chaos.",
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
