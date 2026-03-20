import { useState, useEffect } from "react";
import type { ContactPageContent } from "../lib/cms/contactPageTypes";
import { defaultContactContent } from "../lib/cms/contactPageTypes";
import type { PageMeta } from "../lib/cms/pageMeta";
import { emptyPageMeta } from "../lib/cms/pageMeta";
import type { AboutPageContent } from "../lib/cms/aboutPageTypes";
import { consumePageData } from '../lib/pageDataInjection';

// Supabase configuration - use environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

interface UseContactContentResult {
  content: ContactPageContent;
  meta: PageMeta;
  isLoading: boolean;
  error: Error | null;
}

// Cache for contact content
let cachedContent: ContactPageContent | null = null;
let cachedMeta: PageMeta | null = null;

export function useContactContent(): UseContactContentResult {
  // Consume SSG-injected data synchronously before first render
  const injected = consumePageData('/contact/');
  const initialContent = injected
    ? mergeWithDefaults(injected.content as Partial<ContactPageContent>, defaultContactContent)
    : (cachedContent ?? defaultContactContent);
  const initialMeta = injected?.meta ?? (cachedMeta ?? emptyPageMeta);

  if (injected && !cachedContent) {
    cachedContent = initialContent;
    cachedMeta = initialMeta;
  }

  const [content, setContent] = useState<ContactPageContent>(initialContent);
  const [meta, setMeta] = useState<PageMeta>(initialMeta);
  const [isLoading, setIsLoading] = useState(!injected && !cachedContent);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchContent() {
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

        // Fetch contact page from pages table
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
          // No CMS content, use defaults
          if (isMounted) {
            setContent(defaultContactContent);
            setIsLoading(false);
          }
          return;
        }

        const pageData = data[0];
        const cmsContent = pageData.content as ContactPageContent;

        // Merge CMS content with defaults (CMS content takes precedence)
        let mergedContent = mergeWithDefaults(
          cmsContent,
          defaultContactContent,
        );

        // Fetch About page for globally-shared CTA section
        try {
          const aboutResp = await fetch(
            `${SUPABASE_URL}/rest/v1/pages?url_path=eq./about/&status=eq.published&select=content`,
            {
              headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              },
            },
          );
          if (aboutResp.ok) {
            const aboutData = await aboutResp.json();
            if (Array.isArray(aboutData) && aboutData.length > 0) {
              const aboutContent = aboutData[0].content as Partial<AboutPageContent>;
              if (aboutContent?.cta) {
                mergedContent = {
                  ...mergedContent,
                  cta: {
                    ...mergedContent.cta,
                    heading: aboutContent.cta.heading || mergedContent.cta.heading,
                    description: aboutContent.cta.description || mergedContent.cta.description,
                    primaryButton: { ...mergedContent.cta.primaryButton, ...aboutContent.cta.primaryButton },
                    secondaryButton: { ...mergedContent.cta.secondaryButton, ...aboutContent.cta.secondaryButton },
                  },
                };
              }
            }
          }
        } catch (aboutErr) {
          console.warn("[useContactContent] Failed to fetch About page for global CTA:", aboutErr);
        }

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
        console.error("[useContactContent] Error:", err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
          // Fall back to defaults on error
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

// Deep merge CMS content with defaults
function mergeWithDefaults(
  cmsContent: Partial<ContactPageContent> | null | undefined,
  defaults: ContactPageContent,
): ContactPageContent {
  if (!cmsContent) return defaults;

  return {
    hero: { ...defaults.hero, ...cmsContent.hero },
    contactMethods: {
      ...defaults.contactMethods,
      ...cmsContent.contactMethods,
      methods: cmsContent.contactMethods?.methods?.length
        ? cmsContent.contactMethods.methods
        : defaults.contactMethods.methods,
    },
    form: { ...defaults.form, ...cmsContent.form },
    officeHours: {
      ...defaults.officeHours,
      ...cmsContent.officeHours,
      items: cmsContent.officeHours?.items?.length
        ? cmsContent.officeHours.items
        : defaults.officeHours.items,
    },
    process: {
      ...defaults.process,
      ...cmsContent.process,
      steps: cmsContent.process?.steps?.length
        ? cmsContent.process.steps
        : defaults.process.steps,
    },
    visitOffice: { ...defaults.visitOffice, ...cmsContent.visitOffice },
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
export function clearContactContentCache() {
  cachedContent = null;
  cachedMeta = null;
}
