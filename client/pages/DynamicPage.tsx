import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import Layout from "@site/components/layout/Layout";
import Seo from "@site/components/Seo";
import BlockRenderer from "@site/components/BlockRenderer";
import NotFound from "./NotFound";
import type { PageMeta } from "@site/lib/cms/pageMeta";
import { getCmsPreloadedRouteData } from "@site/lib/cms/preloadedState";
import { normalizeCmsPath } from "@site/lib/cms/publicRoutes";
import type { PracticeAreaPageContent } from "@site/lib/cms/practiceAreaPageTypes";
import {
  isPracticeAreaPageRow,
  resolveDynamicPageData,
  resolvePracticeAreaPageData,
  type CmsPageRow,
} from "@site/lib/cms/sharedPageData";
import { getPublicEnv } from "@site/lib/runtimeEnv";
import { PracticeAreaPageView } from "./PracticeAreaPage";

const SUPABASE_URL = getPublicEnv("VITE_SUPABASE_URL");
const SUPABASE_ANON_KEY = getPublicEnv("VITE_SUPABASE_ANON_KEY");

type DynamicCmsPage = {
  kind: "dynamic";
  title: string;
  content: unknown;
  meta: PageMeta;
};

type PracticeCmsPage = {
  kind: "practice";
  title: string;
  content: PracticeAreaPageContent;
  meta: PageMeta;
};

type CmsPage = DynamicCmsPage | PracticeCmsPage;

const pageCache = new Map<string, CmsPage>();

function resolvePreloadedPage(queryPath: string): CmsPage | null {
  const routeData = getCmsPreloadedRouteData(queryPath);

  if (routeData?.practiceAreaPage) {
    return {
      kind: "practice",
      ...routeData.practiceAreaPage,
    };
  }

  if (!routeData?.dynamicPage) {
    return null;
  }

  if (isPracticeAreaPageRow(routeData.dynamicPage as CmsPageRow)) {
    const practicePage = resolvePracticeAreaPageData(
      routeData.dynamicPage as CmsPageRow,
    );

    return {
      kind: "practice",
      ...practicePage,
    };
  }

  return {
    kind: "dynamic",
    ...routeData.dynamicPage,
  };
}

function resolveCmsPage(row: CmsPageRow): CmsPage {
  if (isPracticeAreaPageRow(row)) {
    return {
      kind: "practice",
      ...resolvePracticeAreaPageData(row),
    };
  }

  return {
    kind: "dynamic",
    ...resolveDynamicPageData(row),
  };
}

export default function DynamicPage() {
  const { pathname } = useLocation();
  const queryPath = normalizeCmsPath(pathname);
  const preloaded = resolvePreloadedPage(queryPath);

  if (preloaded && !pageCache.has(queryPath)) {
    pageCache.set(queryPath, preloaded);
  }

  const [page, setPage] = useState<CmsPage | null>(
    preloaded || pageCache.get(queryPath) || null,
  );
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
          `${SUPABASE_URL}/rest/v1/pages?url_path=eq.${encodeURIComponent(queryPath)}&status=eq.published&select=title,content,page_type,meta_title,meta_description,canonical_url,og_title,og_description,og_image,noindex,schema_type,schema_data`,
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

        const cmsPage = resolveCmsPage(data[0]);
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

  if (page.kind === "practice") {
    return (
      <PracticeAreaPageView
        content={page.content}
        meta={page.meta}
        title={page.title}
      />
    );
  }

  return (
    <Layout>
      <Seo
        title={page.meta.meta_title || page.title}
        description={page.meta.meta_description || undefined}
        canonical={page.meta.canonical_url || undefined}
        ogTitle={page.meta.og_title || undefined}
        ogDescription={page.meta.og_description || undefined}
        ogImage={page.meta.og_image || undefined}
        noindex={page.meta.noindex || false}
        schemaType={page.meta.schema_type || undefined}
        schemaData={page.meta.schema_data || undefined}
        pageContent={page.content}
      />
      <BlockRenderer content={page.content as any} />
    </Layout>
  );
}
