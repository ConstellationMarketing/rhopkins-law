import {
  buildBlogPostPath,
  getIndexablePageRoutes,
  getIndexablePostRoutes,
} from "../../client/lib/cms/publicRoutes";

interface PageRow {
  url_path: string;
  updated_at: string;
  noindex: boolean;
}

interface PostRow {
  slug: string;
  updated_at: string;
  noindex: boolean;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function generateSitemapIndex(siteUrl: string): string {
  const origin = siteUrl.replace(/\/+$/, "");
  const today = new Date().toISOString().split("T")[0];

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${escapeXml(origin)}/sitemap-pages.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${escapeXml(origin)}/sitemap-posts.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`;
}

export async function generatePagesSitemap(siteUrl: string): Promise<string> {
  const origin = siteUrl.replace(/\/+$/, "");
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  let pages: PageRow[] = [];

  if (supabaseUrl && supabaseKey) {
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/pages?status=eq.published&select=url_path,updated_at,noindex&order=url_path.asc`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        },
      );
      if (res.ok) {
        pages = await res.json();
      } else {
        console.error("[Sitemap] Pages fetch returned", res.status);
      }
    } catch (err) {
      console.error("[Sitemap] Error fetching pages:", err);
    }
  }

  const urlEntries = getIndexablePageRoutes(pages).map((page) => {
    const loc = escapeXml(`${origin}${page.url_path}`);
    const lastmod = page.updated_at
      ? `\n    <lastmod>${new Date(page.updated_at).toISOString().split("T")[0]}</lastmod>`
      : "";
    return `  <url>\n    <loc>${loc}</loc>${lastmod}\n  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join("\n")}
</urlset>`;
}

export async function generatePostsSitemap(siteUrl: string): Promise<string> {
  const origin = siteUrl.replace(/\/+$/, "");
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  let posts: PostRow[] = [];

  if (supabaseUrl && supabaseKey) {
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/posts?status=eq.published&select=slug,updated_at,noindex&order=updated_at.desc`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        },
      );
      if (res.ok) {
        posts = await res.json();
      } else {
        console.error("[Sitemap] Posts fetch returned", res.status);
      }
    } catch (err) {
      console.error("[Sitemap] Error fetching posts:", err);
    }
  }

  const urlEntries = getIndexablePostRoutes(posts).map((post) => {
    const loc = escapeXml(`${origin}${buildBlogPostPath(post.normalized_slug)}`);
    const lastmod = post.updated_at
      ? `\n    <lastmod>${new Date(post.updated_at).toISOString().split("T")[0]}</lastmod>`
      : "";
    return `  <url>\n    <loc>${loc}</loc>${lastmod}\n  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join("\n")}
</urlset>`;
}

export async function generateSitemap(siteUrl: string): Promise<string> {
  return generateSitemapIndex(siteUrl);
}
