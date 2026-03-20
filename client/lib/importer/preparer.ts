// ============================================================================
// Content Preparation Utilities
// ============================================================================
//
// Utility module for content transformation. Provides:
// - prepareRecords(): full preparation pipeline (used by teach step)
// - splitOnH2(): H2-based content splitting
// - detectFaqPatterns(): FAQ structure detection
// - ensureHtml(): plain text → HTML paragraph conversion
// - extractFirstParagraph(): extract first <p> from HTML
// - extractFirstImage(): extract first <img> src from HTML
// - stripTags(): strip all HTML tags
// - quickValidateRecord(): lightweight per-record validation
// - reSplitSections(): re-split a practice page on H2 boundaries
// - resetToAutoPrepared(): reset a prepared record to auto state
//
// The recipe engine (recipeRules.ts, recipeEngine.ts) imports individual
// utilities from this module. The full prepareRecords() function is used
// by StepTeachRecipe to generate the initial "auto-prepared" output that
// the user then corrects.
// ============================================================================

import type {
  TemplateType,
  MappingConfig,
  SourceRecord,
  PreparedRecord,
  TransformedPracticePage,
  TransformedBlogPost,
  TransformedRecord,
  ValidationIssue,
} from "./types";
import { applyMapping, collectRepeaterData, slugify } from "./fieldMapping";
import { defaultPracticeAreaPageContent } from "@site/lib/cms/practiceAreaPageTypes";

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Prepare all source records into structured PreparedRecords.
 * Every record defaults to status "needs-review".
 *
 * Used by StepTeachRecipe to generate the initial auto-prepared output.
 */
export function prepareRecords(
  sourceRecords: SourceRecord[],
  mappingConfig: MappingConfig,
  templateType: TemplateType,
): PreparedRecord[] {
  return sourceRecords.map((source, index) => {
    const mapped = applyMapping(source, mappingConfig);

    const autoPrepared =
      templateType === "practice"
        ? preparePracticePage(mapped, source, mappingConfig)
        : prepareBlogPost(mapped);

    const current = structuredClone(autoPrepared);
    const { errors, warnings } = quickValidateRecord(current, templateType);

    return {
      sourceIndex: index,
      status: "needs-review" as const,
      autoPrepared,
      current,
      validationErrors: errors,
      validationWarnings: warnings,
    };
  });
}

// ---------------------------------------------------------------------------
// Practice Area Page Preparation
// ---------------------------------------------------------------------------

