import { useEffect, useState } from "react";
import type { PageMeta } from "../lib/cms/pageMeta";
import { emptyPageMeta } from "../lib/cms/pageMeta";
import { getCmsPreloadedRouteData } from "../lib/cms/preloadedState";
import { getPublicEnv } from "../lib/runtimeEnv";
import {
  type BlogHeroData,
  type RecentPostsData,
  resolveBlogPageData,
} from "../lib/cms/sharedPageData";

export type { BlogHeroData, RecentPostsData } from "../lib/cms/sharedPageData";

const SUPABASE_URL = getPublicEnv("VITE_SUPABASE_URL");
const SUPABASE_ANON_KEY = getPublicEnv("VITE_SUPABASE_ANON_KEY");

interface UseBlogContentResult {
  hero: BlogHeroData;
  recentPosts: RecentPostsData;
  meta: PageMeta;
  isLoading: boolean;
}

let cachedHero: BlogHeroData | null = null;
let cachedRecentPosts: RecentPostsData | null = null;
let cachedMeta: PageMeta | null = null;

const defaultHero: BlogHeroData = {
  title: "",
  subtitle: "",
};

const defaultRecentPosts: RecentPostsData = {
  sectionLabel: "",
  heading: "",
  postCount: 6,
};

export function useBlogContent(): UseBlogContentResult {
  const preloaded = getCmsPreloadedRouteData("/blog/")?.blog ?? null;

  if (preloaded && !cachedHero) {
    cachedHero = preloaded.hero;
    cachedRecentPosts = preloaded.recentPosts;
    cachedMeta = preloaded.meta;
  }

  const [hero, setHero] = useState<BlogHeroData>(cachedHero || defaultHero);
  const [recentPosts, setRecentPosts] = useState<RecentPostsData>(
    cachedRecentPosts || defaultRecentPosts,
  );
  const [meta, setMeta] = useState<PageMeta>(cachedMeta || emptyPageMeta);
  const [isLoading, setIsLoading] = useState(!cachedHero);

  useEffect(() => {
    let isMounted = true;

    async function fetchBlogPage() {
      if (cachedHero) {
        if (isMounted) {
          setHero(cachedHero);
          setRecentPosts(cachedRecentPosts || defaultRecentPosts);
          setMeta(cachedMeta ?? emptyPageMeta);
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/pages?url_path=eq./blog/&status=eq.published&select=content,meta_title,meta_description,canonical_url,og_title,og_description,og_image,noindex,schema_type,schema_data`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
          },
        );

        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
          if (isMounted) setIsLoading(false);
          return;
        }

        const resolved = resolveBlogPageData(data[0]);
        cachedHero = resolved.hero;
        cachedRecentPosts = resolved.recentPosts;
        cachedMeta = resolved.meta;

        if (isMounted) {
          setHero(resolved.hero);
          setRecentPosts(resolved.recentPosts);
          setMeta(resolved.meta);
        }
      } catch (err) {
        console.error("[useBlogContent] Error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchBlogPage();
    return () => {
      isMounted = false;
    };
  }, []);

  return { hero, recentPosts, meta, isLoading };
}

export function clearBlogContentCache() {
  cachedHero = null;
  cachedRecentPosts = null;
  cachedMeta = null;
}
