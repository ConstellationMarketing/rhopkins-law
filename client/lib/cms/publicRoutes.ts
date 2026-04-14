export interface PublicPageRouteLike {
  url_path: string;
  updated_at: string;
  noindex: boolean;
}

export interface PublicPostRouteLike {
  slug: string;
  updated_at: string;
  noindex: boolean;
}

export function normalizeCmsPath(pathname?: string | null): string {
  if (!pathname || pathname === "/") {
    return "/";
  }

  const collapsed = pathname.replace(/\/{2,}/g, "/");
  const withLeadingSlash = collapsed.startsWith("/") ? collapsed : `/${collapsed}`;
  return withLeadingSlash.endsWith("/")
    ? withLeadingSlash
    : `${withLeadingSlash}/`;
}

export function normalizeBlogSlug(slug?: string | null): string {
  return (slug || "").replace(/^\/+|\/+$/g, "");
}

export function buildBlogPostPath(slug?: string | null): string {
  const normalizedSlug = normalizeBlogSlug(slug);
  return normalizedSlug ? `/blog/${normalizedSlug}/` : "/blog/";
}

export function isPublicCmsPath(pathname?: string | null): boolean {
  return !normalizeCmsPath(pathname).startsWith("/admin/");
}

export function getPublicPageRoutes<T extends PublicPageRouteLike>(pages: T[]): T[] {
  return pages
    .map((page) => ({ ...page, url_path: normalizeCmsPath(page.url_path) }))
    .filter((page) => isPublicCmsPath(page.url_path));
}

export function getIndexablePageRoutes<T extends PublicPageRouteLike>(pages: T[]): T[] {
  return getPublicPageRoutes(pages).filter((page) => !page.noindex);
}

export function getIndexablePostRoutes<T extends PublicPostRouteLike>(posts: T[]): Array<T & { normalized_slug: string; url_path: string }> {
  return posts
    .map((post) => {
      const normalized_slug = normalizeBlogSlug(post.slug);
      return {
        ...post,
        normalized_slug,
        url_path: buildBlogPostPath(normalized_slug),
      };
    })
    .filter((post) => !post.noindex && !!post.normalized_slug);
}
