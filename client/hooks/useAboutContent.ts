import { useState, useEffect } from "react";
import type { AboutPageContent } from "../lib/cms/aboutPageTypes";
import { defaultAboutContent } from "../lib/cms/aboutPageTypes";
import type { PageMeta } from "../lib/cms/pageMeta";
import { emptyPageMeta } from "../lib/cms/pageMeta";
import { consumePageData } from '../lib/pageDataInjection';

// Supabase configuration - use environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

interface UseAboutContentResult {
  content: AboutPageContent;
  meta: PageMeta;
  isLoading: boolean;
  error: Error | null;
}

// Cache for about content
let cachedContent: AboutPageContent | null = null;
let cachedMeta: PageMeta | null = null;

export function useAboutContent(): UseAboutContentResult {
  // Consume SSG-injected data synchronously before first render
  const injected = consumePageData('/about/');
  const initialContent = injected
    ? mergeWithDefaults(injected.content as Partial<AboutPageContent>, defaultAboutContent)
    : (cachedContent ?? defaultAboutContent);
  const initialMeta = injected?.meta ?? (cachedMeta ?? emptyPageMeta);

  if (injected && !cachedContent) {
    cachedContent = initialContent;
    cachedMeta = initialMeta;
  }

  const [content, setContent] = useState<AboutPageContent>(initialContent);
  const [meta, setMeta] = useState<PageMeta>(initialMeta);
  const [isLoading, setIsLoading] = useState(!injected && !cachedContent);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchAboutContent() {
      try {
        // Return cached content if available
        if (cachedContent) {
          if (isMounted) {
            setContent(cachedContent);
            setMeta(cachedMeta ?? emptyPageMeta);
            setIsLoading(false);
          }
          return;
        }

        // Fetch about page from pages table
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
          // No CMS content, use defaults
          if (isMounted) {
            setContent(defaultAboutContent);
            setIsLoading(false);
          }
          return;
        }

        const pageData = data[0];
        const cmsContent = pageData.content as AboutPageContent;

        // Merge CMS content with defaults (CMS content takes precedence)
        const mergedContent = mergeWithDefaults(
          cmsContent,
          defaultAboutContent,
        );

        const pageMeta: PageMeta = {
          meta_title: pageData.meta_title,
          meta_description: pageData.meta_description,
          canonical_url: pageData.canonical_url,
          og_title: pageData.og_title,
          og_description: pageData.og_description,
          og_image: pageData.og_image,
          noindex: pageData.noindex,
          schema_type: pageData.schema_type,
          schema_data: pageData.schema_data,
        };

        // Cache the result
        cachedContent = mergedContent;
        cachedMeta = pageMeta;

        if (isMounted) {
          setContent(mergedContent);
          setMeta(pageMeta);
          setError(null);
        }
      } catch (err) {
        console.error("[useAboutContent] Error:", err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
          // Fall back to defaults on error
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

// Deep merge CMS content with defaults
function mergeWithDefaults(
  cmsContent: Partial<AboutPageContent> | null | undefined,
  defaults: AboutPageContent,
): AboutPageContent {
  if (!cmsContent) return defaults;

  return {
    hero: { ...defaults.hero, ...cmsContent.hero },
    story: {
      ...defaults.story,
      ...cmsContent.story,
      paragraphs: cmsContent.story?.paragraphs?.length
        ? cmsContent.story.paragraphs
        : defaults.story.paragraphs,
    },
    missionVision: {
      mission: {
        ...defaults.missionVision.mission,
        ...cmsContent.missionVision?.mission,
      },
      vision: {
        ...defaults.missionVision.vision,
        ...cmsContent.missionVision?.vision,
      },
    },
    team: {
      ...defaults.team,
      ...cmsContent.team,
      members: cmsContent.team?.members?.length
        ? cmsContent.team.members
        : defaults.team.members,
    },
    values: {
      ...defaults.values,
      ...cmsContent.values,
      items: cmsContent.values?.items?.length
        ? cmsContent.values.items
        : defaults.values.items,
    },
    stats: {
      ...defaults.stats,
      ...cmsContent.stats,
      stats: cmsContent.stats?.stats?.length
        ? cmsContent.stats.stats
        : defaults.stats.stats,
    },
    whyChooseUs: {
      ...defaults.whyChooseUs,
      ...cmsContent.whyChooseUs,
      items: cmsContent.whyChooseUs?.items?.length
        ? cmsContent.whyChooseUs.items
        : defaults.whyChooseUs.items,
    },
    cta: {
      ...defaults.cta,
      ...cmsContent.cta,
      primaryButton: {
        ...defaults.cta.primaryButton,
        ...cmsContent.cta?.primaryButton,
      },
      secondaryButton: {
        ...defaults.cta.secondaryButton,
        ...cmsContent.cta?.secondaryButton,
      },
    },
  };
}

// Helper to clear cache (useful after admin edits)
export function clearAboutContentCache() {
  cachedContent = null;
  cachedMeta = null;
}