function preparePracticePage(
  mapped: Record<string, unknown>,
  sourceRecord: SourceRecord,
  config: MappingConfig,
): TransformedPracticePage {
  const title = String(mapped["title"] ?? "Untitled");
  const rawSlug = mapped["url_slug"]
    ? String(mapped["url_slug"])
    : slugify(title);
  const urlPath = `/practice-areas/${rawSlug}/`;

  let contentSections = collectRepeaterData(
    sourceRecord,
    "practice",
    "contentSections",
    config,
  );

  if (contentSections.length === 0 && mapped["contentSections.body"]) {
    const bodyHtml = ensureHtml(String(mapped["contentSections.body"]));
    contentSections = splitOnH2(bodyHtml).map((section) => ({
      body: section,
      image: "",
      imageAlt: "",
      imagePosition: "right",
    }));
  }

  if (contentSections.length === 0) {
    const bodyField = mapped["body"] ?? mapped["content"];
    if (bodyField) {
      const bodyHtml = ensureHtml(String(bodyField));
      contentSections = splitOnH2(bodyHtml).map((section) => ({
        body: section,
        image: "",
        imageAlt: "",
        imagePosition: "right",
      }));
    }
  }

  const normalizedSections = contentSections.map((section, idx) => ({
    body: ensureHtml(String(section.body ?? "")),
    image: String(section.image ?? ""),
    imageAlt: String(section.imageAlt ?? ""),
    imagePosition:
      (section.imagePosition as "left" | "right") ??
      (idx % 2 === 0 ? "right" : "left"),
    showCTAs: section.showCTAs !== false,
  }));

  let heroDescription = mapped["hero.description"]
    ? ensureHtml(String(mapped["hero.description"]))
    : "";

  if (!heroDescription && normalizedSections.length > 0) {
    heroDescription = extractFirstParagraph(normalizedSections[0].body);
  }

  let heroImage = mapped["hero.backgroundImage"]
    ? String(mapped["hero.backgroundImage"])
    : "";

  if (!heroImage && normalizedSections.length > 0) {
    heroImage = extractFirstImage(
      normalizedSections.map((s) => s.body).join(""),
    );
  }

  let faqItems = collectRepeaterData(
    sourceRecord,
    "practice",
    "faq.items",
    config,
  );

  if (faqItems.length === 0) {
    faqItems = detectFaqPatterns(
      normalizedSections.map((s) => s.body).join(""),
    );
  }

  const normalizedFaq = faqItems.map((item) => ({
    question: String(item.question ?? ""),
    answer: ensureHtml(String(item.answer ?? "")),
  }));

  const content: Record<string, unknown> = {
    hero: {
      sectionLabel: mapped["hero.sectionLabel"]
        ? String(mapped["hero.sectionLabel"])
        : defaultPracticeAreaPageContent.hero.sectionLabel,
      tagline: mapped["hero.tagline"]
        ? String(mapped["hero.tagline"])
        : title,
      description: heroDescription,
      backgroundImage: heroImage,
      backgroundImageAlt: mapped["hero.backgroundImageAlt"]
        ? String(mapped["hero.backgroundImageAlt"])
        : "",
    },
    socialProof: {
      mode: "awards" as const,
      testimonials: [],
      awards: { logos: [] },
    },
    contentSections:
      normalizedSections.length > 0
        ? normalizedSections
        : defaultPracticeAreaPageContent.contentSections,
    faq: {
      enabled: normalizedFaq.length > 0 || !!mapped["faq.heading"],
      heading: mapped["faq.heading"]
        ? String(mapped["faq.heading"])
        : normalizedFaq.length > 0
          ? "Frequently Asked Questions"
          : defaultPracticeAreaPageContent.faq.heading,
      description: mapped["faq.description"]
        ? String(mapped["faq.description"])
        : defaultPracticeAreaPageContent.faq.description,
      items:
        normalizedFaq.length > 0
          ? normalizedFaq
          : defaultPracticeAreaPageContent.faq.items,
    },
  };

  return {
    title,
    url_path: urlPath,
    page_type: "practice",
    content,
    meta_title: mapped["meta_title"]
      ? String(mapped["meta_title"])
      : title,
    meta_description: mapped["meta_description"]
      ? String(mapped["meta_description"])
      : undefined,
    canonical_url: mapped["canonical_url"]
      ? String(mapped["canonical_url"])
      : null,
    og_title: mapped["og_title"] ? String(mapped["og_title"]) : null,
    og_description: mapped["og_description"]
      ? String(mapped["og_description"])
      : null,
    og_image: mapped["og_image"] ? String(mapped["og_image"]) : null,
    noindex: mapped["noindex"] === true || mapped["noindex"] === "true",
    schema_type: null,
    schema_data: null,
    status: "draft",
  };
}

// ---------------------------------------------------------------------------
// Blog Post Preparation
// ---------------------------------------------------------------------------

function prepareBlogPost(
  mapped: Record<string, unknown>,
): TransformedBlogPost {
  const title = String(mapped["title"] ?? "Untitled");
  const slug = mapped["slug"] ? String(mapped["slug"]) : slugify(title);

  return {
    title,
    slug,
    excerpt: mapped["excerpt"] ? String(mapped["excerpt"]) : undefined,
    featured_image: mapped["featured_image"]
      ? String(mapped["featured_image"])
      : undefined,
    category: mapped["category"] ? String(mapped["category"]) : undefined,
    category_id: null,
    content: [],
    body: mapped["body"] ? ensureHtml(String(mapped["body"])) : undefined,
    meta_title: mapped["meta_title"]
      ? String(mapped["meta_title"])
      : title,
    meta_description: mapped["meta_description"]
      ? String(mapped["meta_description"])
      : mapped["excerpt"]
        ? String(mapped["excerpt"])
        : undefined,
    canonical_url: mapped["canonical_url"]
      ? String(mapped["canonical_url"])
      : null,
    og_title: mapped["og_title"] ? String(mapped["og_title"]) : null,
    og_description: mapped["og_description"]
      ? String(mapped["og_description"])
      : null,
    og_image: mapped["og_image"]
      ? String(mapped["og_image"])
      : mapped["featured_image"]
        ? String(mapped["featured_image"])
        : null,
    noindex: mapped["noindex"] === true || mapped["noindex"] === "true",
    status: "draft",
  };
}

