import Welcome from "@/components/Welcome";
import RegimeIndicator from "@/components/RegimeIndicator";
import AssetPerformance from "@/components/AssetPerformance";
import PortfolioAllocation from "@/components/PortfolioAllocation";
import UcitsMapping from "@/components/UcitsMapping";
import ValueScanner from "@/components/ValueScanner";
import HowToUse from "@/components/HowToUse";
import WeeklyCalendar from "@/components/WeeklyCalendar";
import RegimeTriggers from "@/components/RegimeTriggers";
import TransitionOutlook from "@/components/TransitionOutlook";
import RegimePlaybook from "@/components/RegimePlaybook";
import RegimeHistory from "@/components/RegimeHistory";
import Newsletter from "@/components/Newsletter";
import ComingSoon from "@/components/ComingSoon";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Welcome />

      <div className="border-t border-[#181818]" />
      <RegimeIndicator />

      <div className="border-t border-[#181818]" />
      <AssetPerformance />

      <div className="border-t border-[#181818]" />
      <PortfolioAllocation />
      <UcitsMapping />

      <div className="border-t border-[#181818]" />
      <ValueScanner />

      <div className="border-t border-[#181818]" />
      <WeeklyCalendar />

      <div className="border-t border-[#181818]" />
      <RegimeTriggers />

      <div className="border-t border-[#181818]" />
      <TransitionOutlook />

      <div className="border-t border-[#181818]" />
      <RegimePlaybook />

      <div className="border-t border-[#181818]" />
      <HowToUse />

      <div className="border-t border-[#181818]" />
      <RegimeHistory />

      <div className="border-t border-[#181818]" />
      <Newsletter />

      <div className="border-t border-[#181818]" />
      <ComingSoon />

      {/* Footer */}
      <footer className="px-4 py-8 text-center border-t border-[#181818]">
        <p className="text-xs text-[#555]">
          Macro Pulse — Ray Dalio&apos;s four-season framework
        </p>
        <p className="text-xs text-[#333] mt-2 max-w-xl mx-auto">
          This website is for educational and informational purposes only. Nothing on this site constitutes personalised financial advice. All analysis is generated systematically from public economic data. Past performance does not guarantee future results.
        </p>
        <div className="flex gap-4 justify-center mt-3">
          <a href="/disclaimer" className="text-xs text-[#888] hover:text-[#e0e0e0] underline underline-offset-2">Disclaimer</a>
          <a href="/terms" className="text-xs text-[#888] hover:text-[#e0e0e0] underline underline-offset-2">Terms of Service</a>
        </div>
        <p className="text-xs text-[#555] mt-4">
          Built by <em>Lucas Rodrigues</em> — <a href="https://www.linkedin.com/in/lucas-rodrigues-27a51b1a3/" target="_blank" rel="noopener noreferrer" className="hover:text-[#888] underline underline-offset-2">follow along on LinkedIn</a>
        </p>
      </footer>
    </main>
  );
}
