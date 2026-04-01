export default function Disclaimer() {
  return (
    <main className="min-h-screen px-4 py-16 max-w-3xl mx-auto">
      <a href="/" className="text-xs text-[#555] hover:text-[#888]">← Back to dashboard</a>

      <h1 className="text-2xl font-bold text-[#e0e0e0] mt-8 mb-2">Disclaimer</h1>
      <p className="text-xs text-[#555] mb-8">Last updated: April 2026</p>

      <div className="space-y-8 text-sm text-[#888] leading-relaxed">
        <section>
          <h2 className="text-base font-bold text-[#e0e0e0] mb-2">What This Site Is</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>A systematic framework tool based on Ray Dalio&apos;s publicly documented macro research</li>
            <li>An educational resource explaining how economic regimes affect asset class performance</li>
            <li>A backtested historical analysis tool</li>
            <li>A public research publication</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#e0e0e0] mb-2">What This Site Is Not</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>A personalised financial advisory service</li>
            <li>A licensed investment manager</li>
            <li>A guaranteed return product</li>
            <li>A fiduciary service of any kind</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#e0e0e0] mb-2">How the Framework Works</h2>
          <p>
            This tool classifies the current economic environment into one of four regimes
            (Stagflation, Goldilocks, Reflation, Deflation) using Ray Dalio&apos;s four-season
            framework. It combines lagging economic data from the Federal Reserve (FRED) with
            a daily AI-powered geopolitical assessment to determine which regime best describes
            current conditions.
          </p>
          <p className="mt-2">
            The allocation suggestions are systematic outputs based on which asset classes have
            historically outperformed in each regime. They are not personalised to your financial
            situation, risk tolerance, tax status, or investment goals.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#e0e0e0] mb-2">Known Limitations</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>FRED economic data lags reality by 1-2 months — the framework compensates with a daily geopolitical layer, but transitions can still be detected late</li>
            <li>Regime smoothing requires 2 consecutive months to confirm — this prevents false signals but means the framework can be slow to react</li>
            <li>Backtested performance from 2007-2026 does not guarantee future results — market structure can change</li>
            <li>The geopolitical layer uses AI synthesis which can be wrong — it is one input among many, not an oracle</li>
            <li>Kelly Criterion position sizing assumes the future resembles the backtested past — it cannot account for unprecedented events</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#e0e0e0] mb-2">Data Sources</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>FRED</strong> — Federal Reserve Economic Data (GDP, CPI, PCE, PPI, unemployment, retail sales)</li>
            <li><strong>yfinance</strong> — Real-time and historical ETF prices</li>
            <li><strong>Anthropic Claude API</strong> — Geopolitical risk synthesis (daily, AI-generated)</li>
            <li><strong>SEC EDGAR</strong> — 13F superinvestor filings (quarterly, 45-day lag)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#e0e0e0] mb-2">Backtesting Methodology</h2>
          <p>
            All backtested results cover 52 regime periods from January 2007 to present. Returns are
            calculated using equal-weighted portfolios of regime-aligned ETFs versus the S&P 500 (SPY)
            benchmark. Results include transaction costs but not taxes. The framework&apos;s overall
            outperformance rate versus SPY is 44.2% — the worst performing period is always shown alongside
            the best to ensure full transparency.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#e0e0e0] mb-2">Regulatory Information</h2>
          <p>
            This site is not regulated by Finanstilsynet (the Financial Supervisory Authority of Norway)
            or any other financial regulatory body. It operates as an educational and informational platform.
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><a href="https://www.finanstilsynet.no/en/consumer/" className="text-[#eab308] hover:underline" target="_blank" rel="noopener noreferrer">Finanstilsynet — Consumer guidance</a></li>
            <li><a href="https://www.esma.europa.eu/investor-corner" className="text-[#eab308] hover:underline" target="_blank" rel="noopener noreferrer">EU MiFID II — Investor protection</a></li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#e0e0e0] mb-2">Contact</h2>
          <p>For questions about this site or its content, reach out via the GitHub repository.</p>
        </section>
      </div>
    </main>
  );
}