// ---------------------------------------------------------------------------
// H2 Content Splitting
// ---------------------------------------------------------------------------

/**
 * Split HTML body content on `<h2>` boundaries.
 * Each resulting section includes the <h2> heading and everything up to
 * the next <h2> (or end of string).
 *
 * If no <h2> tags found, returns a single section with the full body.
 */
export function splitOnH2(html: string): string[] {
  if (!html || html.trim() === "") return [];

  const h2Regex = /<h2[\s>]/gi;
  const positions: number[] = [];
  let match: RegExpExecArray | null;
  while ((match = h2Regex.exec(html)) !== null) {
    positions.push(match.index);
  }

  if (positions.length === 0) {
    return [html.trim()];
  }

  const sections: string[] = [];

  const beforeFirst = html.slice(0, positions[0]).trim();
  if (beforeFirst) {
    sections.push(beforeFirst);
  }

  for (let i = 0; i < positions.length; i++) {
    const start = positions[i];
    const end = i + 1 < positions.length ? positions[i + 1] : html.length;
    const section = html.slice(start, end).trim();
    if (section) {
      sections.push(section);
    }
  }

  return sections;
}

/**
 * Re-split sections from the original mapped body content.
 */
export function reSplitSections(
  record: TransformedPracticePage,
  originalMappedBody: string,
): TransformedPracticePage {
  const sections = splitOnH2(ensureHtml(originalMappedBody));
  const content = record.content as Record<string, unknown>;

  const newSections = sections.map((body, idx) => ({
    body,
    image: "",
    imageAlt: "",
    imagePosition: idx % 2 === 0 ? ("right" as const) : ("left" as const),
    showCTAs: true,
  }));

  return {
    ...record,
    content: {
      ...content,
      contentSections: newSections,
    },
  };
}

// ---------------------------------------------------------------------------
// FAQ Detection
// ---------------------------------------------------------------------------

/**
 * Detect FAQ-like patterns in HTML content.
 * Supports: <dl>/<dt>/<dd>, <h3>?/<p> pairs.
 * Returns empty array if no clear structure is found.
 */
export function detectFaqPatterns(
  html: string,
): Array<{ question: string; answer: string }> {
  if (!html) return [];

  const items: Array<{ question: string; answer: string }> = [];

  // Pattern 1: <dl>/<dt>/<dd> structure
  const dlRegex = /<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi;
  let dlMatch: RegExpExecArray | null;
  while ((dlMatch = dlRegex.exec(html)) !== null) {
    const question = stripTags(dlMatch[1]).trim();
    const answer = dlMatch[2].trim();
    if (question && answer) {
      items.push({ question, answer });
    }
  }
  if (items.length >= 2) return items;

  // Pattern 2: <h3> followed by content (common FAQ format)
  const h3Regex =
    /<h3[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3|<h2|<\/section|<\/div|$)/gi;
  let h3Match: RegExpExecArray | null;
  const h3Items: Array<{ question: string; answer: string }> = [];
  while ((h3Match = h3Regex.exec(html)) !== null) {
    const question = stripTags(h3Match[1]).trim();
    const answer = h3Match[2].trim();
    if (question && answer && question.endsWith("?")) {
      h3Items.push({ question, answer });
    }
  }
  if (h3Items.length >= 2) return h3Items;

  return [];
}

// ---------------------------------------------------------------------------
// Quick Validation
// ---------------------------------------------------------------------------

/**
 * Lightweight check for required fields and slug format.
 * Used for inline per-record validation indicators.
 */
