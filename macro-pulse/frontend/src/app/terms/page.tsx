export default function Terms() {
  return (
    <main className="min-h-screen px-4 py-16 max-w-3xl mx-auto">
      <a href="/" className="text-xs text-[#555] hover:text-[#888]">← Back to dashboard</a>

      <h1 className="text-2xl font-bold text-[#e0e0e0] mt-8 mb-2">Terms of Service</h1>
      <p className="text-xs text-[#555] mb-8">Last updated: April 2026</p>

      <div className="space-y-8 text-sm text-[#888] leading-relaxed">
        <section>
          <h2 className="text-base font-bold text-[#e0e0e0] mb-2">1. Acceptance of Terms</h2>
          <p>
            By accessing and using Macro Pulse, you acknowledge that this is an educational and
            informational platform. All content, including regime classifications, allocation outputs,
            backtested performance data, and position sizing calculations, is provided for educational
            purposes only and does not constitute personalised financial advice.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#e0e0e0] mb-2">2. No Financial Advice</h2>
          <p>
            Nothing on this site constitutes a recommendation to buy, sell, or hold any security
            or financial instrument. The systematic framework outputs reflect historical patterns
            and current data conditions — they are not predictions, guarantees, or personalised
            investment recommendations. You are solely responsible for your own investment decisions.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#e0e0e0] mb-2">3. No Guarantee of Accuracy</h2>
          <p>
            While we strive for accuracy, data may be delayed, incomplete, or incorrect. FRED data
            lags by 1-2 months. Geopolitical synthesis is AI-generated and may contain errors.
            ETF prices may be delayed. We make no guarantee that any information on this site is
            accurate, complete, or current.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#e0e0e0] mb-2">4. Limitation of Liability</h2>
          <p>
            Macro Pulse and its creators shall not be liable for any losses, damages, or expenses
            arising from your use of this site or any investment decisions made based on its content.
            Past performance, whether backtested or live, does not guarantee future results.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#e0e0e0] mb-2">5. Backtested Performance</h2>
          <p>
            All backtested results are hypothetical and were not generated from actual trading.
            Backtested performance has inherent limitations including survivorship bias and the
            benefit of hindsight. The 52-period backtest from 2007 to 2026 reflects one specific
            methodology and should not be interpreted as indicative of future performance.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#e0e0e0] mb-2">6. User Data</h2>
          <p>
            The allocation calculator does not store any user data. Email addresses provided for
            alerts and newsletters are stored securely and used only for the purposes you selected.
            We do not sell or share your email address with third parties.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#e0e0e0] mb-2">7. Intellectual Property</h2>
          <p>
            The presentation, code, and analysis methodology of Macro Pulse are original work.
            The underlying macro framework is based on publicly documented research by Ray Dalio
            and Bridgewater Associates. ETF data is provided by public APIs.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#e0e0e0] mb-2">8. Your Responsibility</h2>
          <p>
            You are responsible for your own investment decisions. Before acting on any information
            from this site, consult a qualified financial advisor who understands your personal
            financial situation, risk tolerance, and investment goals.
          </p>
        </section>
      </div>
    </main>
  );
}
