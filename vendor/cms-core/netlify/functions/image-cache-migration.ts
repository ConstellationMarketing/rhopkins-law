import type { Handler, HandlerEvent } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || process.env.URL || "*";
const TARGET_CACHE_CONTROL = "31536000";
const TARGET_CACHE_MAX_AGE = 31_536_000;
const STORAGE_PUBLIC_PREFIX = "/storage/v1/object/public/media/";
const MIGRATED_PREFIX = "cache-migrations";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

type StatusFilter = "all" | "published" | "draft";
type AssetStatus =
  | "needs_migration"
  | "already_optimized"
  | "inspection_failed";

interface MigrationRequest {
  dryRun: boolean;
  confirmToken?: string;
  statusFilter: StatusFilter;
}

interface UrlReference {
  sourceUrl: string;
  rowId: string;
  tableName: string;
  itemTitle: string;
  itemUrl: string;
  fieldPath: string;
}

interface AssetCandidate {
  sourceUrl: string;
  currentCacheControl: string | null;
  currentMaxAge: number | null;
  status: AssetStatus;
  reason?: string;
  references: UrlReference[];
}

interface PreviewResult {
  totalReferences: number;
  affectedItems: number;
  uniqueUrls: number;
  urlsNeedingMigration: number;
  candidates: AssetCandidate[];
  confirmToken: string;
}

interface ExecuteResult {
  operationId: string;
  totalReferences: number;
  affectedItems: number;
  uniqueUrls: number;
  migratedCount: number;
  updatedItems: number;
  failedCount: number;
  migratedAssets: Array<{ oldUrl: string; newUrl: string }>;
  failures: Array<{ sourceUrl: string; reason: string }>;
}

interface AssetInspection {
  sourceUrl: string;
  currentCacheControl: string | null;
  currentMaxAge: number | null;
  status: AssetStatus;
  reason?: string;
}

interface TableSearchConfig {
  tableName: string;
  textFields: string[];
  jsonbFields: string[];
  hasStatus: boolean;
  getTitle: (row: Record<string, unknown>) => string;
  getUrl: (row: Record<string, unknown>) => string;
}

const TABLE_CONFIGS: TableSearchConfig[] = [
  {
    tableName: "pages",
    textFields: [
      "title",
      "url_path",
      "meta_title",
      "meta_description",
      "canonical_url",
      "og_title",
      "og_description",
      "og_image",
    ],
    jsonbFields: ["content", "schema_data"],
    hasStatus: true,
    getTitle: (row) => (row.title as string) || "Untitled Page",
    getUrl: (row) => (row.url_path as string) || "/",
  },
  {
    tableName: "posts",
    textFields: [
      "title",
      "slug",
      "excerpt",
      "featured_image",
      "body",
      "meta_title",
      "meta_description",
      "canonical_url",
      "og_title",
      "og_description",
      "og_image",
    ],
    jsonbFields: ["content"],
    hasStatus: true,
    getTitle: (row) => (row.title as string) || "Untitled Post",
    getUrl: (row) => `/blog/${(row.slug as string) || ""}`,
  },
  {
    tableName: "site_settings",
    textFields: [
      "site_name",
      "logo_url",
      "logo_alt",
      "header_cta_url",
      "map_embed_url",
      "footer_tagline_html",
      "head_scripts",
      "footer_scripts",
      "site_url",
      "global_schema",
    ],
    jsonbFields: [
      "navigation_items",
      "footer_about_links",
      "footer_practice_links",
      "social_links",
    ],
    hasStatus: false,
    getTitle: () => "Site Settings",
    getUrl: () => "(global)",
  },
  {
    tableName: "templates",
    textFields: ["name", "default_meta_title", "default_meta_description"],
    jsonbFields: ["default_content"],
    hasStatus: false,
    getTitle: (row) => (row.name as string) || "Untitled Template",
    getUrl: (row) => `template:${(row.name as string) || row.id}`,
  },
  {
    tableName: "blog_sidebar_settings",
    textFields: ["attorney_image"],
    jsonbFields: ["award_images"],
    hasStatus: false,
    getTitle: () => "Blog Sidebar Settings",
    getUrl: () => "(blog sidebar)",
  },
];

