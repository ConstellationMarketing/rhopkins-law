import { createClient } from '@supabase/supabase-js';
import { defaultPracticeAreaPageContent } from '../../../client/lib/cms/practiceAreaPageTypes';
import {
  escapeHtml,
  normalizeSeoPath,
  renderSeoHeadTags,
  resolveSeo,
  stripManagedSeoHeadTags,
} from '../../../client/lib/seo';
import fs from 'fs';
import path from 'path';
import type { Database } from '../client/lib/database.types';
// NOTE: JSON-LD schemas remain client-side only to avoid duplicate structured
// data when React Helmet updates the page after hydration.

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.log('Supabase credentials not configured. Skipping SSG generation.');
  console.log('To enable SSG, set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(0);
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceRoleKey);

interface Page {
  id: string;
  title: string;
  url_path: string;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  noindex: boolean;
  updated_at: string;
  content: unknown;
  schema_type: string | null;
  schema_data: Record<string, unknown> | null;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  category_id: string | null;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  noindex: boolean;
  updated_at: string;
  body: string | null;
  schema_type: string | null;
  schema_data: Record<string, unknown> | null;
  published_at: string | null;
  created_at: string;
  post_categories: { name: string; slug: string } | null;
}

interface Redirect {
  from_path: string;
  to_path: string;
  status_code: number;
}

interface NavigationItem {
  label: string;
  href: string;
  order?: number;
  children?: { label: string; href: string }[];
}

interface FooterLink {
  label: string;
  href?: string;
}

interface SocialLink {
  platform: string;
  url: string;
  enabled: boolean;
}

interface SiteSettings {
  site_url: string | null;
  site_noindex: boolean;
  site_name: string | null;
  ga4_measurement_id: string | null;
  google_ads_id: string | null;
  google_ads_conversion_label: string | null;
  head_scripts: string | null;
  footer_scripts: string | null;
  navigation_items: NavigationItem[] | null;
  footer_about_links: FooterLink[] | null;
  footer_practice_links: FooterLink[] | null;
  global_schema: string | null;
  phone_number: string | null;
  phone_display: string | null;
  address_line1: string | null;
  address_line2: string | null;
  logo_url: string | null;
  social_links: SocialLink[] | null;
}

/**
 * One-time restore: re-creates the /practice-areas/practice-area/ template page
 * if it was accidentally deleted from the database. Idempotent — skips silently
 * when the page already exists.
 */
async function ensurePracticeAreaPage() {
  if (!supabaseServiceRoleKey) {
    console.log('[ensurePracticeAreaPage] No service role key — skipping.');
    return;
  }

  const PA_URL = '/practice-areas/practice-area/';

  const { data: existing, error: checkError } = await supabase
    .from('pages')
    .select('id')
    .eq('url_path', PA_URL)
    .maybeSingle();

  if (checkError) {
    console.error('[ensurePracticeAreaPage] Error checking for page:', checkError.message);
    return;
  }

  if (existing) {
    console.log(`[ensurePracticeAreaPage] Page ${PA_URL} already exists (id=${existing.id}). Nothing to do.`);
    return;
  }

  // Page is missing — insert it with full default content
  const { data: inserted, error: insertError } = await supabase
    .from('pages')
    .insert({
      title: 'Practice Area',
      url_path: PA_URL,
      page_type: 'practice',
      status: 'published',
      content: defaultPracticeAreaPageContent as unknown as Record<string, unknown>,
    })
    .select('id')
    .single();

  if (insertError || !inserted) {
    console.error('[ensurePracticeAreaPage] Failed to insert page:', insertError?.message ?? 'unknown error');
    return;
  }

  console.log(`[ensurePracticeAreaPage] Restored ${PA_URL} (id=${inserted.id}) with default content.`);
}

