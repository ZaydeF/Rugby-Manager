import type { Metadata } from "next";
import "./globals.css";
import "./modern-career.css";

export const metadata: Metadata = {
  title: "Super Rugby Manager",
  description: "Explore the real 2026 squads, position-adjusted player ratings and historical performance.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
