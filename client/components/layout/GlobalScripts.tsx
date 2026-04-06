import { useEffect } from "react";
import { useSiteSettings } from "@site/contexts/SiteSettingsContext";
import {
  refreshWhatConvertsDni,
  scheduleRefreshSeries,
} from "@site/lib/whatconvertsRefresh";
import {
  setKnownOriginalPhoneNumber,
  startUniversalPhoneSync,
} from "@site/lib/syncDniPhone";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

const MANAGED_KEY_ATTR = "data-global-script-key";
const MANAGED_SCOPE_ATTR = "data-global-script-scope";

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
}

function getManagedNode(key: string) {
  return (
    Array.from(document.querySelectorAll<HTMLElement>(`[${MANAGED_KEY_ATTR}]`)).find(
      (node) => node.getAttribute(MANAGED_KEY_ATTR) === key,
    ) ?? null
  );
}

function markManaged(node: HTMLElement, scope: string, key: string) {
  node.setAttribute(MANAGED_KEY_ATTR, key);
  node.setAttribute(MANAGED_SCOPE_ATTR, scope);
}

function isWhatConvertsScript(script: HTMLScriptElement) {
  const src = script.src.toLowerCase();
  const text = (script.textContent || "").toLowerCase();

  return (
    src.includes("whatconverts") ||
    text.includes("whatconverts") ||
    text.includes("_wcq") ||
    text.includes("_wci")
  );
}

function buildNodeKey(scope: string, node: Node, index: number) {
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element;
    const serialized =
      element.tagName === "SCRIPT"
        ? `${element.tagName}|${(element as HTMLScriptElement).src}|${element.textContent || ""}`
        : element.outerHTML;

    return `${scope}-${index}-${hashString(serialized)}`;
  }

  return `${scope}-${index}-${hashString(node.textContent || "")}`;
}

function syncManagedScope(scope: string, activeKeys: string[]) {
  const activeKeySet = new Set(activeKeys);

  document
    .querySelectorAll<HTMLElement>(`[${MANAGED_SCOPE_ATTR}="${scope}"]`)
    .forEach((node) => {
      const key = node.getAttribute(MANAGED_KEY_ATTR) || "";
      if (!activeKeySet.has(key)) {
        node.remove();
      }
    });
}

function injectHtmlSnippet(
  html: string,
  target: HTMLElement,
  scope: string,
  onWhatConvertsReady?: () => void,
): string[] {
  if (!html.trim()) {
    syncManagedScope(scope, []);
    return [];
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const sources = [
    ...Array.from(doc.head.childNodes),
    ...Array.from(doc.body.childNodes),
  ];
  const activeKeys: string[] = [];

  sources.forEach((node, index) => {
    if (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()) {
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const key = buildNodeKey(scope, node, index);
    activeKeys.push(key);

    if (getManagedNode(key)) {
      return;
    }

    if ((node as Element).tagName === "SCRIPT") {
      const original = node as HTMLScriptElement;
      const script = document.createElement("script");

      for (const attr of Array.from(original.attributes)) {
        script.setAttribute(attr.name, attr.value);
      }

      const isWhatConverts = isWhatConvertsScript(original);
      if (isWhatConverts) {
        script.setAttribute("data-whatconverts-script", "true");
      }

      if (script.src) {
        script.async = true;
        if (isWhatConverts && onWhatConvertsReady) {
          script.addEventListener("load", onWhatConvertsReady, { once: true });
        }
      }

      if (original.textContent) {
        script.textContent = original.textContent;
      }

      markManaged(script, scope, key);
      target.appendChild(script);

      if (isWhatConverts && !script.src && onWhatConvertsReady) {
        window.setTimeout(onWhatConvertsReady, 0);
      }

      return;
    }

    const clone = node.cloneNode(true) as HTMLElement;
    markManaged(clone, scope, key);
    target.appendChild(clone);
  });

  syncManagedScope(scope, activeKeys);
  return activeKeys;
}

function ensureScriptTag(key: string, scope: string, src: string) {
  if (!src) {
    syncManagedScope(scope, []);
    return;
  }

  if (!getManagedNode(key)) {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    markManaged(script, scope, key);
    document.head.appendChild(script);
  }

  syncManagedScope(scope, [key]);
}

function injectGA4(measurementId: string) {
  if (!measurementId) {
    syncManagedScope("ga4", []);
    return;
  }

  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== "function") {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    };
    window.gtag("js", new Date());
  }

  ensureScriptTag(
    `ga4-${measurementId}`,
    "ga4",
    `https://www.googletagmanager.com/gtag/js?id=${measurementId}`,
  );

  window.gtag("config", measurementId);
}

function injectGoogleAds(adsId: string, conversionLabel: string) {
  if (!adsId) {
    syncManagedScope("google-ads", []);
    return;
  }

  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== "function") {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    };
    window.gtag("js", new Date());
  }

  ensureScriptTag(
    `google-ads-${adsId}`,
    "google-ads",
    `https://www.googletagmanager.com/gtag/js?id=${adsId}`,
  );

  window.gtag("config", adsId);

  if (conversionLabel) {
    window.gtag("event", "conversion", {
      send_to: `${adsId}/${conversionLabel}`,
    });
  }
}

export default function GlobalScripts() {
  const { settings, isLoading } = useSiteSettings();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    setKnownOriginalPhoneNumber(settings.phoneNumber || settings.phoneDisplay);

    const triggerWhatConvertsRefresh = () => {
      scheduleRefreshSeries("whatconverts-ready", startUniversalPhoneSync);
      refreshWhatConvertsDni("whatconverts-ready", { force: true });
    };

    injectGA4(settings.ga4MeasurementId);
    injectGoogleAds(
      settings.googleAdsId,
      settings.googleAdsConversionLabel,
    );
    injectHtmlSnippet(
      settings.headScripts,
      document.head,
      "head-scripts",
      triggerWhatConvertsRefresh,
    );
    injectHtmlSnippet(
      settings.footerScripts,
      document.body,
      "footer-scripts",
      triggerWhatConvertsRefresh,
    );

    refreshWhatConvertsDni("scripts-injected", { force: true });
    scheduleRefreshSeries("scripts-injected", startUniversalPhoneSync);
  }, [
    isLoading,
    settings.phoneNumber,
    settings.phoneDisplay,
    settings.ga4MeasurementId,
    settings.googleAdsId,
    settings.googleAdsConversionLabel,
    settings.headScripts,
    settings.footerScripts,
  ]);

  return null;
}
