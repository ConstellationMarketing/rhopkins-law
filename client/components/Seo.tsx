import { Helmet } from '@site/lib/helmet';
import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { buildAllSchemas, type SchemaInput } from '@site/lib/schemaHelpers';
import { useSiteSettings } from '@site/contexts/SiteSettingsContext';
import { resolveSeo } from '@site/lib/seo';
import { getPublicEnv } from '@site/lib/runtimeEnv';

interface SeoProps {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  noindex?: boolean;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  schemaType?: string | string[] | null;
  schemaData?: Record<string, unknown> | null;
  pageContent?: unknown;
}

export default function Seo({
  title,
  description,
  canonical,
  image,
  noindex = false,
  ogTitle,
  ogDescription,
  ogImage,
  schemaType,
  schemaData,
  pageContent,
}: SeoProps) {
  const { pathname } = useLocation();
  const { settings } = useSiteSettings();

  const seo = resolveSeo({
    title,
    description,
    canonical,
    image,
    noindex,
    ogTitle,
    ogDescription,
    ogImage,
    pathname,
    fallbackTitle: typeof document !== 'undefined' ? document.title : '',
    siteSettings: {
      siteName: settings.siteName,
      siteUrl: settings.siteUrl || getPublicEnv('VITE_SITE_URL') || '',
      siteNoindex: settings.siteNoindex,
    },
  });

  const schemas = useMemo(() => {
    if (!schemaType && !pageContent) return [];

    const input: SchemaInput = {
      title: seo.title,
      description: seo.description,
      url: seo.canonical || (typeof window !== 'undefined' ? window.location.href : ''),
      image: seo.ogImage,
      schemaType,
      schemaData,
      pageContent,
      siteSettings: settings,
    };

    return buildAllSchemas(input);
  }, [schemaType, schemaData, pageContent, settings, seo]);

  return (
    <Helmet>
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />

      {seo.robots && <meta name="robots" content={seo.robots} />}

      {seo.canonical && <link rel="canonical" href={seo.canonical} />}

      <meta property="og:title" content={seo.ogTitle} />
      <meta property="og:description" content={seo.ogDescription} />
      <meta property="og:type" content="website" />
      {seo.canonical && <meta property="og:url" content={seo.canonical} />}
      {seo.ogImage && <meta property="og:image" content={seo.ogImage} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seo.ogTitle} />
      <meta name="twitter:description" content={seo.ogDescription} />
      {seo.ogImage && <meta name="twitter:image" content={seo.ogImage} />}

      {schemas.map((schema, i) => (
        <script key={`ld-json-${i}`} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}

      {settings.globalSchema && (() => {
        try {
          const parsed = JSON.parse(settings.globalSchema);
          return (
            <script type="application/ld+json">
              {JSON.stringify(parsed)}
            </script>
          );
        } catch {
          return null;
        }
      })()}
    </Helmet>
  );
}
