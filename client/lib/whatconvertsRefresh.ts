/**
 * WhatConverts Dynamic Number Insertion (DNI) refresh utility for SPAs.
 *
 * WhatConverts only scans phone numbers on full page loads by default.
 * This module re-triggers that scan after client-side route changes so
 * dynamically rendered phone numbers are still replaced with tracking numbers.
 *
 * The WC script itself is added by the site owner via Site Settings >
 * Analytics & Scripts > Head Scripts — this utility is a silent no-op
 * when the WC globals don't exist (not installed or ad-blocked).
 */

/* ---------- Global type extensions ---------- */

declare global {
  interface Window {
    /** WhatConverts command queue (official SPA API) */
    _wcq?: Array<Record<string, unknown>>;
    /** WhatConverts internal instance */
    _wci?: { run?: () => void };
    /** WhatConverts public namespace */
    WhatConverts?: { track?: () => void };
  }
}

/* ---------- Throttle state ---------- */

const THROTTLE_MS = 500;
let lastCallTs = 0;

/* ---------- Public API ---------- */

/**
 * Attempt to re-run the WhatConverts DNI scan.
 *
 * @param reason  Human-readable label used only for debug logging.
 * @param opts.force  When `true`, bypasses the 2-second throttle
 *                    (useful for the very first injection).
 */
export function refreshWhatConvertsDni(
  reason: string,
  opts?: { force?: boolean },
): void {
  const now = Date.now();

  if (!opts?.force && now - lastCallTs < THROTTLE_MS) {
    return; // Throttled — skip this call
  }

  lastCallTs = now;

  // Strategy 1 — Official SPA command queue
  try {
    if (Array.isArray(window._wcq)) {
      window._wcq.push({ event: "pageview", path: location.pathname });
      return;
    }
  } catch {
    // Silently continue to next strategy
  }

  // Strategy 2 — Direct rescan via internal instance or public namespace
  try {
    if (typeof window._wci?.run === "function") {
      window._wci.run();
      return;
    }
    if (typeof window.WhatConverts?.track === "function") {
      window.WhatConverts.track();
      return;
    }
  } catch {
    // Silently continue to next strategy
  }

  // Strategy 3 — Re-run the original WhatConverts script
  try {
    const original = document.querySelector<HTMLScriptElement>(
      'script[data-whatconverts-script="true"], script[src*="whatconverts"]',
    );
    if (!original) return;

    document
      .querySelectorAll("script[data-wc-dni-copy]")
      .forEach((el) => el.parentNode?.removeChild(el));

    const clone = document.createElement("script");
    clone.async = true;
    clone.setAttribute("data-wc-dni-copy", "true");

    if (original.src) {
      clone.src = original.src;
    } else if (original.textContent) {
      clone.textContent = original.textContent;
    } else {
      return;
    }

    document.head.appendChild(clone);
  } catch {
    // Silent — never break the app for analytics
  }
}

/* ---------- Staggered refresh series ---------- */

let scheduledTimers: ReturnType<typeof setTimeout>[] = [];

/**
 * Cancel all in-flight staggered refreshes.
 * Called before starting a new series so they don't stack on rapid
 * route changes.
 */
export function cancelScheduledRefreshes(): void {
  for (const id of scheduledTimers) {
    clearTimeout(id);
  }
  scheduledTimers = [];
}

/**
 * Fire a staggered series of WC refreshes at 100 ms, 500 ms, 1500 ms,
 * and 3000 ms.  After each refresh the optional `callback` is invoked
 * (e.g. `startUniversalPhoneSync`).
 *
 * Any previously scheduled series is cancelled first.
 */
export function scheduleRefreshSeries(
  reason: string,
  callback?: () => void,
): void {
  cancelScheduledRefreshes();

  const delays = [100, 500, 1500, 3000];

  for (const delay of delays) {
    const id = setTimeout(() => {
      refreshWhatConvertsDni(`${reason}-series-${delay}`, { force: true });
      try {
        callback?.();
      } catch {
        // Silent
      }
    }, delay);
    scheduledTimers.push(id);
  }
}
