import type { PageMeta } from './cms/pageMeta';

/** Shape of window.__PAGE_DATA__ injected by SSG */
export interface InjectedPageData {
  urlPath: string;
  title?: string;
  content?: unknown;
  meta: PageMeta;
  post?: InjectedPostData;
}

export interface InjectedPostData {
  id: string;
  title: string;
  slug: string;
  body: string | null;
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
  published_at: string | null;
  created_at: string;
  post_categories: { name: string; slug: string } | null;
}

declare global {
  interface Window {
    __PAGE_DATA__?: InjectedPageData;
  }
}

/**
 * Consume injected page data if it matches the given URL path.
 * Returns the data and clears window.__PAGE_DATA__ (one-time use).
 * Returns null for client-side navigations (no injected data).
 */
export function consumePageData(urlPath: string): InjectedPageData | null {
  if (typeof window === 'undefined' || !window.__PAGE_DATA__) return null;

  const data = window.__PAGE_DATA__;
  const normalize = (p: string) => (p === '/' ? '/' : p.replace(/\/?$/, '/'));

  if (normalize(data.urlPath) !== normalize(urlPath)) return null;

  // Clear to prevent stale data on client-side navigation
  delete window.__PAGE_DATA__;
  return data;
}
