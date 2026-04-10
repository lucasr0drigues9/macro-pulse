"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Nav from "@/components/Nav";
import { confirmReceipt } from "@/lib/subscribe";

type Status = "confirming" | "confirmed" | "missing_params";

function ConfirmedInner() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const source = searchParams.get("source") || "";
  const [status, setStatus] = useState<Status>("confirming");

  useEffect(() => {
    if (!email) {
      setStatus("missing_params");
      return;
    }
    // Fire the confirmation ping (best-effort — we always show success since
    // the user IS subscribed regardless of whether this log write succeeds).
    confirmReceipt(email, source).finally(() => setStatus("confirmed"));
  }, [email, source]);

  return (
    <main className="min-h-screen">
      <Nav />
      <section className="px-4 pt-24 pb-12 max-w-xl mx-auto text-center">
        {status === "confirming" && (
          <div className="py-12">
            <div className="text-sm text-[#555]">Confirming…</div>
          </div>
        )}

        {status === "confirmed" && (
          <div className="p-8 rounded-lg bg-[#111] border border-[#222]">
            <div className="text-5xl mb-4">✓</div>
            <h1 className="text-2xl font-bold text-[#22c55e] mb-3">
              You&apos;re all set
            </h1>
            <p className="text-sm text-[#888] mb-2 leading-relaxed">
              {email && (
                <>
                  Thanks for confirming you received the welcome email at{" "}
                  <b className="text-[#e0e0e0]">{email}</b>.
                </>
              )}
            </p>
            <p className="text-xs text-[#555] mb-6 leading-relaxed">
              This tells us our delivery pipeline is healthy, so future alerts
              will land in your inbox instead of spam. We&apos;ll only email
              when something matters.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 rounded bg-[#222] text-sm text-[#e0e0e0] hover:bg-[#333] transition-colors"
            >
              Back to Macro Pulse →
            </Link>
          </div>
        )}

        {status === "missing_params" && (
          <div className="p-8 rounded-lg bg-[#111] border border-[#222]">
            <h1 className="text-lg font-bold text-[#e0e0e0] mb-2">
              Missing confirmation details
            </h1>
            <p className="text-sm text-[#888] mb-6">
              This link doesn&apos;t have the information we need to confirm
              your subscription. If you received a welcome email, please click
              the button inside it directly. If you think something is wrong,
              email{" "}
              <a
                href="mailto:alerts@macro-pulse.io"
                className="text-[#e0e0e0] underline underline-offset-2"
              >
                alerts@macro-pulse.io
              </a>
              .
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 rounded bg-[#222] text-sm text-[#e0e0e0] hover:bg-[#333] transition-colors"
            >
              Back to Macro Pulse →
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

export default function ConfirmedPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen">
          <Nav />
          <section className="px-4 pt-24 pb-12 max-w-xl mx-auto text-center">
            <div className="text-sm text-[#555]">Loading…</div>
          </section>
        </main>
      }
    >
      <ConfirmedInner />
    </Suspense>
  );
}
