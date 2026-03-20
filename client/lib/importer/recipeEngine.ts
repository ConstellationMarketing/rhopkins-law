// ============================================================================
// Recipe Engine — Full Pipeline Orchestrator
// ============================================================================
//
// Orchestrates the 5-stage pipeline:
//   Stage 1: Raw Source (input)
//   Stage 2: Cleaned Source (sourceCleaner)
//   Stage 3: Mapped Fields (fieldMapping)
//   Stage 4: Recipe Transform (recipeRules)
//   Stage 5: Final CMS Record (confidenceScorer)
//
// Processes in batches with progress callbacks, retry logic, and
// graceful image handling (Refinement #4).
// ============================================================================

import type {
  ImportRecipe,
  TransformedRecordWithConfidence,
  RecipeBatchConfig,
  BatchProgress,
  TransformationLogEntry,
  FieldConfidence,
  SlugCollisionConfig,
  ImageProcessingLog,
} from "./recipeTypes";
import type {
  SourceRecord,
  MappingConfig,
  TemplateType,
  TransformedRecord,
  TransformedPracticePage,
  TransformedBlogPost,
} from "./types";
import { cleanSourceRecords } from "./sourceCleaner";
import { applyMapping } from "./fieldMapping";
import { executeRule } from "./recipeRules";
import { scoreRecord } from "./confidenceScorer";
import { slugify } from "./fieldMapping";
import { DEFAULT_BATCH_CONFIG } from "./recipeTypes";
import { defaultPracticeAreaPageContent } from "@site/lib/cms/practiceAreaPageTypes";

// ---------------------------------------------------------------------------
// Main Entry Point
// ---------------------------------------------------------------------------

export interface RecipeEngineInput {
  sourceRecords: SourceRecord[];
  mappingConfig: MappingConfig;
  recipe: ImportRecipe;
  templateType: TemplateType;
  batchConfig?: Partial<RecipeBatchConfig>;
  slugCollision?: SlugCollisionConfig;
  onProgress?: (progress: BatchProgress) => void;
}

export interface RecipeEngineOutput {
  records: TransformedRecordWithConfidence[];
  autoApprovedCount: number;
  needsReviewCount: number;
  failedCount: number;
  exceptionIndices: number[];
  imageWarnings: ImageProcessingLog[];
}

/**
 * Run the full recipe-based transformation pipeline on all source records.
 */
