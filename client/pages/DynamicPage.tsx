import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import Layout from "@site/components/layout/Layout";
import Seo from "@site/components/Seo";
import BlockRenderer from "@site/components/BlockRenderer";
import NotFound from "./NotFound";
import type { PageMeta } from "@site/lib/cms/pageMeta";
import { emptyPageMeta } from "@site/lib/cms/pageMeta";
import { getCmsPreloadedRouteData } from "@site/lib/cms/preloadedState";
import { normalizeCmsPath } from "@site/lib/cms/publicRoutes";
import { resolveDynamicPageData } from "@site/lib/cms/sharedPageData";
import { getPublicEnv } from "@site/lib/runtimeEnv";

const SUPABASE_URL = getPublicEnv("VITE_SUPABASE_URL");
const SUPABASE_ANON_KEY = getPublicEnv("VITE_SUPABASE_ANON_KEY");

interface CmsPage {
  title: string;
  content: unknown;
  meta: PageMeta;
}

const pageCache = new Map<string, CmsPage>();

export default function DynamicPage() {
  const { pathname } = useLocation();
  const queryPath = normalizeCmsPath(pathname);
  const preloaded = getCmsPreloadedRouteData(queryPath)?.dynamicPage ?? null;

  if (preloaded && !pageCache.has(queryPath)) {
    pageCache.set(queryPath, preloaded);
  }

  const [page, setPage] = useState<CmsPage | null>(preloaded || pageCache.get(queryPath) || null);
  const [isLoading, setIsLoading] = useState(!preloaded && !pageCache.has(queryPath));
  const [notFound, setNotFound] = useState(false);
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname;
      setIsLoading(true);
      setNotFound(false);
      setPage(null);
    }

    let isMounted = true;

    async function fetchPage() {
      const cached = pageCache.get(queryPath);
      if (cached) {
        if (isMounted) {
          setPage(cached);
          setIsLoading(false);
          setNotFound(false);
        }
        return;
      }

      try {
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/pages?url_path=eq.${encodeURIComponent(queryPath)}&status=eq.published&select=title,content,meta_title,meta_description,canonical_url,og_title,og_description,og_image,noindex,schema_type,schema_data`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
          if (isMounted) {
            setNotFound(true);
            setIsLoading(false);
          }
          return;
        }

        const cmsPage = resolveDynamicPageData(data[0]);
        pageCache.set(queryPath, cmsPage);

        if (isMounted) {
          setPage(cmsPage);
          setNotFound(false);
        }
      } catch (err) {
        console.error("[DynamicPage] Failed to fetch CMS page:", err);
        if (isMounted) {
          setNotFound(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchPage();

    return () => {
      isMounted = false;
    };
  }, [pathname, queryPath]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-[#183658]" />
        </div>
      </Layout>
    );
  }

  if (notFound || !page) {
    return <NotFound />;
  }

  const { title, content, meta } = page;

  return (
    <Layout>
      <Seo
        title={meta.meta_title || title}
        description={meta.meta_description || undefined}
        canonical={meta.canonical_url || undefined}
        ogTitle={meta.og_title || undefined}
        ogDescription={meta.og_description || undefined}
        ogImage={meta.og_image || undefined}
        noindex={meta.noindex || false}
        schemaType={meta.schema_type || undefined}
        schemaData={meta.schema_data || undefined}
        pageContent={content}
      />
      <BlockRenderer content={content as any} />
    </Layout>
  );
}
