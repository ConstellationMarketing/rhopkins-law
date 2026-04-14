import { useEffect, useState } from "react";
import type { ContactPageContent } from "../lib/cms/contactPageTypes";
import { defaultContactContent } from "../lib/cms/contactPageTypes";
import type { PageMeta } from "../lib/cms/pageMeta";
import { emptyPageMeta } from "../lib/cms/pageMeta";
import { getCmsPreloadedRouteData } from "../lib/cms/preloadedState";
import { getPublicEnv } from "../lib/runtimeEnv";
import { resolveContactPageData } from "../lib/cms/sharedPageData";

const SUPABASE_URL = getPublicEnv("VITE_SUPABASE_URL");
const SUPABASE_ANON_KEY = getPublicEnv("VITE_SUPABASE_ANON_KEY");

interface UseContactContentResult {
  content: ContactPageContent;
  meta: PageMeta;
  isLoading: boolean;
  error: Error | null;
}

let cachedContent: ContactPageContent | null = null;
let cachedMeta: PageMeta | null = null;

export function useContactContent(): UseContactContentResult {
  const preloaded = getCmsPreloadedRouteData("/contact/")?.contact ?? null;
  const initialContent = preloaded?.content || cachedContent || defaultContactContent;
  const initialMeta = preloaded?.meta || cachedMeta || emptyPageMeta;

  if (preloaded && !cachedContent) {
    cachedContent = preloaded.content;
    cachedMeta = preloaded.meta;
  }

  const [content, setContent] = useState<ContactPageContent>(initialContent);
  const [meta, setMeta] = useState<PageMeta>(initialMeta);
  const [isLoading, setIsLoading] = useState(!preloaded && !cachedContent);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchContent() {
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
          `${SUPABASE_URL}/rest/v1/pages?url_path=eq./contact/&status=eq.published&select=content,meta_title,meta_description,canonical_url,og_title,og_description,og_image,noindex,schema_type,schema_data`,
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
            setContent(defaultContactContent);
            setIsLoading(false);
          }
          return;
        }

        const resolved = resolveContactPageData(data[0]);
        cachedContent = resolved.content;
        cachedMeta = resolved.meta;

        if (isMounted) {
          setContent(resolved.content);
          setMeta(resolved.meta);
          setError(null);
        }
      } catch (err) {
        console.error("[useContactContent] Error:", err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
          setContent(defaultContactContent);
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
  }, []);

  return { content, meta, isLoading, error };
}

export function clearContactContentCache() {
  cachedContent = null;
  cachedMeta = null;
}