export async function runRecipeEngine(
  input: RecipeEngineInput,
): Promise<RecipeEngineOutput> {
  const {
    sourceRecords,
    mappingConfig,
    recipe,
    templateType,
    slugCollision = { mode: "skip" },
    onProgress,
  } = input;
  const batchConfig = { ...DEFAULT_BATCH_CONFIG, ...input.batchConfig };

  const totalRecords = sourceRecords.length;
  const results: TransformedRecordWithConfidence[] = [];
  const imageWarnings: ImageProcessingLog[] = [];
  const usedSlugs = new Set<string>();

  // Report initial progress
  onProgress?.({
    currentRecord: 0,
    totalRecords,
    currentBatch: 0,
    totalBatches: Math.ceil(totalRecords / batchConfig.batchSize),
    autoApproved: 0,
    needsReview: 0,
    failed: 0,
    phase: "cleaning",
  });

  // Stage 2: Clean all source records
  const cleanedRecords = cleanSourceRecords(sourceRecords);

  onProgress?.({
    currentRecord: 0,
    totalRecords,
    currentBatch: 0,
    totalBatches: Math.ceil(totalRecords / batchConfig.batchSize),
    autoApproved: 0,
    needsReview: 0,
    failed: 0,
    phase: "mapping",
  });

  // Stage 3: Map all records
  const mappedRecords = cleanedRecords.map((cleaned) =>
    applyMapping(cleaned.data, mappingConfig),
  );

  // Process in batches
  const totalBatches = Math.ceil(totalRecords / batchConfig.batchSize);
  let autoApproved = 0;
  let needsReview = 0;
  let failed = 0;

  for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
    const startIdx = batchIdx * batchConfig.batchSize;
    const endIdx = Math.min(startIdx + batchConfig.batchSize, totalRecords);

    for (let i = startIdx; i < endIdx; i++) {
      const mapped = mappedRecords[i];
      const cleaned = cleanedRecords[i];

      onProgress?.({
        currentRecord: i + 1,
        totalRecords,
        currentBatch: batchIdx + 1,
        totalBatches,
        autoApproved,
        needsReview,
        failed,
        phase: "transforming",
      });

      try {
        // Stage 4: Apply recipe rules
        const { record, transformationLog, fieldConfidences } = applyRecipeRules(
          mapped,
          recipe,
          templateType,
        );

        // Handle slug collisions (Refinement #5)
        const resolvedRecord = resolveSlugCollision(
          record,
          templateType,
          slugCollision,
          usedSlugs,
        );

        // Track used slugs
        const slug = getRecordSlug(resolvedRecord, templateType);
        if (slug) usedSlugs.add(slug);

        // Check for AI rules
        const hasAIRules = recipe.rules.some(
          (r) => r.ruleType === "ai_transform" && r.enabled,
        );

        // Stage 5: Score confidence
        const confidence = scoreRecord({
          record: resolvedRecord,
          templateType,
          fieldConfidences,
          transformationLog,
          hasAIRules,
        });

        const status =
          confidence.overall >= recipe.confidenceThreshold
            ? ("auto_approved" as const)
            : ("needs_review" as const);

        if (status === "auto_approved") autoApproved++;
        else needsReview++;

        results.push({
          sourceIndex: i,
          record: resolvedRecord,
          confidence,
          status,
          transformationLog,
        });
      } catch (err) {
        failed++;
        const errorMsg = err instanceof Error ? err.message : "Unknown error";

        results.push({
          sourceIndex: i,
          record: createEmptyRecord(templateType, mapped),
          confidence: {
            overall: 0,
            dimensions: [],
            fieldScores: [],
            flags: ["processing_error"],
          },
          status: "needs_review",
          transformationLog: [
            {
              ruleId: "error",
              targetField: "*",
              ruleType: "direct_map",
              aiUsed: false,
              confidence: 0,
              description: `Processing error: ${errorMsg}`,
              timestamp: new Date().toISOString(),
            },
          ],
        });
      }
    }

    // Yield control to prevent UI freezing
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  // Final progress
  onProgress?.({
    currentRecord: totalRecords,
    totalRecords,
    currentBatch: totalBatches,
    totalBatches,
    autoApproved,
    needsReview,
    failed,
    phase: "complete",
  });

  // Calculate exception indices
  const exceptionIndices = results
    .map((r, idx) => (r.status === "needs_review" ? idx : -1))
    .filter((idx) => idx >= 0);

  return {
    records: results,
    autoApprovedCount: autoApproved,
    needsReviewCount: needsReview,
    failedCount: failed,
    exceptionIndices,
    imageWarnings,
  };
}

// ---------------------------------------------------------------------------
// Stage 4: Apply Recipe Rules to a Single Record
// ---------------------------------------------------------------------------

function applyRecipeRules(
  mapped: Record<string, unknown>,
  recipe: ImportRecipe,
  templateType: TemplateType,
): {
  record: TransformedRecord;
  transformationLog: TransformationLogEntry[];
  fieldConfidences: FieldConfidence[];
} {
  const transformationLog: TransformationLogEntry[] = [];
  const fieldConfidences: FieldConfidence[] = [];
  const ruleOutputs: Record<string, unknown> = {};

  // Execute each enabled rule
  for (const rule of recipe.rules) {
    if (!rule.enabled) continue;

    const result = executeRule(rule.ruleType, mapped, rule.config, {
      ruleId: rule.id,
      targetField: rule.targetField,
      templateType,
    });

    if (result.value !== undefined) {
      ruleOutputs[rule.targetField] = result.value;
    }

    transformationLog.push(result.log);
    fieldConfidences.push(result.confidence);
  }

  // Build the final record, merging rule outputs with direct mapped values
  const record = buildRecord(mapped, ruleOutputs, templateType);

  return { record, transformationLog, fieldConfidences };
}

// ---------------------------------------------------------------------------
// Record Building
// ---------------------------------------------------------------------------

function buildRecord(
  mapped: Record<string, unknown>,
  ruleOutputs: Record<string, unknown>,
  templateType: TemplateType,
): TransformedRecord {
  if (templateType === "practice") {
    return buildPracticeRecord(mapped, ruleOutputs);
  }
  return buildBlogRecord(mapped, ruleOutputs);
}

