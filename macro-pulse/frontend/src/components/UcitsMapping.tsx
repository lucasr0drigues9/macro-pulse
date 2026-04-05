"use client";

import { useState } from "react";

const mapping = [
  { us: "SPY", ucits: "SXR8.DE", name: "iShares Core S&P 500 UCITS", exchange: "Xetra", tracking: "Good", regimes: "Reflation, Goldilocks" },
  { us: "QQQ", ucits: "CNDX.L", name: "iShares Nasdaq 100 UCITS", exchange: "London", tracking: "Excellent", regimes: "Goldilocks" },
  { us: "XLE", ucits: "IUES.L", name: "iShares S&P 500 Energy Sector UCITS", exchange: "London", tracking: "Good", regimes: "Stagflation, Reflation" },
  { us: "GLD", ucits: "IGLN.L", name: "iShares Physical Gold ETC", exchange: "London", tracking: "Excellent", regimes: "Stagflation, Deflation" },
  { us: "TLT", ucits: "DTLA.L", name: "iShares USD Treasury Bond 20+yr UCITS", exchange: "London", tracking: "Excellent", regimes: "Deflation" },
  { us: "FTEC", ucits: "XDWT.DE", name: "Xtrackers MSCI World IT UCITS", exchange: "Xetra", tracking: "Close match", regimes: "Goldilocks, Deflation" },
  { us: "ARKW", ucits: "XDWT.DE", name: "Xtrackers MSCI World IT UCITS", exchange: "Xetra", tracking: "Alternative", regimes: "Goldilocks" },
  { us: "ARKQ", ucits: "XDWT.DE", name: "Xtrackers MSCI World IT UCITS", exchange: "Xetra", tracking: "Alternative", regimes: "Goldilocks" },
  { us: "XLI", ucits: "IS3N.DE", name: "iShares S&P 500 Industrials UCITS", exchange: "Xetra", tracking: "Good", regimes: "Reflation" },
  { us: "BRK-B", ucits: "BRK-B", name: "Berkshire Hathaway (buy stock directly)", exchange: "NYSE", tracking: "Same", regimes: "Reflation" },
  { us: "DBC", ucits: "EXXY.DE", name: "iShares Diversified Commodity Swap UCITS", exchange: "Xetra", tracking: "Good", regimes: "Stagflation" },
  { us: "XLP", ucits: "IUCS.L", name: "iShares S&P 500 Consumer Staples UCITS", exchange: "London", tracking: "Good", regimes: "Stagflation" },
  { us: "XLU", ucits: "IUUS.L", name: "iShares S&P 500 Utilities UCITS", exchange: "London", tracking: "Good", regimes: "Stagflation" },
];

export default function UcitsMapping() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="px-4 py-8 max-w-5xl mx-auto">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#e0e0e0]">European Investors — UCITS Equivalents</h3>
            <p className="text-xs text-[#555]">EU/EEA regulated alternatives available on Nordnet and other European brokers</p>
          </div>
          <span className="text-[#555] text-sm">{expanded ? "−" : "+"}</span>
        </div>
      </button>

      {expanded && (
        <div className="mt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[#555] uppercase tracking-wider border-b border-[#222]">
                  <th className="text-left py-2 pr-2">US ETF</th>
                  <th className="text-left py-2 pr-2">UCITS</th>
                  <th className="text-left py-2 pr-2 hidden sm:table-cell">Name</th>
                  <th className="text-left py-2 pr-2 hidden sm:table-cell">Tracking</th>
                  <th className="text-left py-2">Regimes</th>
                </tr>
              </thead>
              <tbody>
                {mapping.map((row) => (
                  <tr key={`${row.us}-${row.ucits}`} className="border-b border-[#181818]">
                    <td className="py-2 pr-2 text-[#e0e0e0] font-bold">{row.us}</td>
                    <td className="py-2 pr-2 text-[#eab308]">{row.ucits}</td>
                    <td className="py-2 pr-2 text-[#888] hidden sm:table-cell">{row.name}</td>
                    <td className="py-2 pr-2 hidden sm:table-cell">
                      <span className={row.tracking === "Excellent" ? "text-[#22c55e]" : row.tracking === "Good" || row.tracking === "Same" ? "text-[#888]" : "text-[#eab308]"}>
                        {row.tracking}
                      </span>
                    </td>
                    <td className="py-2 text-[#555]">{row.regimes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 space-y-1">
            <p className="text-xs text-[#555]">
              ARKW and ARKQ have no UCITS equivalents. Use <span className="text-[#eab308]">XDWT.DE</span> (Xtrackers MSCI World IT) as a substitute — it holds the AI winners (Nvidia, Microsoft, Apple) and returned +10.1% avg in Goldilocks with 100% win rate.
            </p>
            <p className="text-xs text-[#555]">
              For ASK accounts on Nordnet, prefer accumulating (Acc) versions to avoid dividend tax drag. All listed ETFs are available on London Stock Exchange (.L) or Xetra (.DE).
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
