/**
 * Universal WhatConverts phone-number synchronisation utility.
 */

const SWAPPED_PHONE_STORAGE_KEY = "whatconverts_swapped_phone_digits";

let knownOriginalPhoneDigits = "";
let knownSwappedPhoneDigits = "";

export function normalizePhoneDigits(value: string): string {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1);
  }

  return digits;
}

function readStoredSwappedPhoneDigits() {
  if (typeof window === "undefined") {
    return "";
  }

  return normalizePhoneDigits(
    sessionStorage.getItem(SWAPPED_PHONE_STORAGE_KEY) || "",
  );
}

function persistSwappedPhoneDigits(value: string) {
  const digits = normalizePhoneDigits(value);
  knownSwappedPhoneDigits = digits;

  if (typeof window === "undefined") {
    return;
  }

  if (digits) {
    sessionStorage.setItem(SWAPPED_PHONE_STORAGE_KEY, digits);
  } else {
    sessionStorage.removeItem(SWAPPED_PHONE_STORAGE_KEY);
  }
}

function getKnownSwappedPhoneDigits() {
  if (knownSwappedPhoneDigits) {
    return knownSwappedPhoneDigits;
  }

  knownSwappedPhoneDigits = readStoredSwappedPhoneDigits();
  return knownSwappedPhoneDigits;
}

export function setKnownOriginalPhoneNumber(value?: string): void {
  knownOriginalPhoneDigits = normalizePhoneDigits(value || "");

  const storedSwappedDigits = getKnownSwappedPhoneDigits();
  if (storedSwappedDigits && storedSwappedDigits === knownOriginalPhoneDigits) {
    persistSwappedPhoneDigits("");
  }
}

function formatPhoneVariants(digits: string): string[] {
  if (digits.length !== 10) {
    return [digits];
  }

  const a = digits.slice(0, 3);
  const b = digits.slice(3, 6);
  const c = digits.slice(6);

  return [
    `${a}-${b}-${c}`,
    `(${a}) ${b}-${c}`,
    `${a}.${b}.${c}`,
    `${a} ${b} ${c}`,
    digits,
  ];
}

