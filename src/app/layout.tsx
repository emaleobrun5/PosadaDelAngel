import type { Metadata, Viewport } from "next";
import { Fraunces, Geist } from "next/font/google";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Posada del Ángel — Registro de huéspedes",
  description: "Sistema interno de check-in de Posada del Ángel.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#1e3a32",
  // La tablet de recepción no debe alejarse ni acercarse por un toque accidental.
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
