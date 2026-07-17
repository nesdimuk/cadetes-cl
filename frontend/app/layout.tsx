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
  title: {
    default: "Cadetes.cl · Fútbol formativo chileno",
    template: "%s | Cadetes.cl",
  },
  description: "Resultados, tablas de posiciones y calendarios del fútbol formativo chileno Sub-11 a Sub-20.",
  keywords: ["fútbol formativo", "cadetes", "sub-14", "sub-15", "chile", "campeonato chileno"],
  openGraph: {
    siteName: "Cadetes.cl",
    locale: "es_CL",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
