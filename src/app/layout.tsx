import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OSCA Records",
  description: "Office for Senior Citizens Affairs — Senior Citizen Records Management System",
  manifest: "/manifest.json",
  themeColor: "#15803d",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OSCA Records",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased">
        {children}
        <script dangerouslySetInnerHTML={{
          __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'))}`
        }} />
      </body>
    </html>
  );
}
