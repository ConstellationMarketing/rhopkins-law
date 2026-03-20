import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Layout from "@site/components/layout/Layout";
import Seo from "@site/components/Seo";
import BlockRenderer from "@site/components/BlockRenderer";
import NotFound from "./NotFound";
import type { PageMeta } from "@site/lib/cms/pageMeta";
import { emptyPageMeta } from "@site/lib/cms/pageMeta";
import { consumePageData } from "@site/lib/pageDataInjection";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

interface CmsPage {
  title: string;
  content: unknown;
  meta: PageMeta;
}

/** In-memory cache keyed by url_path */
const pageCache = new Map<string, CmsPage>();

export default function DynamicPage() {
  const { pathname } = useLocation();

  // Consume SSG-injected data synchronously before first render
  const injected = consumePageData(pathname);
  const initialPage = injected ? {
    title: injected.title || '',
    content: injected.content,
    meta: injected.meta ?? emptyPageMeta,
  } as CmsPage : null;

  // Seed cache so useEffect fetch skips
  if (initialPage) {
    const queryPath = pathname === '/' ? '/' : pathname.endsWith('/') ? pathname : pathname + '/';
    if (!pageCache.has(queryPath)) {
      pageCache.set(queryPath, initialPage);
    }
  }

  const [page, setPage] = useState<CmsPage | null>(initialPage);
  const [isLoading, setIsLoading] = useState(!initialPage);
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
      // Ensure trailing slash so DB query matches stored url_path values (e.g. /about/)
      // The root "/" is kept as-is.
      const queryPath =
        pathname === '/' ? '/' : pathname.endsWith('/') ? pathname : pathname + '/';

      // Check cache first (keyed on normalised path)
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

        const row = data[0];
        const cmsPage: CmsPage = {
          title: row.title || "",
          content: row.content,
          meta: {
            meta_title: row.meta_title,
            meta_description: row.meta_description,
            canonical_url: row.canonical_url,
            og_title: row.og_title,
            og_description: row.og_description,
            og_image: row.og_image,
            noindex: row.noindex,
            schema_type: row.schema_type,
            schema_data: row.schema_data,
          },
        };

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
  }, [pathname]);

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-[#183658]" />
        </div>
      </Layout>
    );
  }

  // Not found
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