function buildPracticeRecord(
  mapped: Record<string, unknown>,
  outputs: Record<string, unknown>,
): TransformedPracticePage {
  const title = String(outputs["title"] ?? mapped["title"] ?? "Untitled");
  const urlSlug = outputs["url_path"] ?? outputs["url_slug"];
  const rawSlug = urlSlug
    ? String(urlSlug)
    : mapped["url_slug"]
      ? String(mapped["url_slug"])
      : slugify(title);

  const urlPath = rawSlug.startsWith("/")
    ? rawSlug
    : `/practice-areas/${rawSlug}/`;

  // Hero
  const heroOutput = outputs["hero"] as Record<string, unknown> | undefined;
  const hero = {
    sectionLabel: String(
      heroOutput?.sectionLabel ??
        outputs["hero.sectionLabel"] ??
        mapped["hero.sectionLabel"] ??
        defaultPracticeAreaPageContent.hero.sectionLabel,
    ),
    tagline: String(
      heroOutput?.tagline ??
        outputs["hero.tagline"] ??
        mapped["hero.tagline"] ??
        title,
    ),
    description: String(
      heroOutput?.description ??
        outputs["hero.description"] ??
        mapped["hero.description"] ??
        "",
    ),
    backgroundImage: String(
      heroOutput?.backgroundImage ??
        outputs["hero.backgroundImage"] ??
        mapped["hero.backgroundImage"] ??
        "",
    ),
    backgroundImageAlt: String(
      heroOutput?.backgroundImageAlt ??
        outputs["hero.backgroundImageAlt"] ??
        mapped["hero.backgroundImageAlt"] ??
        "",
    ),
  };

  // Content sections
  let contentSections =
    outputs["contentSections"] as Array<Record<string, unknown>> | undefined;
  if (!contentSections || !Array.isArray(contentSections) || contentSections.length === 0) {
    contentSections = defaultPracticeAreaPageContent.contentSections as unknown as Array<Record<string, unknown>>;
  }

  // FAQ
  const faqOutput = outputs["faq"] as Array<Record<string, unknown>> | undefined;
  const faqItems = Array.isArray(faqOutput) ? faqOutput : [];

  const faq = {
    enabled:
      faqItems.length > 0 ||
      !!mapped["faq.heading"] ||
      !!outputs["faq.heading"],
    heading: String(
      outputs["faq.heading"] ??
        mapped["faq.heading"] ??
        (faqItems.length > 0
          ? "Frequently Asked Questions"
          : defaultPracticeAreaPageContent.faq.heading),
    ),
    description: String(
      outputs["faq.description"] ??
        mapped["faq.description"] ??
        defaultPracticeAreaPageContent.faq.description,
    ),
    items:
      faqItems.length > 0
        ? faqItems
        : defaultPracticeAreaPageContent.faq.items,
  };

  const content: Record<string, unknown> = {
    hero,
    socialProof: {
      mode: "awards" as const,
      testimonials: [],
      awards: { logos: [] },
    },
    contentSections,
    faq,
  };

  return {
    title,
    url_path: urlPath,
    page_type: "practice",
    content,
    meta_title: String(
      outputs["meta_title"] ?? mapped["meta_title"] ?? title,
    ),
    meta_description: outputs["meta_description"]
      ? String(outputs["meta_description"])
      : mapped["meta_description"]
        ? String(mapped["meta_description"])
        : undefined,
    canonical_url: (outputs["canonical_url"] ?? mapped["canonical_url"] ?? null) as string | null,
    og_title: (outputs["og_title"] ?? mapped["og_title"] ?? null) as string | null,
    og_description: (outputs["og_description"] ?? mapped["og_description"] ?? null) as string | null,
    og_image: (outputs["og_image"] ?? mapped["og_image"] ?? null) as string | null,
    noindex:
      outputs["noindex"] === true ||
      outputs["noindex"] === "true" ||
      mapped["noindex"] === true ||
      mapped["noindex"] === "true",
    schema_type: null,
    schema_data: null,
    status: "draft",
  };
}

