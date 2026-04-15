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
  title: "Macro World View — The AI Race Supply Chain Investment Thesis",
  description:
    "The AI Race is creating the next materials supercycle. Every AI fab, robot factory, and datacenter needs chips, copper, lithium, and rare earths. Track the supply chain ETFs (SMH, BOTZ, COPX, LIT, REMX) and use macro regime data to time your entry.",
  keywords: "AI investing, robotics ETF, semiconductor ETF, copper ETF, lithium ETF, rare earth ETF, SMH, BOTZ, COPX, LIT, REMX, ARKQ, AIQ, macro regime, Terafab, supply chain investing, materials supercycle, AI race",
  openGraph: {
    title: "Macro World View — The AI Race Supply Chain",
    description: "The AI Race is creating the next materials supercycle. Track supply chain ETFs and use macro regimes to time your entry.",
    url: "https://macroworldview.com",
    siteName: "Macro World View",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Macro World View — The AI Race Supply Chain",
    description: "The AI Race is creating the next materials supercycle. Track supply chain ETFs and use macro regimes to time your entry.",
  },
  metadataBase: new URL("https://macroworldview.com"),
  alternates: {
    canonical: "https://macroworldview.com",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistMono.variable}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "w7zzb5tje2");`,
          }}
        />
      </head>
      <body className="font-mono antialiased">
        <ModeProvider>{children}</ModeProvider>
      </body>
    </html>
  );
}
