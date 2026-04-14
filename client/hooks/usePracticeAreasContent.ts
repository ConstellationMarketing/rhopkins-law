import { useEffect, useState } from "react";
import type { PracticeAreasPageContent } from "../lib/cms/practiceAreasPageTypes";
import { defaultPracticeAreasContent } from "../lib/cms/practiceAreasPageTypes";
import type { PageMeta } from "../lib/cms/pageMeta";
import { emptyPageMeta } from "../lib/cms/pageMeta";
import { getCmsPreloadedRouteData } from "../lib/cms/preloadedState";
import { getPublicEnv } from "../lib/runtimeEnv";
import { resolvePracticeAreasPageData } from "../lib/cms/sharedPageData";

const SUPABASE_URL = getPublicEnv("VITE_SUPABASE_URL");
const SUPABASE_ANON_KEY = getPublicEnv("VITE_SUPABASE_ANON_KEY");

interface UsePracticeAreasContentResult {
  content: PracticeAreasPageContent;
  meta: PageMeta;
  isLoading: boolean;
  error: Error | null;
}

let cachedContent: PracticeAreasPageContent | null = null;
let cachedMeta: PageMeta | null = null;

export function usePracticeAreasContent(): UsePracticeAreasContentResult {
  const preloaded = getCmsPreloadedRouteData("/practice-areas/")?.practiceAreas ?? null;
  const initialContent =
    preloaded?.content || cachedContent || defaultPracticeAreasContent;
  const initialMeta = preloaded?.meta || cachedMeta || emptyPageMeta;

  if (preloaded && !cachedContent) {
    cachedContent = preloaded.content;
    cachedMeta = preloaded.meta;
  }

  const [content, setContent] = useState<PracticeAreasPageContent>(initialContent);
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

        const pageResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/pages?url_path=eq./practice-areas/&status=eq.published&select=content,meta_title,meta_description,canonical_url,og_title,og_description,og_image,noindex,schema_type,schema_data`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
          },
        );

        if (!pageResponse.ok) {
          throw new Error(`HTTP error: ${pageResponse.status}`);
        }

        const pageData = await pageResponse.json();

        if (!Array.isArray(pageData) || pageData.length === 0) {
          if (isMounted) {
            setContent(defaultPracticeAreasContent);
            setIsLoading(false);
          }
          return;
        }

        let aboutPage = null;
        try {
          const aboutResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/pages?url_path=eq./about/&status=eq.published&select=content`,
            {
              headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              },
            },
          );

          if (aboutResponse.ok) {
            const aboutData = await aboutResponse.json();
            if (Array.isArray(aboutData) && aboutData.length > 0) {
              aboutPage = aboutData[0];
            }
          }
        } catch (aboutErr) {
          console.warn(
            "[usePracticeAreasContent] Failed to fetch About page for global CTA:",
            aboutErr,
          );
        }

        const resolved = resolvePracticeAreasPageData(pageData[0], aboutPage);
        cachedContent = resolved.content;
        cachedMeta = resolved.meta;

        if (isMounted) {
          setContent(resolved.content);
          setMeta(resolved.meta);
          setError(null);
        }
      } catch (err) {
        console.error("[usePracticeAreasContent] Error:", err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
          setContent(defaultPracticeAreasContent);
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

export function clearPracticeAreasContentCache() {
  cachedContent = null;
  cachedMeta = null;
}
