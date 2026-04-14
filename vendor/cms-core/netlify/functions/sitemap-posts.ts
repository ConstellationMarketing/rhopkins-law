import type { Handler, HandlerEvent } from "@netlify/functions";
import {
  buildBlogPostPath,
  getIndexablePostRoutes,
} from "../../../../client/lib/cms/publicRoutes";

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

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const siteUrl = (
    process.env.URL || `https://${event.headers.host || "localhost"}`
  ).replace(/\/+$/, "");

  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase not configured");
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/posts?status=eq.published&select=slug,updated_at,noindex&order=updated_at.desc`,
      {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Supabase API returned ${response.status}`);
    }

    const posts: PostRow[] = await response.json();
    const urlEntries = getIndexablePostRoutes(posts).map((post) => {
      const loc = escapeXml(`${siteUrl}${buildBlogPostPath(post.normalized_slug)}`);
      const lastmod = post.updated_at
        ? `\n    <lastmod>${new Date(post.updated_at).toISOString().split("T")[0]}</lastmod>`
        : "";
      return `  <url>\n    <loc>${loc}</loc>${lastmod}\n  </url>`;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join("\n")}
</urlset>`;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
      body: xml,
    };
  } catch (err) {
    console.error("[sitemap-posts] Error:", err);
    return {
      statusCode: 500,
      body: "Internal Server Error",
    };
  }
};