const ALLOWED_TABLES = new Set(TABLE_CONFIGS.map((config) => config.tableName));

function parseCacheMaxAge(cacheControl: string | null): number | null {
  if (!cacheControl) return null;

  const match = cacheControl.match(/max-age=(\d+)/i);
  if (!match) return null;

  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function trimMatchedUrl(value: string): string {
  return value.replace(/[),.;]+$/, "");
}

function extractHttpUrls(value: string): string[] {
  const matches = value.match(/https?:\/\/[^\s"'<>`]+/g) ?? [];
  const unique = new Set<string>();

  for (const match of matches) {
    unique.add(trimMatchedUrl(match));
  }

  return Array.from(unique);
}

function getProjectMediaPath(rawUrl: string): string | null {
  if (!supabaseUrl) return null;

  try {
    const url = new URL(rawUrl);
    const supabaseOrigin = new URL(supabaseUrl).origin;

    if (url.origin !== supabaseOrigin) {
      return null;
    }

    const pathname = decodeURIComponent(url.pathname);
    if (!pathname.startsWith(STORAGE_PUBLIC_PREFIX)) {
      return null;
    }

    const filePath = pathname.slice(STORAGE_PUBLIC_PREFIX.length);
    return filePath || null;
  } catch {
    return null;
  }
}

function extractProjectMediaUrls(value: string): string[] {
  return extractHttpUrls(value).filter((url) => !!getProjectMediaPath(url));
}

function replaceUrlsInString(value: string, urlMap: Map<string, string>): string {
  let nextValue = value;
  const orderedEntries = Array.from(urlMap.entries()).sort(
    ([a], [b]) => b.length - a.length,
  );

  for (const [oldUrl, newUrl] of orderedEntries) {
    nextValue = nextValue.split(oldUrl).join(newUrl);
  }

  return nextValue;
}

function traverseForUrlReferences(
  value: unknown,
  path: string,
  pushReference: (sourceUrl: string, fieldPath: string) => void,
): void {
  if (typeof value === "string") {
    for (const sourceUrl of extractProjectMediaUrls(value)) {
      pushReference(sourceUrl, path);
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      traverseForUrlReferences(item, `${path}[${index}]`, pushReference);
    });
    return;
  }

  if (value && typeof value === "object") {
    for (const [key, nestedValue] of Object.entries(value)) {
      traverseForUrlReferences(
        nestedValue,
        path ? `${path}.${key}` : key,
        pushReference,
      );
    }
  }
}

function traverseAndReplaceUrls(value: unknown, urlMap: Map<string, string>): unknown {
  if (typeof value === "string") {
    return replaceUrlsInString(value, urlMap);
  }

  if (Array.isArray(value)) {
    return value.map((item) => traverseAndReplaceUrls(item, urlMap));
  }

  if (value && typeof value === "object") {
    const nextObject: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      nextObject[key] = traverseAndReplaceUrls(nestedValue, urlMap);
    }
    return nextObject;
  }

  return value;
}

