import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "US Regime Tracker — Entry Timing for the AI & Robotics Race | Macro World View",
  description: "Track the US macro regime (Stagflation, Goldilocks, Reflation, Deflation) using live FRED data and AI geopolitical analysis. The regime determines whether AI and robotics ETFs are discounted or extended.",
};

export default function RegimeTrackerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
