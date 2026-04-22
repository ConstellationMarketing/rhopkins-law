export interface SeoSiteSettingsInput {
  siteName?: string | null;
  siteUrl?: string | null;
  siteNoindex?: boolean | null;
}

export interface ResolveSeoInput {
  title?: string | null;
  description?: string | null;
  canonical?: string | null;
  image?: string | null;
  noindex?: boolean | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  pathname?: string | null;
  fallbackTitle?: string | null;
  siteSettings?: SeoSiteSettingsInput | null;
}

export interface ResolvedSeo {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
  noindex: boolean;
  robots?: string;
  ogTitle: string;
  ogDescription: string;
  ogImage?: string;
}

const DEFAULT_DESCRIPTION =
  'Protecting your rights with integrity, experience, and relentless advocacy.';

const MANAGED_META_NAMES = [
  'description',
  'robots',
  'twitter:card',
  'twitter:title',
  'twitter:description',
  'twitter:image',
];

const MANAGED_META_PROPERTIES = [
  'og:title',
  'og:description',
  'og:type',
  'og:url',
  'og:image',
];

const SAFE_NON_HTTP_PROTOCOL_RE = /^(mailto|tel):/i;
const ABSOLUTE_HTTP_URL_RE = /^https?:\/\//i;
const PROTOCOL_RELATIVE_URL_RE = /^\/\//;
const SITE_RELATIVE_PATH_RE = /^\/(?!\/)/;
const HASH_OR_QUERY_RE = /^(#|\?)/;
const MALFORMED_HTTP_PATH_RE = /^https?:\/\/\/+(.+)$/i;
const CUSTOM_PROTOCOL_RE = /^[a-z][a-z\d+.-]*:/i;

function cleanValue(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function normalizeSiteUrl(value?: string | null): string | undefined {
  const cleaned = cleanValue(value)?.replace(/\/+$/, '');

  if (!cleaned) {
    return undefined;
  }

  if (/^[a-z]+:\/\//i.test(cleaned)) {
    return cleaned;
  }

  return `https://${cleaned}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function normalizeSeoPath(pathname?: string | null): string {
  if (!pathname || pathname === '/') {
    return '/';
  }

  return pathname.endsWith('/') ? pathname : `${pathname}/`;
}

export function normalizeCmsLinkHref(
  href?: string | null,
  siteUrl?: string | null,
): string | undefined {
  const cleaned = cleanValue(href);
  const normalizedSiteUrl = normalizeSiteUrl(siteUrl);

  if (!cleaned) {
    return undefined;
  }

  if (HASH_OR_QUERY_RE.test(cleaned)) {
    return cleaned;
  }

  if (SAFE_NON_HTTP_PROTOCOL_RE.test(cleaned) || ABSOLUTE_HTTP_URL_RE.test(cleaned)) {
    return cleaned;
  }

  if (PROTOCOL_RELATIVE_URL_RE.test(cleaned)) {
    return `https:${cleaned}`;
  }

  const malformedPathMatch = cleaned.match(MALFORMED_HTTP_PATH_RE);
  if (malformedPathMatch) {
    const normalizedPath = `/${malformedPathMatch[1].replace(/^\/+/, '')}`;
    return normalizedSiteUrl ? `${normalizedSiteUrl}${normalizedPath}` : normalizedPath;
  }

  if (SITE_RELATIVE_PATH_RE.test(cleaned)) {
    return normalizedSiteUrl ? `${normalizedSiteUrl}${cleaned}` : cleaned;
  }

  if (CUSTOM_PROTOCOL_RE.test(cleaned)) {
    return '#';
  }

  return `https://${cleaned.replace(/^\/+/, '')}`;
}

export function normalizeHtmlAnchorHrefs(
  html?: string | null,
  siteUrl?: string | null,
): string {
  if (!html) {
    return '';
  }

  return html.replace(
    /(<a\b[^>]*\bhref\s*=\s*)(["'])(.*?)\2/gi,
    (match, prefix: string, quote: string, href: string) => {
      const normalizedHref = normalizeCmsLinkHref(href, siteUrl);
      if (!normalizedHref) {
        return match;
      }

      return `${prefix}${quote}${normalizedHref}${quote}`;
    },
  );
}

export function resolveSeo(input: ResolveSeoInput): ResolvedSeo {
  const siteName = cleanValue(input.siteSettings?.siteName);
  const siteUrl = normalizeSiteUrl(input.siteSettings?.siteUrl);
  const normalizedPathname = normalizeSeoPath(input.pathname);
  const title = cleanValue(input.title) || cleanValue(input.fallbackTitle) || siteName || '';
  const description = cleanValue(input.description) || DEFAULT_DESCRIPTION;
  const canonical =
    cleanValue(input.canonical) ||
    (siteUrl ? `${siteUrl}${normalizedPathname}` : undefined);
  const image = cleanValue(input.image) || (siteUrl ? `${siteUrl}/og-image.jpg` : undefined);
  const resolvedTitle = title;
  const noindex = Boolean(input.noindex || input.siteSettings?.siteNoindex);

  return {
    title: resolvedTitle,
    description,
    canonical,
    image,
    noindex,
    robots: noindex ? 'noindex, nofollow' : undefined,
    ogTitle: cleanValue(input.ogTitle) || resolvedTitle,
    ogDescription: cleanValue(input.ogDescription) || description,
    ogImage: cleanValue(input.ogImage) || image,
  };
}

export function renderSeoHeadTags(seo: ResolvedSeo): string {
  const tags = [
    `<title data-rh="true">${escapeHtml(seo.title)}</title>`,
    `<meta data-rh="true" name="description" content="${escapeHtml(seo.description)}">`,
  ];

  if (seo.robots) {
    tags.push(
      `<meta data-rh="true" name="robots" content="${escapeHtml(seo.robots)}">`,
    );
  }

  if (seo.canonical) {
    tags.push(
      `<link data-rh="true" rel="canonical" href="${escapeHtml(seo.canonical)}">`,
      `<meta data-rh="true" property="og:url" content="${escapeHtml(seo.canonical)}">`,
    );
  }

  tags.push(
    `<meta data-rh="true" property="og:title" content="${escapeHtml(seo.ogTitle)}">`,
    `<meta data-rh="true" property="og:description" content="${escapeHtml(seo.ogDescription)}">`,
    '<meta data-rh="true" property="og:type" content="website">',
    '<meta data-rh="true" name="twitter:card" content="summary_large_image">',
    `<meta data-rh="true" name="twitter:title" content="${escapeHtml(seo.ogTitle)}">`,
    `<meta data-rh="true" name="twitter:description" content="${escapeHtml(seo.ogDescription)}">`,
  );

  if (seo.ogImage) {
    tags.push(
      `<meta data-rh="true" property="og:image" content="${escapeHtml(seo.ogImage)}">`,
      `<meta data-rh="true" name="twitter:image" content="${escapeHtml(seo.ogImage)}">`,
    );
  }

  return tags.join('\n');
}

export function stripManagedSeoHeadTags(html: string): string {
  let sanitized = html;

  sanitized = sanitized.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '');
  sanitized = sanitized.replace(
    /<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/gi,
    '',
  );

  for (const name of MANAGED_META_NAMES) {
    sanitized = sanitized.replace(
      new RegExp(
        `<meta\\b(?=[^>]*\\bname=["']${escapeRegExp(name)}["'])[^>]*>`,
        'gi',
      ),
      '',
    );
  }

  for (const property of MANAGED_META_PROPERTIES) {
    sanitized = sanitized.replace(
      new RegExp(
        `<meta\\b(?=[^>]*\\bproperty=["']${escapeRegExp(property)}["'])[^>]*>`,
        'gi',
      ),
      '',
    );
  }

  return sanitized;
}