async function searchTableForUrlReferences(
  supabase: ReturnType<typeof createClient>,
  config: TableSearchConfig,
  statusFilter: StatusFilter,
): Promise<UrlReference[]> {
  let query = supabase.from(config.tableName).select("*");

  if (config.hasStatus) {
    if (statusFilter === "published") {
      query = query.eq("status", "published");
    } else if (statusFilter === "draft") {
      query = query.eq("status", "draft");
    }
  }

  const { data: rows, error } = await query;
  if (error) {
    console.error(`Image cache migration query failed for ${config.tableName}:`, error);
    return [];
  }

  const references: UrlReference[] = [];

  for (const row of rows || []) {
    for (const field of config.textFields) {
      const value = row[field];
      if (typeof value !== "string") continue;

      for (const sourceUrl of extractProjectMediaUrls(value)) {
        references.push({
          sourceUrl,
          rowId: row.id,
          tableName: config.tableName,
          itemTitle: config.getTitle(row),
          itemUrl: config.getUrl(row),
          fieldPath: field,
        });
      }
    }

    for (const jsonbField of config.jsonbFields) {
      if (!row[jsonbField]) continue;

      traverseForUrlReferences(row[jsonbField], jsonbField, (sourceUrl, fieldPath) => {
        references.push({
          sourceUrl,
          rowId: row.id,
          tableName: config.tableName,
          itemTitle: config.getTitle(row),
          itemUrl: config.getUrl(row),
          fieldPath,
        });
      });
    }
  }

  return references;
}

async function requestAssetHeaders(url: string): Promise<Headers> {
  const headResponse = await fetch(url, {
    method: "HEAD",
    signal: AbortSignal.timeout(10_000),
  });

  if (headResponse.ok && headResponse.headers.get("cache-control")) {
    return headResponse.headers;
  }

  const getResponse = await fetch(url, {
    method: "GET",
    signal: AbortSignal.timeout(15_000),
  });

  if (!getResponse.ok) {
    throw new Error(`Asset request failed with ${getResponse.status}`);
  }

  try {
    await getResponse.body?.cancel();
  } catch {
    // Ignore stream cancellation errors.
  }

  return getResponse.headers;
}

async function inspectAsset(sourceUrl: string): Promise<AssetInspection> {
  const filePath = getProjectMediaPath(sourceUrl);
  if (!filePath) {
    return {
      sourceUrl,
      currentCacheControl: null,
      currentMaxAge: null,
      status: "inspection_failed",
      reason: "Not a project Supabase media URL",
    };
  }

  if (filePath.startsWith(`${MIGRATED_PREFIX}/`)) {
    return {
      sourceUrl,
      currentCacheControl: TARGET_CACHE_CONTROL,
      currentMaxAge: TARGET_CACHE_MAX_AGE,
      status: "already_optimized",
      reason: "Already migrated by this workflow",
    };
  }

  try {
    const headers = await requestAssetHeaders(sourceUrl);
    const cacheControl = headers.get("cache-control");
    const contentType = headers.get("content-type") || "";
    const currentMaxAge = parseCacheMaxAge(cacheControl);

    if (!contentType.startsWith("image/")) {
      return {
        sourceUrl,
        currentCacheControl: cacheControl,
        currentMaxAge,
        status: "inspection_failed",
        reason: `Asset is not an image (${contentType || "unknown content-type"})`,
      };
    }

    if (currentMaxAge !== null && currentMaxAge >= TARGET_CACHE_MAX_AGE) {
      return {
        sourceUrl,
        currentCacheControl: cacheControl,
        currentMaxAge,
        status: "already_optimized",
        reason: "Already using a long cache lifetime",
      };
    }

    return {
      sourceUrl,
      currentCacheControl: cacheControl,
      currentMaxAge,
      status: "needs_migration",
      reason:
        currentMaxAge === null
          ? "Cache lifetime could not be confirmed, so migration is recommended"
          : `Current max-age is ${currentMaxAge}`,
    };
  } catch (error) {
    return {
      sourceUrl,
      currentCacheControl: null,
      currentMaxAge: null,
      status: "inspection_failed",
      reason: error instanceof Error ? error.message : "Asset inspection failed",
    };
  }
}

