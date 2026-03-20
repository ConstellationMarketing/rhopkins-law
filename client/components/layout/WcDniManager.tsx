import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  refreshWhatConvertsDni,
  scheduleRefreshSeries,
  cancelScheduledRefreshes,
} from "@site/lib/whatconvertsRefresh";
import {
  startUniversalPhoneSync,
  syncPhoneNumbersNow,
} from "@site/lib/syncDniPhone";

/* ------------------------------------------------------------------ */
/*  Exported helper for FAQ / accordion components                     */
/* ------------------------------------------------------------------ */

/**
 * Call this after revealing hidden content (e.g. FAQ toggle, accordion
 * expand) so newly-visible phone numbers get swapped by WhatConverts.
 */
export function triggerDniRefreshAfterReveal(): void {
  try {
    setTimeout(() => {
      refreshWhatConvertsDni("content-reveal", { force: true });
      syncPhoneNumbersNow();
    }, 100);
  } catch {
    // Silent
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Invisible component that orchestrates WhatConverts DNI refreshes
 * across four triggers:
 *
 * 1. Initial mount + window.load
 * 2. Route change (pathname)
 * 3. DOM mutation (new tel links appearing)
 * 4. Content reveal (via exported `triggerDniRefreshAfterReveal`)
 *
 * Must live inside `<BrowserRouter>`.
 */
export default function WcDniManager() {
  const location = useLocation();
  const isFirstMount = useRef(true);
  const mutationDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ------ Trigger 1: Initial mount + window.load ------ */
  useEffect(() => {
    scheduleRefreshSeries("initial", startUniversalPhoneSync);

    const onLoad = () => {
      refreshWhatConvertsDni("window-load", { force: true });
      startUniversalPhoneSync();
    };

    if (document.readyState === "complete") {
      // Already loaded — fire immediately
      onLoad();
    } else {
      window.addEventListener("load", onLoad);
    }

    return () => {
      window.removeEventListener("load", onLoad);
    };
  }, []);

  /* ------ Trigger 2: Route change ------ */
  useEffect(() => {
    // Skip the very first render (handled by initial mount above)
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    cancelScheduledRefreshes();
    scheduleRefreshSeries("route", startUniversalPhoneSync);
  }, [location.pathname]);

  /* ------ Trigger 3: DOM mutation — new tel links ------ */
  useEffect(() => {
    const observer = new MutationObserver(() => {
      // Debounce at 300ms to avoid excessive re-scans
      if (mutationDebounce.current) {
        clearTimeout(mutationDebounce.current);
      }

      mutationDebounce.current = setTimeout(() => {
        // Only act if there are tel links on the page
        const telLinks = document.querySelectorAll('a[href^="tel:"]');
        if (telLinks.length > 0) {
          refreshWhatConvertsDni("dom-mutation", { force: true });
          syncPhoneNumbersNow();
        }
      }, 300);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Observer stays alive for the full session — intentionally no disconnect
    return () => {
      observer.disconnect();
      if (mutationDebounce.current) {
        clearTimeout(mutationDebounce.current);
      }
    };
  }, []);

  return null;
}
