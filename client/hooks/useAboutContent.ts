import { useEffect, useState } from "react";
import type { AboutPageContent } from "../lib/cms/aboutPageTypes";
import { defaultAboutContent } from "../lib/cms/aboutPageTypes";
import type { PageMeta } from "../lib/cms/pageMeta";
import { emptyPageMeta } from "../lib/cms/pageMeta";
import { getCmsPreloadedRouteData } from "../lib/cms/preloadedState";
import { getPublicEnv } from "../lib/runtimeEnv";
import { resolveAboutPageData } from "../lib/cms/sharedPageData";

const SUPABASE_URL = getPublicEnv("VITE_SUPABASE_URL");
const SUPABASE_ANON_KEY = getPublicEnv("VITE_SUPABASE_ANON_KEY");

interface UseAboutContentResult {
  content: AboutPageContent;
  meta: PageMeta;
  isLoading: boolean;
  error: Error | null;
}

let cachedContent: AboutPageContent | null = null;
let cachedMeta: PageMeta | null = null;

export function useAboutContent(): UseAboutContentResult {
  const preloaded = getCmsPreloadedRouteData("/about/")?.about ?? null;
  const initialContent = preloaded?.content || cachedContent || defaultAboutContent;
  const initialMeta = preloaded?.meta || cachedMeta || emptyPageMeta;

  if (preloaded && !cachedContent) {
    cachedContent = preloaded.content;
    cachedMeta = preloaded.meta;
  }

  const [content, setContent] = useState<AboutPageContent>(initialContent);
  const [meta, setMeta] = useState<PageMeta>(initialMeta);
  const [isLoading, setIsLoading] = useState(!preloaded && !cachedContent);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchAboutContent() {
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
          `${SUPABASE_URL}/rest/v1/pages?url_path=eq./about/&status=eq.published&select=content,meta_title,meta_description,canonical_url,og_title,og_description,og_image,noindex,schema_type,schema_data`,
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
            setContent(defaultAboutContent);
            setIsLoading(false);
          }
          return;
        }

        const resolved = resolveAboutPageData(data[0]);
        cachedContent = resolved.content;
        cachedMeta = resolved.meta;

        if (isMounted) {
          setContent(resolved.content);
          setMeta(resolved.meta);
          setError(null);
        }
      } catch (err) {
        console.error("[useAboutContent] Error:", err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
          setContent(defaultAboutContent);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchAboutContent();

    return () => {
      isMounted = false;
    };
  }, []);

  return { content, meta, isLoading, error };
}

export function clearAboutContentCache() {
  cachedContent = null;
  cachedMeta = null;
}