async function collectCandidates(
  supabase: ReturnType<typeof createClient>,
  statusFilter: StatusFilter,
): Promise<{
  references: UrlReference[];
  affectedItems: number;
  candidates: AssetCandidate[];
}> {
  const references: UrlReference[] = [];
  const affectedItemKeys = new Set<string>();

  for (const config of TABLE_CONFIGS) {
    const tableReferences = await searchTableForUrlReferences(
      supabase,
      config,
      statusFilter,
    );

    for (const reference of tableReferences) {
      references.push(reference);
      affectedItemKeys.add(`${reference.tableName}:${reference.rowId}`);
    }
  }

  const groupedReferences = new Map<string, UrlReference[]>();
  for (const reference of references) {
    const existing = groupedReferences.get(reference.sourceUrl) || [];
    existing.push(reference);
    groupedReferences.set(reference.sourceUrl, existing);
  }

  const candidates: AssetCandidate[] = [];
  for (const [sourceUrl, urlReferences] of groupedReferences) {
    const inspection = await inspectAsset(sourceUrl);
    candidates.push({
      sourceUrl,
      currentCacheControl: inspection.currentCacheControl,
      currentMaxAge: inspection.currentMaxAge,
      status: inspection.status,
      reason: inspection.reason,
      references: urlReferences,
    });
  }

  candidates.sort((a, b) => {
    const statusOrder: Record<AssetStatus, number> = {
      needs_migration: 0,
      inspection_failed: 1,
      already_optimized: 2,
    };

    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }

    return b.references.length - a.references.length;
  });

  return {
    references,
    affectedItems: affectedItemKeys.size,
    candidates,
  };
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]+/g, "-");
}

function guessContentType(filePath: string): string {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  return "image/jpeg";
}

