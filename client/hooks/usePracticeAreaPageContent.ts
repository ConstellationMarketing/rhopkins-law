import { useEffect, useRef, useState } from "react";
import type { PracticeAreaPageContent } from "../lib/cms/practiceAreaPageTypes";
import { defaultPracticeAreaPageContent } from "../lib/cms/practiceAreaPageTypes";
import type { PageMeta } from "../lib/cms/pageMeta";
import { emptyPageMeta } from "../lib/cms/pageMeta";
import { getCmsPreloadedRouteData } from "../lib/cms/preloadedState";
import { normalizeCmsPath } from "../lib/cms/publicRoutes";
import { getPublicEnv } from "../lib/runtimeEnv";
import { resolvePracticeAreaPageData } from "../lib/cms/sharedPageData";

const SUPABASE_URL = getPublicEnv("VITE_SUPABASE_URL");
const SUPABASE_ANON_KEY = getPublicEnv("VITE_SUPABASE_ANON_KEY");

interface UsePracticeAreaPageContentResult {
  content: PracticeAreaPageContent;
  meta: PageMeta;
  title: string;
  isLoading: boolean;
  error: Error | null;
  notFound: boolean;
}

const cache = new Map<
  string,
  { content: PracticeAreaPageContent; meta: PageMeta; title: string }
>();

export function usePracticeAreaPageContent(
  slug: string | undefined,
): UsePracticeAreaPageContentResult {
  const urlPath = slug ? normalizeCmsPath(`/practice-areas/${slug}/`) : "";
  const preloaded = urlPath
    ? getCmsPreloadedRouteData(urlPath)?.practiceAreaPage || null
    : null;
  const cached = urlPath ? cache.get(urlPath) : null;
  const initialContent =
    preloaded?.content || cached?.content || defaultPracticeAreaPageContent;
  const initialMeta = preloaded?.meta || cached?.meta || emptyPageMeta;
  const initialTitle = preloaded?.title || cached?.title || "";

  if (preloaded && urlPath && !cache.has(urlPath)) {
    cache.set(urlPath, {
      content: preloaded.content,
      meta: preloaded.meta,
      title: preloaded.title,
    });
  }

  const [content, setContent] = useState<PracticeAreaPageContent>(initialContent);
  const [meta, setMeta] = useState<PageMeta>(initialMeta);
  const [title, setTitle] = useState(initialTitle);
  const [isLoading, setIsLoading] = useState(!preloaded && !cached);
  const [error, setError] = useState<Error | null>(null);
  const [notFound, setNotFound] = useState(false);
  const prevSlug = useRef(slug);

  useEffect(() => {
    if (prevSlug.current !== slug) {
      prevSlug.current = slug;
      setIsLoading(true);
      setError(null);
      setNotFound(false);
    }

    if (!slug) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const nextUrlPath = normalizeCmsPath(`/practice-areas/${slug}/`);

    async function fetchContent() {
      try {
        const cachedEntry = cache.get(nextUrlPath);
        if (cachedEntry) {
          if (isMounted) {
            setContent(cachedEntry.content);
            setMeta(cachedEntry.meta);
            setTitle(cachedEntry.title);
            setIsLoading(false);
            setNotFound(false);
          }
          return;
        }

        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/pages?url_path=eq.${encodeURIComponent(nextUrlPath)}&status=eq.published&select=title,content,meta_title,meta_description,canonical_url,og_title,og_description,og_image,noindex,schema_type,schema_data`,
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

        const resolved = resolvePracticeAreaPageData(data[0]);
        cache.set(nextUrlPath, resolved);

        if (isMounted) {
          setContent(resolved.content);
          setMeta(resolved.meta);
          setTitle(resolved.title);
          setNotFound(false);
          setError(null);
        }
      } catch (err) {
        console.error("[usePracticeAreaPageContent] Error:", err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
          setContent(defaultPracticeAreaPageContent);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchContent();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  return { content, meta, title, isLoading, error, notFound };
}

export function clearPracticeAreaPageCache(slug?: string) {
  if (slug) {
    cache.delete(normalizeCmsPath(`/practice-areas/${slug}/`));
  } else {
    for (const key of cache.keys()) {
      cache.delete(key);
    }
  }
}
