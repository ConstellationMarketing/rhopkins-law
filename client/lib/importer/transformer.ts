import type {
  TemplateType,
  TransformedPracticePage,
  TransformedBlogPost,
  TransformedRecord,
  MappingConfig,
  SourceRecord,
} from "./types";
import { applyMapping, collectRepeaterData, slugify } from "./fieldMapping";
import { defaultPracticeAreaPageContent } from "@site/lib/cms/practiceAreaPageTypes";

/**
 * Transform an array of mapped records into the exact CMS schema shapes
 * ready for server submission.
 */
export function transformRecords(
  sourceRecords: SourceRecord[],
  mappingConfig: MappingConfig,
  templateType: TemplateType,
): TransformedRecord[] {
  return sourceRecords.map((source) => {
    const mapped = applyMapping(source, mappingConfig);

    if (templateType === "practice") {
      return transformPracticePage(mapped, source, mappingConfig);
    }
    return transformBlogPost(mapped);
  });
}

// ---------------------------------------------------------------------------
// Practice Area Page Transformer
// ---------------------------------------------------------------------------

function transformPracticePage(
  mapped: Record<string, unknown>,
  sourceRecord: SourceRecord,
  config: MappingConfig,
): TransformedPracticePage {
  const title = String(mapped["title"] ?? "Untitled");
  const rawSlug = mapped["url_slug"]
    ? String(mapped["url_slug"])
    : slugify(title);
  const urlPath = `/practice-areas/${rawSlug}/`;

  // Build content sections from repeater data or mapped arrays
  let contentSections = collectRepeaterData(
    sourceRecord,
    "practice",
    "contentSections",
    config,
  );

  // If no repeater data found, check if there's a single body mapped
  if (contentSections.length === 0 && mapped["contentSections.body"]) {
    contentSections = [
      {
        body: ensureHtml(String(mapped["contentSections.body"])),
        image: mapped["contentSections.image"]
          ? String(mapped["contentSections.image"])
          : "",
        imageAlt: mapped["contentSections.imageAlt"]
          ? String(mapped["contentSections.imageAlt"])
          : "",
        imagePosition: "right" as const,
        showCTAs: true,
      },
    ];
  }

  // Normalize content sections
  const normalizedSections = contentSections.map((section, idx) => ({
    body: ensureHtml(String(section.body ?? "")),
    image: String(section.image ?? ""),
    imageAlt: String(section.imageAlt ?? ""),
    imagePosition:
      (section.imagePosition as "left" | "right") ??
      (idx % 2 === 0 ? "right" : "left"),
    showCTAs: section.showCTAs !== false,
  }));

  // Build FAQ items
  let faqItems = collectRepeaterData(
    sourceRecord,
    "practice",
    "faq.items",
    config,
  );

  // Normalize FAQ items
  const normalizedFaq = faqItems.map((item) => ({
    question: String(item.question ?? ""),
    answer: ensureHtml(String(item.answer ?? "")),
  }));

  // Build the content object matching PracticeAreaPageContent
  const content: Record<string, unknown> = {
    hero: {
      sectionLabel:
        defaultPracticeAreaPageContent.hero.sectionLabel,
      tagline: mapped["hero.tagline"]
        ? String(mapped["hero.tagline"])
        : defaultPracticeAreaPageContent.hero.tagline,
      description: mapped["hero.description"]
        ? ensureHtml(String(mapped["hero.description"]))
        : defaultPracticeAreaPageContent.hero.description,
      backgroundImage: mapped["hero.backgroundImage"]
        ? String(mapped["hero.backgroundImage"])
        : "",
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
    meta_title: mapped["meta_title"] ? String(mapped["meta_title"]) : undefined,
    meta_description: mapped["meta_description"]
      ? String(mapped["meta_description"])
      : undefined,
    canonical_url: null,
    og_title: null,
    og_description: null,
    og_image: null,
    noindex: false,
    schema_type: null,
    schema_data: null,
    status: "draft",
  };
}

// ---------------------------------------------------------------------------
// Blog Post Transformer
// ---------------------------------------------------------------------------

function transformBlogPost(
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
    meta_title: mapped["meta_title"] ? String(mapped["meta_title"]) : undefined,
    meta_description: mapped["meta_description"]
      ? String(mapped["meta_description"])
      : undefined,
    canonical_url: null,
    og_title: null,
    og_description: null,
    og_image: mapped["og_image"] ? String(mapped["og_image"]) : null,
    noindex: false,
    status: "draft",
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Ensure a value is wrapped in HTML tags if it's plain text.
 */
function ensureHtml(text: string): string {
  if (!text || text.trim() === "") return "";
  // Already has HTML tags
  if (/<[a-z][\s\S]*>/i.test(text)) return text;
  // Wrap plain text in paragraphs
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (paragraphs.length === 0) return `<p>${text}</p>`;
  return paragraphs.map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");
}
