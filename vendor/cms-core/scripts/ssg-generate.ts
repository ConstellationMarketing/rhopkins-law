import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import type { Database } from "../client/lib/database.types";
import { defaultPracticeAreaPageContent } from "../../../client/lib/cms/practiceAreaPageTypes";
import {
  buildBlogPostPath,
  getPublicPageRoutes,
  normalizeCmsPath,
  normalizeBlogSlug,
} from "../../../client/lib/cms/publicRoutes";
import {
  serializeCmsPreloadedState,
  type CmsPreloadedState,
} from "../../../client/lib/cms/preloadedState";
import {
  mapSiteSettingsRow,
  type SiteSettings,
} from "../../../client/lib/cms/siteSettings";
import {
  resolveAboutPageData,
  resolveBlogPageData,
  resolveBlogPostData,
  resolveContactPageData,
  isPracticeAreaPageRow,
  resolveDynamicPageData,
  resolveHomePageData,
  resolvePracticeAreaPageData,
  resolvePracticeAreasPageData,
  type BlogPostWithCategory,
  type CmsPageRow,
} from "../../../client/lib/cms/sharedPageData";
import {
  escapeHtml,
  normalizeSiteUrl,
  stripManagedSeoHeadTags,
} from "../../../client/lib/seo";
import { renderCmsPage } from "../../../client/server-entry";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.log("Supabase credentials not configured. Skipping SSG generation.");
  console.log(
    "To enable SSG, set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.",
  );
  process.exit(0);
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceRoleKey);

interface PageRow extends CmsPageRow {
  id: string;
  title: string;
  url_path: string;
  updated_at: string;
  content: unknown;
}

interface PostRow extends BlogPostWithCategory {
  updated_at: string;
}

interface Redirect {
  from_path: string;
  to_path: string;
  status_code: number;
}

async function ensurePracticeAreaPage() {
  if (!supabaseServiceRoleKey) {
    console.log("[ensurePracticeAreaPage] No service role key — skipping.");
    return;
  }

  const practiceAreaUrl = "/practice-areas/practice-area/";

  const { data: existing, error: checkError } = await supabase
    .from("pages")
    .select("id")
    .eq("url_path", practiceAreaUrl)
    .maybeSingle();

  if (checkError) {
    console.error(
      "[ensurePracticeAreaPage] Error checking for page:",
      checkError.message,
    );
    return;
  }

  if (existing) {
    console.log(
      `[ensurePracticeAreaPage] Page ${practiceAreaUrl} already exists (id=${existing.id}). Nothing to do.`,
    );
    return;
  }

  const { data: inserted, error: insertError } = await supabase
    .from("pages")
    .insert({
      title: "Practice Area",
      url_path: practiceAreaUrl,
      page_type: "practice",
      status: "published",
      content: defaultPracticeAreaPageContent as unknown as Record<string, unknown>,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    console.error(
      "[ensurePracticeAreaPage] Failed to insert page:",
      insertError?.message ?? "unknown error",
    );
    return;
  }

  console.log(
    `[ensurePracticeAreaPage] Restored ${practiceAreaUrl} (id=${inserted.id}) with default content.`,
  );
}

async function generateSSG() {
  console.log("Starting SSG generation...");

  await ensurePracticeAreaPage();

  const { data: siteSettingsData } = await supabase
    .from("site_settings")
    .select(
      "site_name, logo_url, logo_alt, phone_number, phone_display, phone_availability, apply_phone_globally, header_cta_text, header_cta_url, header_service_text, navigation_items, footer_about_links, footer_practice_links, footer_about_label, footer_about_icon, footer_practice_label, footer_practice_icon, footer_column3_html, footer_tagline_html, address_line1, address_line2, map_embed_url, social_links, copyright_text, site_url, site_noindex, ga4_measurement_id, google_ads_id, google_ads_conversion_label, head_scripts, footer_scripts, global_schema",
    )
    .eq("settings_key", "global")
    .single();

  const siteSettings = mapSiteSettingsRow(siteSettingsData);
  const siteUrl = normalizeSiteUrl(process.env.SITE_URL || siteSettings.siteUrl) || "";

  if (!siteUrl) {
    console.warn(
      "[SSG] WARNING: No site URL configured. Set the Site URL in CMS Site Settings (or SITE_URL env var). Skipping canonical URLs, sitemap, and robots.txt.",
    );
  } else {
    console.log("Resolved site URL:", siteUrl);
  }

  const { data: pages, error: pagesError } = await supabase
    .from("pages")
    .select(
      "id, title, url_path, page_type, meta_title, meta_description, canonical_url, og_title, og_description, og_image, noindex, updated_at, content, schema_type, schema_data",
    )
    .eq("status", "published");

  if (pagesError) {
    console.error("Error fetching pages:", pagesError);
    process.exit(1);
  }

  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .select(
      "id, title, slug, excerpt, featured_image, category_id, content, body, meta_title, meta_description, canonical_url, og_title, og_description, og_image, noindex, updated_at, published_at, created_at, post_categories(name,slug)",
    )
    .eq("status", "published");

  if (postsError) {
    console.error("Error fetching posts:", postsError);
  }

  const templatePath = path.join(process.cwd(), "dist/spa/index.html");
  if (!fs.existsSync(templatePath)) {
    console.error("Template not found at dist/spa/index.html. Run build:client first.");
    process.exit(1);
  }

  const template = fs.readFileSync(templatePath, "utf-8");
  const publicPages = getPublicPageRoutes((pages || []) as PageRow[]);
  const pagesByPath = new Map(
    publicPages.map((page) => [normalizeCmsPath(page.url_path), page]),
  );
  const aboutPage = pagesByPath.get("/about/") || null;

  console.log(`Found ${publicPages.length} published public pages`);
  console.log(`Found ${posts?.length || 0} published posts`);

  for (const page of publicPages) {
    const normalizedPath = normalizeCmsPath(page.url_path);
    const preloadedState = buildPagePreloadedState(
      normalizedPath,
      page,
      siteSettings,
      aboutPage,
    );
    const html = buildPrerenderedHtml(template, normalizedPath, preloadedState, siteSettings);
    const outputPath = getHtmlOutputPath(normalizedPath);

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, html);
    console.log(`Generated: ${normalizedPath}`);
  }

  for (const post of (posts || []) as PostRow[]) {
    const normalizedSlug = normalizeBlogSlug(post.slug);
    if (!normalizedSlug) continue;

    const normalizedPath = buildBlogPostPath(normalizedSlug);
    const preloadedState = buildPostPreloadedState(normalizedPath, post, siteSettings);
    const html = buildPrerenderedHtml(template, normalizedPath, preloadedState, siteSettings);
    const outputPath = getHtmlOutputPath(normalizedPath);

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, html);
    console.log(`Generated post: ${normalizedPath}`);
  }

  await writeRedirects();
  writeRobots(siteUrl, siteSettings.siteNoindex);

  console.log("SSG generation complete!");
}

