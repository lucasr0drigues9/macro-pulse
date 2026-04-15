import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Europe Tracker — ASML Monopoly & Defence Automation | Macro World View",
  description: "Europe holds the AI Race chokepoint: ASML's EUV lithography monopoly. Track the European regime and its impact on defence automation (EUAD), energy buildout, and supply chain ETFs.",
};

export default function EuropeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
