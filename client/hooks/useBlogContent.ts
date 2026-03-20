import { useState, useEffect } from "react";
import type { PageMeta } from "../lib/cms/pageMeta";
import { emptyPageMeta } from "../lib/cms/pageMeta";
import type { ContentBlock } from "../lib/blocks";
import { consumePageData } from '../lib/pageDataInjection';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export interface BlogHeroData {
  title: string;
  subtitle: string;
  backgroundImage?: string;
}

export interface RecentPostsData {
  sectionLabel: string;
  heading: string;
  postCount: number;
}

interface UseBlogContentResult {
  hero: BlogHeroData;
  recentPosts: RecentPostsData;
  meta: PageMeta;
  isLoading: boolean;
}

// Module-level cache
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
  // Consume SSG-injected data synchronously before first render
  const injected = consumePageData('/blog/');

  if (injected && !cachedHero) {
    const blocks = injected.content as ContentBlock[] | null;
    let heroData: BlogHeroData = defaultHero;
    let recentPostsData: RecentPostsData = defaultRecentPosts;

    if (Array.isArray(blocks)) {
      const heroBlock = blocks.find((b) => b.type === 'hero') as
        | Extract<ContentBlock, { type: 'hero' }>
        | undefined;
      if (heroBlock) {
        heroData = {
          title: heroBlock.sectionLabel || defaultHero.title,
          subtitle: heroBlock.tagline || defaultHero.subtitle,
          backgroundImage: heroBlock.backgroundImage,
        };
      }
      const recentPostsBlock = blocks.find((b) => b.type === 'recent-posts') as
        | Extract<ContentBlock, { type: 'recent-posts' }>
        | undefined;
      if (recentPostsBlock) {
        recentPostsData = {
          sectionLabel: recentPostsBlock.sectionLabel || defaultRecentPosts.sectionLabel,
          heading: recentPostsBlock.heading || defaultRecentPosts.heading,
          postCount: recentPostsBlock.postCount || defaultRecentPosts.postCount,
        };
      }
    }

    cachedHero = heroData;
    cachedRecentPosts = recentPostsData;
    cachedMeta = injected.meta ?? emptyPageMeta;
  }

  const [hero, setHero] = useState<BlogHeroData>(cachedHero || defaultHero);
  const [recentPosts, setRecentPosts] = useState<RecentPostsData>(cachedRecentPosts || defaultRecentPosts);
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
          }
        );

        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
          if (isMounted) setIsLoading(false);
          return;
        }

        const pageData = data[0];
        const blocks = pageData.content as ContentBlock[] | null;

        // Extract hero block
        let heroData: BlogHeroData = defaultHero;
        // Extract recent-posts block
        let recentPostsData: RecentPostsData = defaultRecentPosts;

        if (Array.isArray(blocks)) {
          const heroBlock = blocks.find((b) => b.type === "hero") as
            | Extract<ContentBlock, { type: "hero" }>
            | undefined;

          if (heroBlock) {
            heroData = {
              title: heroBlock.sectionLabel || defaultHero.title,
              subtitle: heroBlock.tagline || defaultHero.subtitle,
              backgroundImage: heroBlock.backgroundImage,
            };
          }

          const recentPostsBlock = blocks.find((b) => b.type === "recent-posts") as
            | Extract<ContentBlock, { type: "recent-posts" }>
            | undefined;

          if (recentPostsBlock) {
            recentPostsData = {
              sectionLabel: recentPostsBlock.sectionLabel || defaultRecentPosts.sectionLabel,
              heading: recentPostsBlock.heading || defaultRecentPosts.heading,
              postCount: recentPostsBlock.postCount || defaultRecentPosts.postCount,
            };
          }
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

        cachedHero = heroData;
        cachedRecentPosts = recentPostsData;
        cachedMeta = pageMeta;

        if (isMounted) {
          setHero(heroData);
          setRecentPosts(recentPostsData);
          setMeta(pageMeta);
        }
      } catch (err) {
        console.error("[useBlogContent] Error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchBlogPage();
    return () => { isMounted = false; };
  }, []);

  return { hero, recentPosts, meta, isLoading };
}