function primaryFormat(digits: string): string {
  if (digits.length !== 10) {
    return digits;
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function replacePhoneTextInElement(
  el: HTMLElement,
  originalVariants: string[],
  swappedFormatted: string,
): void {
  const spans = el.querySelectorAll("span");
  for (const span of spans) {
    for (const variant of originalVariants) {
      if (span.textContent?.includes(variant)) {
        span.textContent = span.textContent.replace(variant, swappedFormatted);
        return;
      }
    }
  }

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

  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    if (!node.textContent) {
      continue;
    }

    for (const variant of originalVariants) {
      if (node.textContent.includes(variant)) {
        node.textContent = node.textContent.replace(variant, swappedFormatted);
        return;
      }
    }
  }
}

function getBaselineDigits(counts: Map<string, number>) {
  if (knownOriginalPhoneDigits) {
    return knownOriginalPhoneDigits;
  }

  let baselineDigits = "";
  let highestCount = 0;

  for (const [digits, count] of counts) {
    if (count > highestCount) {
      baselineDigits = digits;
      highestCount = count;
    }
  }

  return baselineDigits;
}

function getSwappedDigits(counts: Map<string, number>, baselineDigits: string) {
  let swappedDigits = "";
  let highestCount = 0;

  for (const [digits, count] of counts) {
    if (digits === baselineDigits) {
      continue;
    }

    if (count > highestCount) {
      swappedDigits = digits;
      highestCount = count;
    }
  }

  if (!swappedDigits && counts.size === 1) {
    const onlyDigits = Array.from(counts.keys())[0] || "";
    if (onlyDigits && onlyDigits !== baselineDigits) {
      return onlyDigits;
    }
  }

  return swappedDigits;
}

function resolveActiveSwappedDigits(
  counts: Map<string, number>,
  originalDigits: string,
) {
  const detectedSwappedDigits = getSwappedDigits(counts, originalDigits);

  if (detectedSwappedDigits && detectedSwappedDigits !== originalDigits) {
    persistSwappedPhoneDigits(detectedSwappedDigits);
    return detectedSwappedDigits;
  }

  const rememberedSwappedDigits = getKnownSwappedPhoneDigits();
  if (rememberedSwappedDigits && rememberedSwappedDigits !== originalDigits) {
    return rememberedSwappedDigits;
  }

  return "";
}

function applySwappedPhoneDigits(
  telLinks: NodeListOf<HTMLAnchorElement>,
  originalDigits: string,
  swappedDigits: string,
) {
  const originalVariants = Array.from(
    new Set([
      ...formatPhoneVariants(originalDigits),
      primaryFormat(originalDigits),
    ]),
  );
  const swappedFormatted = primaryFormat(swappedDigits);
  let changed = false;

  for (const link of telLinks) {
    const linkDigits = normalizePhoneDigits(link.href);
    if (linkDigits === originalDigits) {
      link.href = `tel:${swappedDigits}`;
      replacePhoneTextInElement(link, originalVariants, swappedFormatted);
      changed = true;
    }
  }

  const processedAnchors = new Set<Node>(telLinks);
  const bodyWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let textNode: Text | null;

  while ((textNode = bodyWalker.nextNode() as Text | null)) {
    if (!textNode.textContent) {
      continue;
    }

    let insideTelAnchor = false;
    let parent: Node | null = textNode.parentNode;
    while (parent && parent !== document.body) {
      if (processedAnchors.has(parent)) {
        insideTelAnchor = true;
        break;
      }
      parent = parent.parentNode;
    }

    if (insideTelAnchor) {
      continue;
    }

    for (const variant of originalVariants) {
      if (textNode.textContent.includes(variant)) {
        textNode.textContent = textNode.textContent.replace(
          variant,
          swappedFormatted,
        );
        changed = true;
      }
    }
  }

  return changed;
}

export function syncPhoneNumbersNow(): boolean {
  try {
    const telLinks = document.querySelectorAll<HTMLAnchorElement>('a[href^="tel:"]');
    if (telLinks.length === 0) {
      return false;
    }

    const counts = new Map<string, number>();
    for (const link of telLinks) {
      const digits = normalizePhoneDigits(link.href);
      if (!digits) {
        continue;
      }
      counts.set(digits, (counts.get(digits) ?? 0) + 1);
    }

    if (counts.size === 0) {
      return false;
    }

    const originalDigits = getBaselineDigits(counts);
    const swappedDigits = resolveActiveSwappedDigits(counts, originalDigits);

    if (!originalDigits || !swappedDigits || originalDigits === swappedDigits) {
      return false;
    }

    return applySwappedPhoneDigits(telLinks, originalDigits, swappedDigits);
  } catch {
    return false;
  }
}

let pollingTimer: ReturnType<typeof setInterval> | null = null;

export function startUniversalPhoneSync(): void {
  try {
    if (pollingTimer !== null) {
      clearInterval(pollingTimer);
      pollingTimer = null;
    }

    const INTERVAL_MS = 500;
    const MAX_ITERATIONS = 40;
    const MIN_ITERATIONS = 12;
    let iterations = 0;
    let consecutiveNoChange = 0;

    syncPhoneNumbersNow();

    pollingTimer = setInterval(() => {
      iterations += 1;
      try {
        const didChange = syncPhoneNumbersNow();
        consecutiveNoChange = didChange ? 0 : consecutiveNoChange + 1;
      } catch {
        consecutiveNoChange += 1;
      }

      if (
        iterations >= MAX_ITERATIONS ||
        (iterations >= MIN_ITERATIONS && consecutiveNoChange >= 6)
      ) {
        if (pollingTimer !== null) {
          clearInterval(pollingTimer);
          pollingTimer = null;
        }
      }
    }, INTERVAL_MS);
  } catch {
    // Silent
  }
}
