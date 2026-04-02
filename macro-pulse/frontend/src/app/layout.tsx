import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ModeProvider } from "@/lib/mode";

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Macro Pulse — Live Regime Tracker",
  description:
    "Track economic regimes in real time using Ray Dalio's four-season framework. Free macro investing dashboard with live FRED data, geopolitical AI synthesis, and ETF allocation recommendations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistMono.variable}>
      <body className="font-mono antialiased">
        <ModeProvider>{children}</ModeProvider>
      </body>
    </html>
  );
}
