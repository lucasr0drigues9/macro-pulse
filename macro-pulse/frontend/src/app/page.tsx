import RegimeIndicator from "@/components/RegimeIndicator";
import AssetPerformance from "@/components/AssetPerformance";
import PortfolioAllocation from "@/components/PortfolioAllocation";
import WeeklyCalendar from "@/components/WeeklyCalendar";
import RegimeTriggers from "@/components/RegimeTriggers";
import RegimePlaybook from "@/components/RegimePlaybook";
import RegimeHistory from "@/components/RegimeHistory";
import Newsletter from "@/components/Newsletter";
import ComingSoon from "@/components/ComingSoon";

export default function Home() {
  return (
    <main className="min-h-screen">
      <RegimeIndicator />

      <div className="border-t border-[#181818]" />
      <AssetPerformance />

      <div className="border-t border-[#181818]" />
      <PortfolioAllocation />

      <div className="border-t border-[#181818]" />
      <WeeklyCalendar />

      <div className="border-t border-[#181818]" />
      <RegimeTriggers />

      <div className="border-t border-[#181818]" />
      <RegimePlaybook />

      <div className="border-t border-[#181818]" />
      <RegimeHistory />

      <div className="border-t border-[#181818]" />
      <Newsletter />

      <div className="border-t border-[#181818]" />
      <ComingSoon />

      {/* Footer */}
      <footer className="px-4 py-8 text-center border-t border-[#181818]">
        <p className="text-xs text-[#333]">
          Macro Pulse — Built on Ray Dalio&apos;s four-season framework
        </p>
        <p className="text-xs text-[#222] mt-1">
          This is a systematic framework output, not personalised financial advice.
        </p>
      </footer>
    </main>
  );
}
