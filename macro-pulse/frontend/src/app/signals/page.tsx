import Nav from "@/components/Nav";
import MarketContext from "@/components/MarketContext";
import SubscribeForm from "@/components/SubscribeForm";

export default function SignalsPage() {
  return (
    <main className="min-h-screen">
      <Nav />

      <section className="px-4 pt-16 pb-6 max-w-3xl mx-auto text-center">
        <h1 className="text-xl sm:text-2xl text-[#e0e0e0] font-bold mb-2">Signal Dashboard</h1>
        <p className="text-xs text-[#555] max-w-lg mx-auto">
          Live macro signals driving the gold → growth rotation strategy. Updated daily from FRED, yfinance, and cross-asset internals.
        </p>
      </section>

      <MarketContext />

      <section className="px-4 py-8 max-w-3xl mx-auto text-center">
        <SubscribeForm
          source="signals"
          waitlistFeature="eventAlerts"
          title="Get notified when signals shift"
          description="We send an alert when these signals cross a threshold — not on a schedule."
          buttonLabel="Subscribe"
        />
      </section>
    </main>
  );
}