async function generateSSG() {
  console.log('Starting SSG generation...');

  // Restore the practice-area template page if it was accidentally deleted
  await ensurePracticeAreaPage();

  // 0. Fetch site settings for analytics, scripts, and schema generation
  const { data: siteSettingsData } = await supabase
    .from('site_settings')
    .select('site_url, site_noindex, site_name, ga4_measurement_id, google_ads_id, google_ads_conversion_label, head_scripts, footer_scripts, navigation_items, footer_about_links, footer_practice_links, global_schema, phone_number, phone_display, address_line1, address_line2, logo_url, social_links')
    .eq('settings_key', 'global')
    .single();

  const siteSettings: SiteSettings = siteSettingsData || {
    site_url: null,
    site_noindex: false,
    site_name: null,
    ga4_measurement_id: null,
    google_ads_id: null,
    google_ads_conversion_label: null,
    head_scripts: null,
    footer_scripts: null,
    navigation_items: null,
    footer_about_links: null,
    footer_practice_links: null,
    global_schema: null,
    phone_number: null,
    phone_display: null,
    address_line1: null,
    address_line2: null,
    logo_url: null,
    social_links: null,
  };

  console.log('Site settings loaded:', {
    siteNoindex: siteSettings.site_noindex,
    hasGA4: !!siteSettings.ga4_measurement_id,
    hasGoogleAds: !!siteSettings.google_ads_id,
    hasHeadScripts: !!siteSettings.head_scripts,
    hasFooterScripts: !!siteSettings.footer_scripts,
  });

  // Resolve site URL: env var override > DB site setting
  const siteUrl = (process.env.SITE_URL || siteSettings.site_url || '').replace(/\/+$/, '');

  if (!siteUrl) {
    console.warn('[SSG] WARNING: No site URL configured. Set the Site URL in CMS Site Settings (or SITE_URL env var). Skipping canonical URLs, sitemap, and robots.txt.');
  } else {
    console.log('Resolved site URL:', siteUrl);
  }

  // 1. Fetch all published pages (including content + schema fields for SSG rendering)
  const { data: pages, error: pagesError } = await supabase
    .from('pages')
    .select('id, title, url_path, meta_title, meta_description, canonical_url, og_title, og_description, og_image, noindex, updated_at, content, schema_type, schema_data')
    .eq('status', 'published');

  if (pagesError) {
    console.error('Error fetching pages:', pagesError);
    process.exit(1);
  }

  console.log(`Found ${pages?.length || 0} published pages`);

  // 2. Read the SPA index.html as template
  const templatePath = path.join(process.cwd(), 'dist/spa/index.html');
  if (!fs.existsSync(templatePath)) {
    console.error('Template not found at dist/spa/index.html. Run build:client first.');
    process.exit(1);
  }

  const template = fs.readFileSync(templatePath, 'utf-8');


  // 3. For each page, generate static HTML with SEO meta tags
  // First pass: collect post URLs before generating (need for crawlable body)
  // We'll do a two-pass: fetch posts first, then generate all HTML

  // 3b. Fetch blog posts (including body + schema fields for SSG rendering)
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, featured_image, category_id, meta_title, meta_description, canonical_url, og_title, og_description, og_image, noindex, updated_at, body, schema_type, schema_data, published_at, created_at, post_categories(name,slug)')
    .eq('status', 'published');

  if (postsError) {
    console.error('Error fetching posts:', postsError);
  }

  console.log(`Found ${posts?.length || 0} published posts`);

  // Now generate page HTML
  for (const page of pages || []) {
    const html = generatePageHTML(template, page, siteSettings, siteUrl);

    let outputPath: string;
    if (page.url_path === '/') {
      outputPath = path.join(process.cwd(), 'dist/spa/index.html');
    } else {
      const pagePath = page.url_path.startsWith('/') ? page.url_path.slice(1) : page.url_path;
      outputPath = path.join(process.cwd(), 'dist/spa', pagePath, 'index.html');
    }

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, html);
    console.log(`Generated: ${page.url_path}`);
  }

  // Generate blog post HTML
  for (const post of posts || []) {
    const normalizedSlug = post.slug.replace(/^\/+|\/+$/g, '');
    if (!normalizedSlug) continue;

    const postAsPage: Page = {
      id: post.id,
      title: post.title,
      url_path: `/blog/${normalizedSlug}/`,
      meta_title: post.meta_title,
      meta_description: post.meta_description,
      canonical_url: post.canonical_url,
      og_title: post.og_title,
      og_description: post.og_description,
      og_image: post.og_image || post.featured_image,
      noindex: post.noindex,
      updated_at: post.updated_at,
      content: null,
      schema_type: post.schema_type,
      schema_data: post.schema_data,
    };

    const html = generatePageHTML(template, postAsPage, siteSettings, siteUrl, post);
    const outputPath = path.join(process.cwd(), 'dist/spa', 'blog', normalizedSlug, 'index.html');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, html);
    console.log(`Generated post: /blog/${normalizedSlug}/`);
  }

  // 4. Fetch and generate _redirects
  const { data: redirects, error: redirectsError } = await supabase
    .from('redirects')
    .select('from_path, to_path, status_code')
    .eq('enabled', true);

  // Sitemap and API function routes — must appear before the /* catch-all so
  // Netlify routes them to the correct functions even when _redirects is present.
  const functionRedirects = [
    '/sitemap.xml /.netlify/functions/sitemap 200',
    '/sitemap-pages.xml /.netlify/functions/sitemap-pages 200',
    '/sitemap-posts.xml /.netlify/functions/sitemap-posts 200',
    '/api/* /.netlify/functions/api/:splat 200',
  ].join('\n');

  if (redirectsError) {
    console.error('Error fetching redirects:', redirectsError);
  } else if (redirects && redirects.length > 0) {
    const cmsRedirects = redirects
      .map((r: Redirect) => `${r.from_path} ${r.to_path} ${r.status_code}`)
      .join('\n');

    // Function routes → CMS redirects → SPA catch-all
    const fullRedirectsContent =
      functionRedirects + '\n' + cmsRedirects + '\n/* /index.html 200';
    fs.writeFileSync(path.join(process.cwd(), 'dist/spa/_redirects'), fullRedirectsContent);
    console.log(`Generated _redirects with function routes + ${redirects.length} CMS redirect(s) + SPA fallback`);
  } else {
    // Function routes → SPA catch-all
    const fullRedirectsContent =
      functionRedirects + '\n/* /index.html 200';
    fs.writeFileSync(path.join(process.cwd(), 'dist/spa/_redirects'), fullRedirectsContent);
    console.log('Generated _redirects with function routes + SPA fallback');
  }

  // 5. Generate robots.txt (only if site URL is configured)
  // Note: sitemap.xml, sitemap-pages.xml, and sitemap-posts.xml are served by
  // Netlify functions (via _redirects above) — no static file generation needed.
  if (siteUrl) {
    // 6. Generate robots.txt (conditional based on site_noindex)
    let robotsTxt: string;
    if (siteSettings.site_noindex) {
      robotsTxt = `User-agent: *
Disallow: /`;
      console.log('Generated robots.txt with Disallow (site is noindex)');
    } else {
      robotsTxt = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml`;
      console.log('Generated robots.txt with Allow');
    }
    fs.writeFileSync(path.join(process.cwd(), 'dist/spa/robots.txt'), robotsTxt);
  } else {
    console.warn('[SSG] Skipping sitemap.xml and robots.txt — no site URL configured.');
  }

  console.log('SSG generation complete!');
}

function generatePageHTML(
  template: string,
  page: Page,
  siteSettings: SiteSettings,
  siteUrl: string,
  blogPost?: Post | null,
): string {
  const trailingSlashPath = normalizeSeoPath(page.url_path);
  const seo = resolveSeo({
    title: page.meta_title || page.title,
    description: page.meta_description,
    canonical: page.canonical_url,
    image: page.og_image,
    noindex: page.noindex,
    ogTitle: page.og_title,
    ogDescription: page.og_description,
    ogImage: page.og_image,
    pathname: trailingSlashPath,
    fallbackTitle: page.title,
    siteSettings: {
      siteName: siteSettings.site_name,
      siteUrl,
      siteNoindex: siteSettings.site_noindex,
    },
  });

  let analyticsScripts = '';

  if (siteSettings.ga4_measurement_id) {
    analyticsScripts += `
    <!-- Google Analytics 4 -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=${escapeHtml(siteSettings.ga4_measurement_id)}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${escapeHtml(siteSettings.ga4_measurement_id)}');
    </script>`;
  }

  if (siteSettings.google_ads_id) {
    if (!siteSettings.ga4_measurement_id) {
      analyticsScripts += `
    <!-- Google Ads -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=${escapeHtml(siteSettings.google_ads_id)}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
    </script>`;
    }
    analyticsScripts += `
    <script>
      gtag('config', '${escapeHtml(siteSettings.google_ads_id)}');
    </script>`;
  }

  const customHeadScripts = stripManagedSeoHeadTags(siteSettings.head_scripts || '');
  const customFooterScripts = siteSettings.footer_scripts || '';

  let html = stripManagedSeoHeadTags(template);

  const pageDataPayload: Record<string, unknown> = {
    urlPath: trailingSlashPath,
    title: page.title,
    content: page.content,
    meta: {
      meta_title: page.meta_title,
      meta_description: page.meta_description,
      canonical_url: page.canonical_url,
      og_title: page.og_title,
      og_description: page.og_description,
      og_image: page.og_image,
      noindex: page.noindex,
      schema_type: page.schema_type,
      schema_data: page.schema_data,
    },
  };

  if (blogPost) {
    pageDataPayload.post = {
      id: blogPost.id,
      title: blogPost.title,
      slug: blogPost.slug,
      body: blogPost.body,
      excerpt: blogPost.excerpt ?? null,
      featured_image: blogPost.featured_image,
      category_id: blogPost.category_id ?? null,
      meta_title: blogPost.meta_title,
      meta_description: blogPost.meta_description,
      canonical_url: blogPost.canonical_url,
      og_title: blogPost.og_title,
      og_description: blogPost.og_description,
      og_image: blogPost.og_image,
      noindex: blogPost.noindex,
      published_at: blogPost.published_at ?? null,
      created_at: blogPost.created_at ?? null,
      post_categories: blogPost.post_categories ?? null,
    };
  }

  const dataScript = `<script>window.__PAGE_DATA__=${JSON.stringify(pageDataPayload)}</script>`;
  const headInjection = [renderSeoHeadTags(seo), analyticsScripts, customHeadScripts, dataScript]
    .filter(Boolean)
    .join('\n');

  html = html.replace('</head>', `${headInjection}\n</head>`);

  if (customFooterScripts) {
    html = html.replace('</body>', `${customFooterScripts}\n</body>`);
  }

  return html;
}

generateSSG().catch(err => {
  console.error('SSG generation failed:', err);
  process.exit(1);
});
