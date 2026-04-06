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

  const runRefreshCycle = (reason: string) => {
    refreshWhatConvertsDni(reason, { force: true });
    scheduleRefreshSeries(reason, startUniversalPhoneSync);
    startUniversalPhoneSync();
    syncPhoneNumbersNow();
  };

  /* ------ Trigger 1: Initial mount + window.load ------ */
  useEffect(() => {
    runRefreshCycle("initial");

    const onLoad = () => runRefreshCycle("window-load");
    const onPageShow = () => runRefreshCycle("pageshow");
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        runRefreshCycle("visibility-visible");
      }
    };

    if (document.readyState === "complete") {
      onLoad();
    } else {
      window.addEventListener("load", onLoad);
    }

    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.removeEventListener("load", onLoad);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisible);
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
    runRefreshCycle(`route-${location.pathname}`);

    const afterPaint = window.setTimeout(() => {
      runRefreshCycle(`route-postpaint-${location.pathname}`);
    }, 250);

    return () => {
      clearTimeout(afterPaint);
    };
  }, [location.pathname, location.search, location.key]);

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
          runRefreshCycle("dom-mutation");
        }
      }, 300);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["href"],
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
