import type { Metadata, Viewport } from "next";
import { Lato, Geist_Mono } from "next/font/google";

import { InstallPrompt } from "@/components/InstallPrompt/InstallPrompt";

import "./globals.css";
import { cn } from "@/lib/utils";

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
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
      className={cn("h-full antialiased font-sans", lato.variable, geistMono.variable)}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}
