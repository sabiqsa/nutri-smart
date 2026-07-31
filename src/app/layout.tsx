import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";

import { InstallPrompt } from "@/components/InstallPrompt/InstallPrompt";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NutriSmart",
  description: "Nutrition & diet tracking for hospital care teams",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NutriSmart",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#00478d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* eslint-disable-next-line @next/next/no-page-custom-font -- root layout loads once for the whole app, this isn't per-page */}
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        rel="stylesheet"
      />
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}
