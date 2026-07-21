/** SEO / meta fields stored on each page row in the CMS */
export interface PageMeta {
  meta_title?: string | null;
  meta_description?: string | null;
  canonical_url?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image?: string | null;
  noindex?: boolean;
  schema_type?: string | null;
  schema_data?: Record<string, unknown> | null;
  published_at?: string | null;
  show_published_date?: boolean | null;
}

/** Empty default – used when CMS returns no meta */
export const emptyPageMeta: PageMeta = {};
