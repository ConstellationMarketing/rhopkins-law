import { useEffect, useRef } from "react";
import { useSiteSettings } from "@site/contexts/SiteSettingsContext";
import {
  refreshWhatConvertsDni,
  scheduleRefreshSeries,
} from "@site/lib/whatconvertsRefresh";
import { startUniversalPhoneSync } from "@site/lib/syncDniPhone";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
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

/**
 * Parses an HTML string and injects the resulting elements into the DOM.
 * - <script> elements are recreated (innerHTML assignment won't execute scripts)
 * - External scripts (with src) get async = true to prevent render blocking
 * - Non-script elements (meta, link, noscript, style) are cloned directly
 *
 * Returns the list of injected nodes so they can be removed on cleanup.
 */
function injectHtmlSnippet(
  html: string,
  target: HTMLElement,
  onWhatConvertsReady?: () => void,
): Node[] {
  if (!html.trim()) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const injected: Node[] = [];

  const sources = [
    ...Array.from(doc.head.childNodes),
    ...Array.from(doc.body.childNodes),
  ];

  for (const node of sources) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (!node.textContent?.trim()) continue;
    }

    if (
      node.nodeType === Node.ELEMENT_NODE &&
      (node as Element).tagName === "SCRIPT"
    ) {
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

      target.appendChild(script);
      injected.push(script);

      if (isWhatConverts && !script.src && onWhatConvertsReady) {
        window.setTimeout(onWhatConvertsReady, 0);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const clone = node.cloneNode(true);
      target.appendChild(clone);
      injected.push(clone);
    }
  }

  return injected;
}

function injectGA4(measurementId: string): Node[] {
  if (!measurementId) return [];
  if (typeof window.gtag === "function") return [];

  const injected: Node[] = [];
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", measurementId);

  const script = document.createElement("script");
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script.async = true;
  document.head.appendChild(script);
  injected.push(script);

  return injected;
}

function injectGoogleAds(
  adsId: string,
  conversionLabel: string,
): Node[] {
  if (!adsId) return [];

  const injected: Node[] = [];

  if (typeof window.gtag !== "function") {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    };
    window.gtag("js", new Date());

    const script = document.createElement("script");
    script.src = `https://www.googletagmanager.com/gtag/js?id=${adsId}`;
    script.async = true;
    document.head.appendChild(script);
    injected.push(script);
  }

  window.gtag("config", adsId);

  if (conversionLabel) {
    window.gtag("event", "conversion", {
      send_to: `${adsId}/${conversionLabel}`,
    });
  }

  return injected;
}

export default function GlobalScripts() {
  const { settings, isLoading } = useSiteSettings();
  const injectedRef = useRef<Node[]>([]);

  useEffect(() => {
    if (isLoading) return;

    const allInjected: Node[] = [];
    const triggerWhatConvertsRefresh = () => {
      scheduleRefreshSeries("whatconverts-ready", startUniversalPhoneSync);
      refreshWhatConvertsDni("whatconverts-ready", { force: true });
    };

    if (settings.ga4MeasurementId) {
      allInjected.push(...injectGA4(settings.ga4MeasurementId));
    }

    if (settings.googleAdsId) {
      allInjected.push(
        ...injectGoogleAds(
          settings.googleAdsId,
          settings.googleAdsConversionLabel,
        ),
      );
    }

    if (settings.headScripts) {
      allInjected.push(
        ...injectHtmlSnippet(
          settings.headScripts,
          document.head,
          triggerWhatConvertsRefresh,
        ),
      );
    }

    if (settings.footerScripts) {
      allInjected.push(
        ...injectHtmlSnippet(
          settings.footerScripts,
          document.body,
          triggerWhatConvertsRefresh,
        ),
      );
    }

    refreshWhatConvertsDni("scripts-injected", { force: true });
    scheduleRefreshSeries("scripts-injected", startUniversalPhoneSync);

    injectedRef.current = allInjected;

    return () => {
      for (const node of injectedRef.current) {
        node.parentNode?.removeChild(node);
      }
      injectedRef.current = [];
    };
  }, [
    isLoading,
    settings.ga4MeasurementId,
    settings.googleAdsId,
    settings.googleAdsConversionLabel,
    settings.headScripts,
    settings.footerScripts,
  ]);

  return null;
}
