/**
 * Universal WhatConverts phone-number synchronisation utility.
 *
 * WhatConverts (WC) may only swap ONE `<a href="tel:...">` on the page.
 * This module detects which number WC swapped-in and propagates it to
 * every other tel link and plain-text phone occurrence in the DOM.
 *
 * Detection is fully dynamic — no phone number is hardcoded.  The
 * "original" number is determined by majority-vote across all tel links;
 * any tel link showing a *different* number is the WC tracking number.
 */

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

/** Extract raw digits from a string (strips everything except 0-9). */
function rawDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Given a 10-digit US phone string like "4045551234", return an array of
 * common display formats so we can find them in plain text.
 *
 * For non-10-digit numbers we return only the raw digits as a single variant.
 */
function formatPhoneVariants(digits: string): string[] {
  if (digits.length !== 10) {
    return [digits];
  }
  const a = digits.slice(0, 3);
  const b = digits.slice(3, 6);
  const c = digits.slice(6);
  return [
    `${a}-${b}-${c}`,       // 404-555-1234
    `(${a}) ${b}-${c}`,     // (404) 555-1234
    `${a}.${b}.${c}`,       // 404.555.1234
    `${a} ${b} ${c}`,       // 404 555 1234
    digits,                  // 4045551234
  ];
}

/**
 * Format a 10-digit string into the site's primary display format (XXX-XXX-XXXX).
 * Falls back to the raw digits for non-10-digit numbers.
 */
function primaryFormat(digits: string): string {
  if (digits.length !== 10) return digits;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/**
 * Safely replace phone text inside a tel-anchor element.
 *
 * Phone links often have deeply nested markup (e.g.
 * `<a><div><div><svg/></div><div><h4/><p>404-555-5555</p></div></div></a>`).
 * Setting `.textContent` on the anchor would destroy all children.
 *
 * Three-tier approach:
 * 1. Check `<span>` children for phone text
 * 2. Check direct text nodes of the anchor
 * 3. Fallback: TreeWalker over ALL descendant Text nodes
 */
function replacePhoneTextInElement(
  el: HTMLElement,
  originalVariants: string[],
  swappedFormatted: string,
): void {
  // Tier 1 — <span> children
  const spans = el.querySelectorAll("span");
  for (const span of spans) {
    for (const variant of originalVariants) {
      if (span.textContent?.includes(variant)) {
        span.textContent = span.textContent.replace(variant, swappedFormatted);
        return;
      }
    }
  }

  // Tier 2 — direct text nodes of the anchor
  for (const child of el.childNodes) {
    if (child.nodeType === Node.TEXT_NODE && child.textContent) {
      for (const variant of originalVariants) {
        if (child.textContent.includes(variant)) {
          child.textContent = child.textContent.replace(variant, swappedFormatted);
          return;
        }
      }
    }
  }

  // Tier 3 — TreeWalker fallback: walk ALL descendant text nodes
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    if (!node.textContent) continue;
    for (const variant of originalVariants) {
      if (node.textContent.includes(variant)) {
        node.textContent = node.textContent.replace(variant, swappedFormatted);
        return; // one replacement per anchor is enough
      }
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Core sync function                                                 */
/* ------------------------------------------------------------------ */

/**
 * Scan every `<a href="tel:...">` on the page.  If WhatConverts has
 * swapped at least one link to a tracking number, propagate that number
 * to all remaining tel links and plain-text occurrences.
 *
 * @returns `true` if any DOM changes were made.
 */
export function syncPhoneNumbersNow(): boolean {
  try {
    const telLinks = document.querySelectorAll<HTMLAnchorElement>('a[href^="tel:"]');
    if (telLinks.length === 0) return false;

    // 1. Count occurrences of each unique phone number (raw digits)
    const counts = new Map<string, number>();
    for (const link of telLinks) {
      const digits = rawDigits(link.href);
      if (!digits) continue;
      counts.set(digits, (counts.get(digits) ?? 0) + 1);
    }

    if (counts.size < 2) {
      // All tel links show the same number (or none) — WC hasn't swapped
      // anything yet, or it swapped ALL of them. Either way, nothing to do.
      return false;
    }

    // 2. Majority = original number; minority = swapped (tracking) number
    let originalDigits = "";
    let swappedDigits = "";
    let maxCount = 0;

    for (const [digits, count] of counts) {
      if (count > maxCount) {
        // Demote previous leader to "swapped"
        if (originalDigits) swappedDigits = originalDigits;
        originalDigits = digits;
        maxCount = count;
      } else {
        swappedDigits = digits;
      }
    }

    if (!originalDigits || !swappedDigits) return false;

    // 3. Build formatted variants of the original number for matching
    const originalVariants = formatPhoneVariants(originalDigits);
    const swappedFormatted = primaryFormat(swappedDigits);

    let changed = false;

    // 4. Update tel links still showing the original number
    for (const link of telLinks) {
      const linkDigits = rawDigits(link.href);
      if (linkDigits === originalDigits) {
        link.href = `tel:${swappedDigits}`;
        replacePhoneTextInElement(link, originalVariants, swappedFormatted);
        changed = true;
      }
    }

    // 5. Walk all text nodes in <body> to replace plain-text phone occurrences
    //    (skip tel anchors — those were handled above)
    const processedAnchors = new Set<Node>(telLinks);

    const bodyWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let textNode: Text | null;
    while ((textNode = bodyWalker.nextNode() as Text | null)) {
      if (!textNode.textContent) continue;

      // Skip if this text node is inside a tel anchor we already processed
      let insideTelAnchor = false;
      let parent: Node | null = textNode.parentNode;
      while (parent && parent !== document.body) {
        if (processedAnchors.has(parent)) {
          insideTelAnchor = true;
          break;
        }
        parent = parent.parentNode;
      }
      if (insideTelAnchor) continue;

      for (const variant of originalVariants) {
        if (textNode.textContent.includes(variant)) {
          textNode.textContent = textNode.textContent.replace(variant, swappedFormatted);
          changed = true;
        }
      }
    }

    return changed;
  } catch {
    // Never throw — fail silently
    return false;
  }
}

/* ------------------------------------------------------------------ */
/*  Polling loop                                                       */
/* ------------------------------------------------------------------ */

let pollingTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Start a 250 ms polling loop that runs `syncPhoneNumbersNow()` for up
 * to 15 seconds.  Stops early after 3 consecutive no-change passes.
 *
 * Safe for re-invocation — cancels any previous loop first.
 */
export function startUniversalPhoneSync(): void {
  try {
    // Cancel any in-flight loop
    if (pollingTimer !== null) {
      clearInterval(pollingTimer);
      pollingTimer = null;
    }

    const MAX_ITERATIONS = 60; // 60 × 250ms = 15s
    let iterations = 0;
    let consecutiveNoChange = 0;

    pollingTimer = setInterval(() => {
      iterations++;
      try {
        const didChange = syncPhoneNumbersNow();
        consecutiveNoChange = didChange ? 0 : consecutiveNoChange + 1;
      } catch {
        consecutiveNoChange++;
      }

      if (iterations >= MAX_ITERATIONS || consecutiveNoChange >= 3) {
        if (pollingTimer !== null) {
          clearInterval(pollingTimer);
          pollingTimer = null;
        }
      }
    }, 250);
  } catch {
    // Silent
  }
}
