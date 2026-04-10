import { apiUrl } from "./api";

export type SubscribeResult = {
  ok: boolean;
  message: string;
};

/**
 * Submit an email to /api/subscribe and return an honest result.
 *
 * Never lies: only returns ok=true if the backend confirmed durable persistence
 * (HTTP 200). HTTP 202 means degraded mode (file fallback) — caller should still
 * treat that as "saved" but is welcome to nudge the user. Anything else is an
 * error and the caller MUST surface it.
 */
export async function subscribeEmail(payload: {
  email: string;
  weeklyPulse?: boolean;
  eventAlerts?: boolean;
  regimeAlerts?: boolean;
  waitlistFeatures?: string[];
}): Promise<SubscribeResult> {
  let res: Response;
  try {
    res = await fetch(apiUrl("/api/subscribe"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    return {
      ok: false,
      message: "Network error — please check your connection and try again.",
    };
  }

  let body: { ok?: boolean; message?: string; error?: string } = {};
  try {
    body = await res.json();
  } catch {
    // Backend returned non-JSON
  }

  // 200 = persisted to Resend (durable). 202 = degraded but saved.
  if (res.status === 200 || res.status === 202) {
    return {
      ok: true,
      message: body.message || "Subscribed. First issue arrives next Tuesday.",
    };
  }

  if (res.status === 422) {
    return {
      ok: false,
      message: body.error || "Please enter a valid email address.",
    };
  }

  // 502 or anything else — real failure
  return {
    ok: false,
    message:
      body.message ||
      body.error ||
      "We couldn't save your email right now. Please try again in a moment.",
  };
}