async function migrateAsset(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  sourceUrl: string,
): Promise<{ oldUrl: string; newUrl: string }> {
  const oldFilePath = getProjectMediaPath(sourceUrl);
  if (!oldFilePath) {
    throw new Error("Could not determine storage path for source asset");
  }

  const response = await fetch(sourceUrl, {
    method: "GET",
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`Asset download failed with ${response.status}`);
  }

  const contentType =
    response.headers.get("content-type")?.split(";")[0].trim() ||
    guessContentType(oldFilePath);

  if (!contentType.startsWith("image/")) {
    throw new Error(`Asset is not an image (${contentType})`);
  }

  const buffer = await response.arrayBuffer();
  const originalName = oldFilePath.split("/").pop() || "asset";
  const newFilePath = `${MIGRATED_PREFIX}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}-${sanitizeFileName(originalName)}`;

  const { error: uploadError } = await supabase.storage
    .from("media")
    .upload(newFilePath, buffer, {
      cacheControl: TARGET_CACHE_CONTROL,
      contentType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: publicUrlData } = supabase.storage
    .from("media")
    .getPublicUrl(newFilePath);

  const newUrl = publicUrlData.publicUrl;

  const { error: mediaInsertError } = await supabase.from("media").insert({
    file_name: sanitizeFileName(originalName),
    file_path: newFilePath,
    public_url: newUrl,
    file_size: buffer.byteLength,
    mime_type: contentType,
    uploaded_by: userId,
  });

  if (mediaInsertError) {
    console.warn("Image cache migration media row insert failed:", mediaInsertError.message);
  }

  return {
    oldUrl: sourceUrl,
    newUrl,
  };
}

async function applyUrlMapToRows(
  supabase: ReturnType<typeof createClient>,
  references: UrlReference[],
  urlMap: Map<string, string>,
): Promise<number> {
  const referencesByRow = new Map<string, UrlReference[]>();

  for (const reference of references) {
    if (!urlMap.has(reference.sourceUrl)) continue;
    const key = `${reference.tableName}:${reference.rowId}`;
    const existing = referencesByRow.get(key) || [];
    existing.push(reference);
    referencesByRow.set(key, existing);
  }

  let updatedItems = 0;

  for (const [key] of referencesByRow) {
    const [tableName, rowId] = key.split(":");
    if (!ALLOWED_TABLES.has(tableName)) continue;

    const config = TABLE_CONFIGS.find((item) => item.tableName === tableName);
    if (!config) continue;

    const { data: row, error: rowError } = await supabase
      .from(tableName)
      .select("*")
      .eq("id", rowId)
      .single();

    if (rowError || !row) {
      console.error(`Image cache migration row fetch failed for ${tableName}:${rowId}`, rowError);
      continue;
    }

    const updates: Record<string, unknown> = {};

    for (const field of config.textFields) {
      const value = row[field];
      if (typeof value !== "string") continue;

      const nextValue = replaceUrlsInString(value, urlMap);
      if (nextValue !== value) {
        updates[field] = nextValue;
      }
    }

    for (const jsonbField of config.jsonbFields) {
      const value = row[jsonbField];
      if (!value) continue;

      const nextValue = traverseAndReplaceUrls(value, urlMap);
      if (JSON.stringify(nextValue) !== JSON.stringify(value)) {
        updates[jsonbField] = nextValue;
      }
    }

    if (Object.keys(updates).length === 0) continue;

    if (Object.prototype.hasOwnProperty.call(row, "updated_at")) {
      updates.updated_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from(tableName)
      .update(updates)
      .eq("id", rowId);

    if (updateError) {
      console.error(`Image cache migration update failed for ${tableName}:${rowId}`, updateError);
      continue;
    }

    updatedItems += 1;
  }

  return updatedItems;
}

function buildConfirmToken(statusFilter: StatusFilter): string {
  return Buffer.from(
    JSON.stringify({
      statusFilter,
      timestamp: Date.now(),
    }),
  ).toString("base64");
}

async function assertAdmin(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("cms_users")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Image cache migration admin check failed:", error);
    return false;
  }

  return data?.role === "admin";
}

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Supabase not configured" }),
    };
  }

  const authHeader = event.headers.authorization;
  if (!authHeader) {
    return {
      statusCode: 401,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Authorization header required" }),
    };
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return {
      statusCode: 401,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Invalid or expired token" }),
    };
  }

  const isAdmin = await assertAdmin(supabase, user.id);
  if (!isAdmin) {
    return {
      statusCode: 403,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Admin access required" }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}") as Partial<MigrationRequest>;
    const statusFilter: StatusFilter =
      body.statusFilter === "published" || body.statusFilter === "draft"
        ? body.statusFilter
        : "all";

    const { references, affectedItems, candidates } = await collectCandidates(
      supabase,
      statusFilter,
    );

    if (body.dryRun !== false) {
      const result: PreviewResult = {
        totalReferences: references.length,
        affectedItems,
        uniqueUrls: candidates.length,
        urlsNeedingMigration: candidates.filter(
          (candidate) => candidate.status === "needs_migration",
        ).length,
        candidates,
        confirmToken: buildConfirmToken(statusFilter),
      };

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(result),
      };
    }

    if (!body.confirmToken) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "Confirm token required. Run preview first." }),
      };
    }

    const operationId = crypto.randomUUID();
    const urlMap = new Map<string, string>();
    const migratedAssets: Array<{ oldUrl: string; newUrl: string }> = [];
    const failures: Array<{ sourceUrl: string; reason: string }> = [];

    for (const candidate of candidates) {
      if (candidate.status !== "needs_migration") continue;

      try {
        const migrated = await migrateAsset(supabase, user.id, candidate.sourceUrl);
        urlMap.set(migrated.oldUrl, migrated.newUrl);
        migratedAssets.push(migrated);
      } catch (error) {
        failures.push({
          sourceUrl: candidate.sourceUrl,
          reason: error instanceof Error ? error.message : "Migration failed",
        });
      }
    }

    const updatedItems = await applyUrlMapToRows(supabase, references, urlMap);

    const result: ExecuteResult = {
      operationId,
      totalReferences: references.length,
      affectedItems,
      uniqueUrls: candidates.length,
      migratedCount: migratedAssets.length,
      updatedItems,
      failedCount: failures.length,
      migratedAssets,
      failures,
    };

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("Image cache migration failed:", error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: "Image cache migration failed",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
