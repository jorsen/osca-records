import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OSCA Records - User Management",
  description: "Senior Citizen and Pensioner Record Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
