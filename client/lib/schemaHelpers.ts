/**
 * JSON-LD Schema.org structured data helpers.
 *
 * Builds schema objects for common Schema.org structured data types,
 * auto-detects FAQ content, and handles flexible schema_type parsing
 * (string, JSON array string, or native array).
 */

import type { SiteSettings } from "@/lib/siteSettingsTypes";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface FaqItem {
  question: string;
  answer: string;
}

export interface SchemaInput {
  /** Page title (used as name / headline) */
  title: string;
  /** Page meta description */
  description: string;
  /** Full canonical URL of the page */
  url: string;
  /** OG / featured image URL */
  image?: string;
  /** Raw schema_type value from the CMS (string, JSON array, or array) */
  schemaType?: string | string[] | null;
  /** Custom overrides authored in the admin JSON editor */
  schemaData?: Record<string, unknown> | null;
  /** Structured page content — used to auto-detect FAQ items */
  pageContent?: unknown;
  /** Site-wide settings (phone, address, name, logo, socials) */
  siteSettings?: SiteSettings;
}

/* ------------------------------------------------------------------ */
/*  parseSchemaTypes                                                   */
/* ------------------------------------------------------------------ */

/**
 * Normalise the `schema_type` field into an array of type strings.
 *
 * Handles:
 *  - `null` / `undefined` → `[]`
 *  - A plain string like `"LocalBusiness"` → `["LocalBusiness"]`
 *  - A comma-separated string `"LocalBusiness,FAQPage"` → `["LocalBusiness","FAQPage"]`
 *  - A JSON array string `'["LocalBusiness","FAQPage"]'` → `["LocalBusiness","FAQPage"]`
 *  - A native string array → returned as-is
 */
export function parseSchemaTypes(
  raw: string | string[] | null | undefined,
): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((s) => s.trim()).filter(Boolean);

  // Try JSON parse first (handles '["A","B"]')
  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(String).map((s) => s.trim()).filter(Boolean);
      }
    } catch {
      // Fall through to comma split
    }
  }

  // Comma-separated or single value
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/* ------------------------------------------------------------------ */
/*  extractFaqItems                                                    */
/* ------------------------------------------------------------------ */

/**
 * Auto-detect FAQ question/answer pairs from structured page content.
 *
 * Looks for common patterns:
 *  - `content.faq.items` (home page)
 *  - `content.faqs` or `content.faqItems`
 *  - Any top-level array property whose objects have `question` + `answer` keys
 */
export function extractFaqItems(content: unknown): FaqItem[] {
  if (!content || typeof content !== "object") return [];

  const obj = content as Record<string, unknown>;

  // Strategy 1 — nested faq.items (home page pattern)
  // Skip if the FAQ section is explicitly disabled (e.g. practice area pages with faq.enabled = false)
  if (obj.faq && typeof obj.faq === "object") {
    const faq = obj.faq as Record<string, unknown>;
    if (faq.enabled !== false && Array.isArray(faq.items) && faq.items.length > 0) {
      const valid = faq.items.filter(isFaqShape);
      if (valid.length) return valid;
    }
  }

  // Strategy 2 — top-level faqs / faqItems array
  for (const key of ["faqs", "faqItems", "faq_items", "questions"]) {
    const val = obj[key];
    if (Array.isArray(val) && val.length > 0) {
      const valid = val.filter(isFaqShape);
      if (valid.length) return valid;
    }
  }

  // Strategy 3 — scan all top-level arrays for question/answer objects
  for (const val of Object.values(obj)) {
    if (Array.isArray(val) && val.length > 0 && val.every(isFaqShape)) {
      return val;
    }
  }

  return [];
}

function isFaqShape(item: unknown): item is FaqItem {
  if (!item || typeof item !== "object") return false;
  const o = item as Record<string, unknown>;
  return (
    typeof o.question === "string" &&
    o.question.length > 0 &&
    typeof o.answer === "string" &&
    o.answer.length > 0
  );
}

/* ------------------------------------------------------------------ */
/*  Schema builders                                                    */
/* ------------------------------------------------------------------ */

/** Strip HTML tags for plain-text schema values */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export function buildLocalBusinessSchema(
  input: SchemaInput,
): Record<string, unknown> {
  const s = input.siteSettings;
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: s?.siteName || input.title,
    url: input.url,
    description: input.description,
  };

  if (s?.phoneNumber) {
    schema.telephone = s.phoneDisplay || s.phoneNumber;
  }

  if (s?.addressLine1) {
    schema.address = {
      "@type": "PostalAddress",
      streetAddress: s.addressLine1,
      addressLocality: parseCity(s.addressLine2),
      addressRegion: parseState(s.addressLine2),
      postalCode: parseZip(s.addressLine2),
    };
  }

  if (s?.logoUrl) {
    schema.logo = s.logoUrl;
  }

  if (input.image) {
    schema.image = input.image;
  }

  const socialUrls = s?.socialLinks
    ?.filter((l) => l.enabled && l.url)
    .map((l) => l.url);
  if (socialUrls?.length) {
    schema.sameAs = socialUrls;
  }

  return schema;
}