function buildPagePreloadedState(
  normalizedPath: string,
  page: PageRow,
  siteSettings: SiteSettings,
  aboutPage: PageRow | null,
): CmsPreloadedState {
  switch (normalizedPath) {
    case "/":
      return {
        currentPath: normalizedPath,
        siteSettings,
        routeData: { home: resolveHomePageData(page) },
      };
    case "/about/":
      return {
        currentPath: normalizedPath,
        siteSettings,
        routeData: { about: resolveAboutPageData(page) },
      };
    case "/contact/":
      return {
        currentPath: normalizedPath,
        siteSettings,
        routeData: { contact: resolveContactPageData(page) },
      };
    case "/practice-areas/":
      return {
        currentPath: normalizedPath,
        siteSettings,
        routeData: {
          practiceAreas: resolvePracticeAreasPageData(page, aboutPage),
        },
      };
    case "/blog/":
      return {
        currentPath: normalizedPath,
        siteSettings,
        routeData: { blog: resolveBlogPageData(page) },
      };
    default:
      if (isPracticeAreaPageRow(page)) {
        return {
          currentPath: normalizedPath,
          siteSettings,
          routeData: {
            practiceAreaPage: resolvePracticeAreaPageData(page),
          },
        };
      }

      return {
        currentPath: normalizedPath,
        siteSettings,
        routeData: { dynamicPage: resolveDynamicPageData(page) },
      };
  }
}

function buildPostPreloadedState(
  normalizedPath: string,
  post: PostRow,
  siteSettings: SiteSettings,
): CmsPreloadedState {
  return {
    currentPath: normalizedPath,
    siteSettings,
    routeData: {
      blogPost: resolveBlogPostData(post),
    },
  };
}

