import { useEffect, useState } from "react";
import type { HomePageContent } from "../lib/cms/homePageTypes";
import { defaultHomeContent } from "../lib/cms/homePageTypes";
import type { PageMeta } from "../lib/cms/pageMeta";
import { emptyPageMeta } from "../lib/cms/pageMeta";
import { getCmsPreloadedRouteData } from "../lib/cms/preloadedState";
import { getPublicEnv } from "../lib/runtimeEnv";
import { resolveHomePageData } from "../lib/cms/sharedPageData";

const SUPABASE_URL = getPublicEnv("VITE_SUPABASE_URL");
const SUPABASE_ANON_KEY = getPublicEnv("VITE_SUPABASE_ANON_KEY");

interface UseHomeContentResult {
  content: HomePageContent;
  meta: PageMeta;
  isLoading: boolean;
  error: Error | null;
}

let cachedContent: HomePageContent | null = null;
let cachedMeta: PageMeta | null = null;

export function useHomeContent(): UseHomeContentResult {
  const preloaded = getCmsPreloadedRouteData("/")?.home ?? null;
  const initialContent = preloaded?.content || cachedContent || defaultHomeContent;
  const initialMeta = preloaded?.meta || cachedMeta || emptyPageMeta;

  if (preloaded && !cachedContent) {
    cachedContent = preloaded.content;
    cachedMeta = preloaded.meta;
  }

  const [content, setContent] = useState<HomePageContent>(initialContent);
  const [meta, setMeta] = useState<PageMeta>(initialMeta);
  const [isLoading, setIsLoading] = useState(!preloaded && !cachedContent);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchHomeContent() {
      try {
        if (cachedContent) {
          if (isMounted) {
            setContent(cachedContent);
            setMeta(cachedMeta ?? emptyPageMeta);
            setIsLoading(false);
          }
          return;
        }

        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/pages?url_path=eq./&status=eq.published&select=content,meta_title,meta_description,canonical_url,og_title,og_description,og_image,noindex,schema_type,schema_data`,
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
            setContent(defaultHomeContent);
            setIsLoading(false);
          }
          return;
        }

        const resolved = resolveHomePageData(data[0]);
        cachedContent = resolved.content;
        cachedMeta = resolved.meta;

        if (isMounted) {
          setContent(resolved.content);
          setMeta(resolved.meta);
          setError(null);
        }
      } catch (err) {
        console.error("[useHomeContent] Error:", err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
          setContent(defaultHomeContent);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchHomeContent();

    return () => {
      isMounted = false;
    };
  }, []);

  return { content, meta, isLoading, error };
}

export function clearHomeContentCache() {
  cachedContent = null;
  cachedMeta = null;
}