export function buildAttorneySchema(
  input: SchemaInput,
): Record<string, unknown> {
  const s = input.siteSettings;
  return {
    "@context": "https://schema.org",
    "@type": "Attorney",
    name: s?.siteName || input.title,
    url: input.url,
    description: input.description,
    ...(s?.phoneNumber && {
      telephone: s.phoneDisplay || s.phoneNumber,
    }),
    ...(s?.addressLine1 && {
      address: {
        "@type": "PostalAddress",
        streetAddress: s.addressLine1,
        addressLocality: parseCity(s.addressLine2),
        addressRegion: parseState(s.addressLine2),
        postalCode: parseZip(s.addressLine2),
      },
    }),
    ...(s?.logoUrl && { logo: s.logoUrl }),
    ...(input.image && { image: input.image }),
  };
}

export function buildWebPageSchema(
  input: SchemaInput,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: input.title,
    description: input.description,
    url: input.url,
    ...(input.image && { image: input.image }),
    ...(input.siteSettings?.siteName && {
      isPartOf: {
        "@type": "WebSite",
        name: input.siteSettings.siteName,
        url: input.url.replace(/\/[^/]*$/, "/"),
      },
    }),
  };
}

export function buildFaqSchema(input: SchemaInput): Record<string, unknown> | null {
  const items = extractFaqItems(input.pageContent);
  if (!items.length) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: stripHtml(item.question),
      acceptedAnswer: {
        "@type": "Answer",
        text: stripHtml(item.answer),
      },
    })),
  };
}

/** Builds AboutPage or ContactPage schema (simple WebPage subtypes) */
function buildSimplePageSchema(
  type: string,
  input: SchemaInput,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": type,
    name: input.title,
    description: input.description,
    url: input.url,
    ...(input.image && { image: input.image }),
  };
}

/* ------------------------------------------------------------------ */
/*  buildAllSchemas — main entry point                                 */
/* ------------------------------------------------------------------ */

/**
 * Given the page's schema configuration and content, build an array
 * of JSON-LD objects ready for injection into `<head>`.
 *
 * Custom `schemaData` overrides are merged on top of auto-generated fields
 * for explicitly-requested types (custom values win).
 *
 * FAQPage is auto-injected whenever the page content contains detectable
 * FAQ items, even if the admin has not explicitly selected FAQPage in the
 * schema type selector.
 */
export function buildAllSchemas(input: SchemaInput): Record<string, unknown>[] {
  const types = parseSchemaTypes(input.schemaType);
  const schemas: Record<string, unknown>[] = [];

  // Process all explicitly requested schema types
  for (const type of types) {
    let schema: Record<string, unknown> | null = null;

    switch (type) {
      case "LocalBusiness":
      case "LegalService":
        schema = buildLocalBusinessSchema(input);
        if (type === "LegalService") {
          schema["@type"] = "LegalService";
        }
        break;
      case "Attorney":
        schema = buildAttorneySchema(input);
        break;
      case "WebPage":
        schema = buildWebPageSchema(input);
        break;
      case "FAQPage":
        schema = buildFaqSchema(input);
        break;
      case "AboutPage":
      case "ContactPage":
        schema = buildSimplePageSchema(type, input);
        break;
      default:
        // Unknown type — create a minimal schema
        schema = {
          "@context": "https://schema.org",
          "@type": type,
          name: input.title,
          url: input.url,
          description: input.description,
        };
        break;
    }

    if (schema) {
      // Merge custom overrides (admin JSON editor) on top
      if (input.schemaData && Object.keys(input.schemaData).length > 0) {
        Object.assign(schema, input.schemaData);
      }
      schemas.push(schema);
    }
  }

  // Auto-inject FAQPage when the page content has FAQ items and FAQPage
  // is not already in the explicitly-requested type list.
  // Custom schemaData overrides are intentionally NOT merged onto the
  // auto-injected block — it is always clean/auto.
  if (!types.includes("FAQPage") && input.pageContent) {
    const faqSchema = buildFaqSchema(input);
    if (faqSchema) {
      schemas.push(faqSchema);
    }
  }

  return schemas;
}

/**
 * Returns true when the page content contains detectable FAQ items.
 * Convenience helper for use in admin UI components.
 */
export function hasFaqContent(content: unknown): boolean {
  return extractFaqItems(content).length > 0;
}

/* ------------------------------------------------------------------ */
/*  Address parsing helpers                                            */
/* ------------------------------------------------------------------ */

/** Extract city from "City, State 00000" → "City" */
function parseCity(line?: string): string {
  if (!line) return "";
  const parts = line.split(",");
  return parts[0]?.trim() || "";
}

/** Extract state from "City, State 00000" → "State" */
function parseState(line?: string): string {
  if (!line) return "";
  const parts = line.split(",");
  if (parts.length < 2) return "";
  const stateZip = parts[1]?.trim() || "";
  return stateZip.replace(/\d+/g, "").trim();
}

/** Extract zip from "City, State 00000" → "00000" */
function parseZip(line?: string): string {
  if (!line) return "";
  const match = line.match(/\d{5}(-\d{4})?/);
  return match?.[0] || "";
}