export function quickValidateRecord(
  record: TransformedRecord,
  templateType: TemplateType,
): { errors: ValidationIssue[]; warnings: ValidationIssue[] } {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const rowIndex = 0;

  if (templateType === "practice") {
    const p = record as TransformedPracticePage;

    if (!p.title || p.title.trim() === "" || p.title === "Untitled") {
      errors.push({
        rowIndex,
        field: "title",
        message: "Title is required",
        severity: "error",
      });
    }

    if (!p.url_path || p.url_path === "/practice-areas//") {
      errors.push({
        rowIndex,
        field: "url_path",
        message: "URL path is required",
        severity: "error",
      });
    } else {
      const slug = p.url_path.replace(/^\/practice-areas\//, "").replace(/\/$/, "");
      if (slug && !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug)) {
        errors.push({
          rowIndex,
          field: "url_path",
          message: "Slug must be lowercase, alphanumeric with hyphens only",
          severity: "error",
        });
      }
    }

    const content = p.content as Record<string, unknown>;
    const hero = content?.hero as Record<string, unknown> | undefined;
    const sections = content?.contentSections as unknown[] | undefined;

    if (!hero?.tagline) {
      warnings.push({
        rowIndex,
        field: "hero.tagline",
        message: "No hero tagline provided",
        severity: "warning",
      });
    }

    if (!sections || sections.length === 0) {
      warnings.push({
        rowIndex,
        field: "contentSections",
        message: "No content sections — page will be empty",
        severity: "warning",
      });
    }
  } else {
    const b = record as TransformedBlogPost;

    if (!b.title || b.title.trim() === "" || b.title === "Untitled") {
      errors.push({
        rowIndex,
        field: "title",
        message: "Title is required",
        severity: "error",
      });
    }

    if (!b.slug || b.slug.trim() === "") {
      errors.push({
        rowIndex,
        field: "slug",
        message: "Slug is required",
        severity: "error",
      });
    } else if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(b.slug)) {
      errors.push({
        rowIndex,
        field: "slug",
        message: "Slug must be lowercase, alphanumeric with hyphens only",
        severity: "error",
      });
    }

    if (!b.body) {
      warnings.push({
        rowIndex,
        field: "body",
        message: "No body content — post will be empty",
        severity: "warning",
      });
    }

    if (!b.excerpt) {
      warnings.push({
        rowIndex,
        field: "excerpt",
        message: "No excerpt — it won't appear in blog listings",
        severity: "warning",
      });
    }
  }

  return { errors, warnings };
}

/**
 * Reset a prepared record to its auto-prepared state.
 */
export function resetToAutoPrepared(
  record: PreparedRecord,
  templateType: TemplateType,
): PreparedRecord {
  const current = structuredClone(record.autoPrepared);
  const { errors, warnings } = quickValidateRecord(current, templateType);
  return {
    ...record,
    status: "needs-review",
    current,
    validationErrors: errors,
    validationWarnings: warnings,
  };
}

// ---------------------------------------------------------------------------
// HTML Helpers (exported for use by recipe rules and other modules)
// ---------------------------------------------------------------------------

/**
 * Ensure text content is wrapped in HTML paragraphs.
 * If already HTML, returns as-is. If plain text, wraps in <p> tags.
 */
export function ensureHtml(text: string): string {
  if (!text || text.trim() === "") return "";
  if (/<[a-z][\s\S]*>/i.test(text)) return text;
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (paragraphs.length === 0) return `<p>${text}</p>`;
  return paragraphs.map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");
}

/**
 * Strip all HTML tags from a string, returning plain text.
 */
export function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

/**
 * Extract the first <p> element from HTML content.
 * Falls back to first 200 chars of plain text wrapped in <p>.
 */
export function extractFirstParagraph(html: string): string {
  const match = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if (match) return `<p>${match[1]}</p>`;
  const plain = stripTags(html).trim();
  if (plain.length > 200) return `<p>${plain.slice(0, 200)}…</p>`;
  return plain ? `<p>${plain}</p>` : "";
}

/**
 * Extract the first <img> src URL from HTML content.
 * Returns empty string if no image found.
 */
export function extractFirstImage(html: string): string {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : "";
}
