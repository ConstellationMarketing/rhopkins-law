import { useEffect, useRef } from "react";
import { useSiteSettings } from "@site/contexts/SiteSettingsContext";
import { refreshWhatConvertsDni } from "@site/lib/whatconvertsRefresh";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
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
): Node[] {
  if (!html.trim()) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const injected: Node[] = [];

  // Process elements from both <head> and <body> of the parsed doc
  const sources = [
    ...Array.from(doc.head.childNodes),
    ...Array.from(doc.body.childNodes),
  ];

  for (const node of sources) {
    if (node.nodeType === Node.TEXT_NODE) {
      // Skip whitespace-only text nodes
      if (!node.textContent?.trim()) continue;
    }

    if (
      node.nodeType === Node.ELEMENT_NODE &&
      (node as Element).tagName === "SCRIPT"
    ) {
      const original = node as HTMLScriptElement;
      const script = document.createElement("script");

      // Copy all attributes
      for (const attr of Array.from(original.attributes)) {
        script.setAttribute(attr.name, attr.value);
      }

      // External scripts must be async to prevent blocking
      if (script.src) {
        script.async = true;
      }

      // Copy inline content
      if (original.textContent) {
        script.textContent = original.textContent;
      }

      target.appendChild(script);
      injected.push(script);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // Clone non-script elements (meta, link, noscript, style, etc.)
      const clone = node.cloneNode(true);
      target.appendChild(clone);
      injected.push(clone);
    }
  }

  return injected;
}

/**
 * Injects GA4 gtag.js if a measurement ID is configured.
 * Prevents double-injection by checking window.gtag.
 */
function injectGA4(measurementId: string): Node[] {
  if (!measurementId) return [];

  // Prevent double-injection
  if (typeof window.gtag === "function") return [];

  const injected: Node[] = [];

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", measurementId);

  // Load gtag.js script asynchronously
  const script = document.createElement("script");
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script.async = true;
  document.head.appendChild(script);
  injected.push(script);

  return injected;
}

/**
 * Injects Google Ads gtag conversion tracking if configured.
 * Reuses the existing gtag function if GA4 already set it up,
 * otherwise initializes it.
 */
function injectGoogleAds(
  adsId: string,
  conversionLabel: string,
): Node[] {
  if (!adsId) return [];

  const injected: Node[] = [];

  // If gtag isn't loaded yet (no GA4), load it via Google Ads tag
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

  // Configure Google Ads
  window.gtag("config", adsId);

  // If a conversion label is set, fire a conversion event
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

    // 1. GA4 auto-injection
    if (settings.ga4MeasurementId) {
      allInjected.push(...injectGA4(settings.ga4MeasurementId));
    }

    // 2. Google Ads conversion tracking
    if (settings.googleAdsId) {
      allInjected.push(
        ...injectGoogleAds(
          settings.googleAdsId,
          settings.googleAdsConversionLabel,
        ),
      );
    }

    // 3. Head scripts
    if (settings.headScripts) {
      allInjected.push(
        ...injectHtmlSnippet(settings.headScripts, document.head),
      );
    }

    // 4. Footer/body scripts
    if (settings.footerScripts) {
      allInjected.push(
        ...injectHtmlSnippet(settings.footerScripts, document.body),
      );
    }

    // 5. Trigger WhatConverts DNI scan after scripts are injected
    refreshWhatConvertsDni("head-scripts-injected", { force: true });

    injectedRef.current = allInjected;

    // Cleanup: remove all injected elements on unmount
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

  // This component renders nothing — it only produces side effects
  return null;
}
