/**
 * WhatConverts Dynamic Number Insertion (DNI) refresh utility for SPAs.
 */

declare global {
  interface Window {
    _wcq?: Array<Record<string, unknown>>;
    _wci?: { run?: () => void };
    WhatConverts?: { track?: () => void };
  }
}

const THROTTLE_MS = 500;
let lastCallTs = 0;
let scheduledTimers: ReturnType<typeof setTimeout>[] = [];

function runWhatConvertsApis() {
  let didTrigger = false;

  try {
    if (typeof window._wci?.run === "function") {
      window._wci.run();
      didTrigger = true;
    }
  } catch {
    // Silent
  }

  try {
    if (typeof window.WhatConverts?.track === "function") {
      window.WhatConverts.track();
      didTrigger = true;
    }
  } catch {
    // Silent
  }

  try {
    if (Array.isArray(window._wcq)) {
      window._wcq.push({
        event: "pageview",
        path: window.location.pathname,
        href: window.location.href,
      });
      didTrigger = true;
    }
  } catch {
    // Silent
  }

  return didTrigger;
}

function rerunWhatConvertsScripts() {
  try {
    const originals = Array.from(
      document.querySelectorAll<HTMLScriptElement>(
        'script[data-whatconverts-script="true"], script[src*="whatconverts"]',
      ),
    );

    if (originals.length === 0) {
      return;
    }

    document
      .querySelectorAll("script[data-wc-dni-copy]")
      .forEach((element) => element.parentNode?.removeChild(element));

    originals.forEach((original, index) => {
      const clone = document.createElement("script");
      clone.async = true;
      clone.setAttribute("data-wc-dni-copy", String(index));

      if (original.src) {
        clone.src = original.src;
      } else if (original.textContent) {
        clone.textContent = original.textContent;
      } else {
        return;
      }

      document.head.appendChild(clone);
    });
  } catch {
    // Silent
  }
}

export function refreshWhatConvertsDni(
  reason: string,
  opts?: { force?: boolean },
): void {
  const now = Date.now();

  if (!opts?.force && now - lastCallTs < THROTTLE_MS) {
    return;
  }

  lastCallTs = now;

  const didTrigger = runWhatConvertsApis();

  try {
    window.dispatchEvent(
      new CustomEvent("whatconverts:refresh", {
        detail: { reason, path: window.location.pathname },
      }),
    );
  } catch {
    // Silent
  }

  if (!didTrigger) {
    rerunWhatConvertsScripts();
  }
}

export function notifyWhatConvertsLead(formName: string): void {
  try {
    if (Array.isArray(window._wcq)) {
      window._wcq.push({
        event: "form_submit",
        form_name: formName,
        path: window.location.pathname,
        href: window.location.href,
      });
    }
  } catch {
    // Silent
  }

  refreshWhatConvertsDni(`form-submit-${formName}`, { force: true });

  try {
    window.dispatchEvent(
      new CustomEvent("whatconverts:lead", {
        detail: {
          formName,
          path: window.location.pathname,
          href: window.location.href,
        },
      }),
    );
  } catch {
    // Silent
  }
}

export function cancelScheduledRefreshes(): void {
  for (const id of scheduledTimers) {
    clearTimeout(id);
  }
  scheduledTimers = [];
}

export function scheduleRefreshSeries(
  reason: string,
  callback?: () => void,
): void {
  cancelScheduledRefreshes();

  const delays = [0, 250, 1000, 2500, 5000, 8000, 12000];

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
