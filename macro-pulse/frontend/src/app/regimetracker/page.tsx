import Welcome from "@/components/Welcome";
import RegimeIndicator from "@/components/RegimeIndicator";
import AssetPerformance from "@/components/AssetPerformance";
import PortfolioAllocation from "@/components/PortfolioAllocation";
import UcitsMapping from "@/components/UcitsMapping";
import WeeklyCalendar from "@/components/WeeklyCalendar";
import RegimeTriggers from "@/components/RegimeTriggers";
import TransitionOutlook from "@/components/TransitionOutlook";
import RegimeHistory from "@/components/RegimeHistory";
import WorldOrderPosition from "@/components/WorldOrderPosition";
import Nav from "@/components/Nav";
import { usStrategicCards } from "@/lib/usOverextensionData";

export default function RegimeTracker() {
  return (
    <main className="min-h-screen">
      <Nav />
      <Welcome />

      <div className="border-t border-[#181818]" />
      <RegimeIndicator />

      <div className="border-t border-[#181818]" />
      <AssetPerformance />

      <div className="border-t border-[#181818]" />
      <PortfolioAllocation />
      <UcitsMapping />

      <div className="border-t border-[#181818]" />
      <WeeklyCalendar />

      <div className="border-t border-[#181818]" />
      <RegimeTriggers />

      <div className="border-t border-[#181818]" />
      <TransitionOutlook />

      <div className="border-t border-[#181818]" />
      <WorldOrderPosition
        title="US in the World Order Transition"
        subtitle="Four dimensions of America's position as the declining incumbent power"
        cards={usStrategicCards}
        accent="#f97316"
        chatContext="US position in Ray Dalio's world order transition. Covers military overextension (750+ bases, 3 active theaters + Hormuz), dollar reserve status erosion (58% from 72%), debt trajectory ($36.2T, interest > defence spending), and internal polarisation. The US is in Stage 5 of Dalio's big cycle — great power conflict."
        chatSuggestions={[
          "How does the Hormuz closure fit Dalio's framework?",
          "Is the dollar losing reserve status?",
          "What historical empires show similar patterns?",
        ]}
      />

      <div className="border-t border-[#181818]" />
      <RegimeHistory />

      {/* Footer */}
      <footer className="px-4 py-8 text-center border-t border-[#181818]">
        <p className="text-xs text-[#555]">
          World Order View — Economic regime tracker
        </p>
        <p className="text-xs text-[#333] mt-2 max-w-xl mx-auto">
          This website is for educational and informational purposes only. Nothing on this site constitutes personalised financial advice. All analysis is generated systematically from public economic data. Past performance does not guarantee future results.
        </p>
        <div className="flex gap-4 justify-center mt-3">
          <a href="/disclaimer" className="text-xs text-[#888] hover:text-[#e0e0e0] underline underline-offset-2">Disclaimer</a>
          <a href="/terms" className="text-xs text-[#888] hover:text-[#e0e0e0] underline underline-offset-2">Terms of Service</a>
        </div>
        <p className="text-xs text-[#555] mt-4">
          Built by Lucas Rodrigues — turning economic data into investment signals. <a href="https://www.linkedin.com/in/lucas-rodrigues-27a51b1a3/" target="_blank" rel="noopener noreferrer" className="hover:text-[#888] underline underline-offset-2">LinkedIn</a>
        </p>
      </footer>
    </main>
  );
}
