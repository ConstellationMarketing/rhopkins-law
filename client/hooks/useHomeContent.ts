import { useState, useEffect } from "react";
import type { HomePageContent } from "../lib/cms/homePageTypes";
import { defaultHomeContent } from "../lib/cms/homePageTypes";
import type { PageMeta } from "../lib/cms/pageMeta";
import { emptyPageMeta } from "../lib/cms/pageMeta";
import { consumePageData } from '../lib/pageDataInjection';

// Supabase configuration - use environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

interface UseHomeContentResult {
  content: HomePageContent;
  meta: PageMeta;
  isLoading: boolean;
  error: Error | null;
}

// Cache for home content
let cachedContent: HomePageContent | null = null;
let cachedMeta: PageMeta | null = null;

export function useHomeContent(): UseHomeContentResult {
  // Consume SSG-injected data synchronously before first render
  const injected = consumePageData('/');
  const initialContent = injected
    ? mergeWithDefaults(injected.content as Partial<HomePageContent>, defaultHomeContent)
    : (cachedContent ?? defaultHomeContent);
  const initialMeta = injected?.meta ?? (cachedMeta ?? emptyPageMeta);

  // Seed module cache so useEffect skips the fetch
  if (injected && !cachedContent) {
    cachedContent = initialContent;
    cachedMeta = initialMeta;
  }

  const [content, setContent] = useState<HomePageContent>(initialContent);
  const [meta, setMeta] = useState<PageMeta>(initialMeta);
  const [isLoading, setIsLoading] = useState(!injected && !cachedContent);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchHomeContent() {
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

        // Fetch homepage from pages table
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
          // No CMS content, use defaults
          if (isMounted) {
            setContent(defaultHomeContent);
            setIsLoading(false);
          }
          return;
        }

        const pageData = data[0];
        const cmsContent = pageData.content as HomePageContent;

        // Merge CMS content with defaults (CMS content takes precedence)
        let mergedContent = mergeWithDefaults(cmsContent, defaultHomeContent);

        // Extract meta fields
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
        console.error("[useHomeContent] Error:", err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
          // Fall back to defaults on error
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

// Deep merge CMS content with defaults
function mergeWithDefaults(
  cmsContent: Partial<HomePageContent> | null | undefined,
  defaults: HomePageContent,
): HomePageContent {
  if (!cmsContent) return defaults;

  return {
    hero: { ...defaults.hero, ...cmsContent.hero },
    partnerLogos: cmsContent.partnerLogos?.length
      ? cmsContent.partnerLogos
      : defaults.partnerLogos,
    about: {
      ...defaults.about,
      ...cmsContent.about,
      features: cmsContent.about?.features?.length
        ? cmsContent.about.features
        : defaults.about.features,
      stats: cmsContent.about?.stats?.length
        ? cmsContent.about.stats
        : defaults.about.stats,
    },
    practiceAreasIntro: {
      ...defaults.practiceAreasIntro,
      ...cmsContent.practiceAreasIntro,
    },
    practiceAreas: cmsContent.practiceAreas?.length
      ? cmsContent.practiceAreas
      : defaults.practiceAreas,
    awards: {
      ...defaults.awards,
      ...cmsContent.awards,
      logos: cmsContent.awards?.logos?.length
        ? cmsContent.awards.logos
        : defaults.awards.logos,
    },
    testimonials: {
      ...defaults.testimonials,
      ...cmsContent.testimonials,
      items: cmsContent.testimonials?.items?.length
        ? cmsContent.testimonials.items
        : defaults.testimonials.items,
    },
    process: {
      ...defaults.process,
      ...cmsContent.process,
      steps: cmsContent.process?.steps?.length
        ? cmsContent.process.steps
        : defaults.process.steps,
    },
    googleReviews: {
      ...defaults.googleReviews,
      ...cmsContent.googleReviews,
      reviews: cmsContent.googleReviews?.reviews?.length
        ? cmsContent.googleReviews.reviews
        : defaults.googleReviews.reviews,
    },
    faq: {
      ...defaults.faq,
      ...cmsContent.faq,
      items: cmsContent.faq?.items?.length
        ? cmsContent.faq.items
        : defaults.faq.items,
    },
    contact: { ...defaults.contact, ...cmsContent.contact },
  };
}

// Helper to clear cache (useful after admin edits)
export function clearHomeContentCache() {
  cachedContent = null;
  cachedMeta = null;
}