function buildBlogRecord(
  mapped: Record<string, unknown>,
  outputs: Record<string, unknown>,
): TransformedBlogPost {
  const title = String(outputs["title"] ?? mapped["title"] ?? "Untitled");
  const slug = String(
    outputs["slug"] ?? mapped["slug"] ?? slugify(title),
  );

  return {
    title,
    slug,
    excerpt: outputs["excerpt"]
      ? String(outputs["excerpt"])
      : mapped["excerpt"]
        ? String(mapped["excerpt"])
        : undefined,
    featured_image: outputs["featured_image"]
      ? String(outputs["featured_image"])
      : mapped["featured_image"]
        ? String(mapped["featured_image"])
        : undefined,
    category: outputs["category"]
      ? String(outputs["category"])
      : mapped["category"]
        ? String(mapped["category"])
        : undefined,
    category_id: null,
    content: [],
    body: outputs["body"]
      ? String(outputs["body"])
      : mapped["body"]
        ? String(mapped["body"])
        : undefined,
    meta_title: String(
      outputs["meta_title"] ?? mapped["meta_title"] ?? title,
    ),
    meta_description: outputs["meta_description"]
      ? String(outputs["meta_description"])
      : mapped["meta_description"]
        ? String(mapped["meta_description"])
        : mapped["excerpt"]
          ? String(mapped["excerpt"])
          : undefined,
    canonical_url: (outputs["canonical_url"] ?? mapped["canonical_url"] ?? null) as string | null,
    og_title: (outputs["og_title"] ?? mapped["og_title"] ?? null) as string | null,
    og_description: (outputs["og_description"] ?? mapped["og_description"] ?? null) as string | null,
    og_image: (outputs["og_image"] ??
      mapped["og_image"] ??
      outputs["featured_image"] ??
      mapped["featured_image"] ??
      null) as string | null,
    noindex:
      outputs["noindex"] === true ||
      outputs["noindex"] === "true" ||
      mapped["noindex"] === true ||
      mapped["noindex"] === "true",
    status: "draft",
  };
}

// ---------------------------------------------------------------------------
// Slug Collision Handling (Refinement #5)
// ---------------------------------------------------------------------------

function resolveSlugCollision(
  record: TransformedRecord,
  templateType: TemplateType,
  config: SlugCollisionConfig,
  usedSlugs: Set<string>,
): TransformedRecord {
  const currentSlug = getRecordSlug(record, templateType);
  if (!currentSlug || !usedSlugs.has(currentSlug)) {
    return record;
  }

  switch (config.mode) {
    case "skip":
      // Keep original — collision will be caught at validation/import time
      return record;

    case "overwrite":
      // Keep original — overwrite happens at import time
      return record;

    case "unique_suffix": {
      const maxSuffix = config.maxSuffix ?? 99;
      let newSlug = currentSlug;
      let suffix = 1;

      while (usedSlugs.has(newSlug) && suffix <= maxSuffix) {
        if (templateType === "practice") {
          // For practice pages: /practice-areas/slug/ → /practice-areas/slug-1/
          const baseSlug = currentSlug
            .replace(/^\/practice-areas\//, "")
            .replace(/\/$/, "");
          newSlug = `/practice-areas/${baseSlug}-${suffix}/`;
        } else {
          // For posts: slug → slug-1
          const baseSlug = currentSlug.replace(/-\d+$/, "");
          newSlug = `${baseSlug}-${suffix}`;
        }
        suffix++;
      }

      return setRecordSlug(record, templateType, newSlug);
    }

    default:
      return record;
  }
}

function getRecordSlug(record: TransformedRecord, templateType: TemplateType): string | null {
  if (templateType === "practice") {
    return (record as TransformedPracticePage).url_path ?? null;
  }
  return (record as TransformedBlogPost).slug ?? null;
}

function setRecordSlug(
  record: TransformedRecord,
  templateType: TemplateType,
  slug: string,
): TransformedRecord {
  if (templateType === "practice") {
    return { ...(record as TransformedPracticePage), url_path: slug };
  }
  return { ...(record as TransformedBlogPost), slug };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createEmptyRecord(
  templateType: TemplateType,
  mapped: Record<string, unknown>,
): TransformedRecord {
  const title = String(mapped["title"] ?? "Untitled");

  if (templateType === "practice") {
    return {
      title,
      url_path: `/practice-areas/${slugify(title)}/`,
      page_type: "practice",
      content: {
        hero: defaultPracticeAreaPageContent.hero,
        socialProof: { mode: "awards", testimonials: [], awards: { logos: [] } },
        contentSections: defaultPracticeAreaPageContent.contentSections,
        faq: defaultPracticeAreaPageContent.faq,
      },
      status: "draft",
    };
  }

  return {
    title,
    slug: slugify(title),
    status: "draft",
  };
}