function buildPrerenderedHtml(
  template: string,
  normalizedPath: string,
  preloadedState: CmsPreloadedState,
  siteSettings: SiteSettings,
): string {
  const { html: appHtml, helmetContext } = renderCmsPage(
    normalizedPath,
    preloadedState,
  );
  const serializedState = serializeCmsPreloadedState(preloadedState);
  const analyticsScripts = buildAnalyticsScripts(siteSettings);
  const customHeadScripts = stripManagedSeoHeadTags(siteSettings.headScripts || "");
  const customFooterScripts = siteSettings.footerScripts || "";
  const preloadScript = `<script>window.__CMS_PRELOADED_STATE__=${serializedState}</script>`;
  const helmet = (helmetContext as { helmet?: Record<string, { toString(): string }> })
    .helmet;
  const helmetHead = [
    helmet?.title?.toString?.() || "",
    helmet?.meta?.toString?.() || "",
    helmet?.link?.toString?.() || "",
    helmet?.style?.toString?.() || "",
    helmet?.script?.toString?.() || "",
    helmet?.noscript?.toString?.() || "",
    helmet?.base?.toString?.() || "",
  ]
    .filter(Boolean)
    .join("\n");

  let html = stripManagedSeoHeadTags(template);
  html = html.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);

  const headInjection = [helmetHead, analyticsScripts, customHeadScripts]
    .filter(Boolean)
    .join("\n");
  html = html.replace("</head>", `${headInjection}\n</head>`);

  html = html.replace(
    /<script type="module"[^>]*><\/script>/,
    `${preloadScript}\n$&`,
  );

  if (customFooterScripts) {
    html = html.replace("</body>", `${customFooterScripts}\n</body>`);
  }

  return html;
}

function getHtmlOutputPath(normalizedPath: string): string {
  if (normalizedPath === "/") {
    return path.join(process.cwd(), "dist/spa/index.html");
  }

  return path.join(process.cwd(), "dist/spa", normalizedPath.slice(1), "index.html");
}

function buildAnalyticsScripts(siteSettings: SiteSettings): string {
  const googleTagIds = [siteSettings.ga4MeasurementId, siteSettings.googleAdsId].filter(
    (tagId, index, allTagIds): tagId is string =>
      !!tagId && allTagIds.indexOf(tagId) === index,
  );
  const googleTagLoaderId = googleTagIds[0] || null;

  if (!googleTagLoaderId) {
    return "";
  }

  const googleTagConfigCalls = googleTagIds
    .map(
      (tagId) =>
        `      gtag('config', '${escapeHtml(tagId)}');\n      window.__googleTagConfiguredIds['${escapeHtml(tagId)}'] = true;`,
    )
    .join("\n");

  return `
    <!-- Google tag (gtag.js) -->
    <script async data-google-tag-loader="true" src="https://www.googletagmanager.com/gtag/js?id=${escapeHtml(googleTagLoaderId)}"></script>
    <script data-google-tag-config="true">
      window.dataLayer = window.dataLayer || [];
      window.__googleTagConfiguredIds = window.__googleTagConfiguredIds || {};
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
${googleTagConfigCalls}
    </script>`;
}

async function writeRedirects() {
  const { data: redirects, error: redirectsError } = await supabase
    .from("redirects")
    .select("from_path, to_path, status_code")
    .eq("enabled", true);

  const functionRedirects = [
    "/sitemap.xml /.netlify/functions/sitemap 200",
    "/sitemap-pages.xml /.netlify/functions/sitemap-pages 200",
    "/sitemap-posts.xml /.netlify/functions/sitemap-posts 200",
    "/api/* /.netlify/functions/api/:splat 200",
  ].join("\n");

  if (redirectsError) {
    console.error("Error fetching redirects:", redirectsError);
    const fallbackContent = `${functionRedirects}\n/* /index.html 200`;
    fs.writeFileSync(path.join(process.cwd(), "dist/spa/_redirects"), fallbackContent);
    return;
  }

  if (redirects && redirects.length > 0) {
    const cmsRedirects = redirects
      .map((redirect: Redirect) => `${redirect.from_path} ${redirect.to_path} ${redirect.status_code}`)
      .join("\n");

    const fullRedirectsContent = `${functionRedirects}\n${cmsRedirects}\n/* /index.html 200`;
    fs.writeFileSync(
      path.join(process.cwd(), "dist/spa/_redirects"),
      fullRedirectsContent,
    );
    console.log(
      `Generated _redirects with function routes + ${redirects.length} CMS redirect(s) + SPA fallback`,
    );
    return;
  }

  const fullRedirectsContent = `${functionRedirects}\n/* /index.html 200`;
  fs.writeFileSync(path.join(process.cwd(), "dist/spa/_redirects"), fullRedirectsContent);
  console.log("Generated _redirects with function routes + SPA fallback");
}

function writeRobots(siteUrl: string, siteNoindex: boolean) {
  if (!siteUrl) {
    console.warn("[SSG] Skipping sitemap.xml and robots.txt — no site URL configured.");
    return;
  }

  const robotsTxt = siteNoindex
    ? `User-agent: *
Disallow: /`
    : `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml`;

  fs.writeFileSync(path.join(process.cwd(), "dist/spa/robots.txt"), robotsTxt);
  console.log(
    siteNoindex
      ? "Generated robots.txt with Disallow (site is noindex)"
      : "Generated robots.txt with Allow",
  );
}

generateSSG().catch((err) => {
  console.error("SSG generation failed:", err);
  process.exit(1);
});
