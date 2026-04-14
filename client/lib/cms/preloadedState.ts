import type { Post } from "@/lib/database.types";
import type { AboutPageContent } from "./aboutPageTypes";
import type { ContactPageContent } from "./contactPageTypes";
import type { HomePageContent } from "./homePageTypes";
import type { PageMeta } from "./pageMeta";
import type { PracticeAreaPageContent } from "./practiceAreaPageTypes";
import type { PracticeAreasPageContent } from "./practiceAreasPageTypes";
import type { SiteSettings } from "./siteSettings";
import type { BlogHeroData, RecentPostsData } from "./sharedPageData";
import { normalizeCmsPath } from "./publicRoutes";

export interface BlogPostWithCategory extends Post {
  post_categories: { name: string; slug: string } | null;
}

export interface CmsPreloadedRouteData {
  home?: { content: HomePageContent; meta: PageMeta };
  about?: { content: AboutPageContent; meta: PageMeta };
  contact?: { content: ContactPageContent; meta: PageMeta };
  practiceAreas?: { content: PracticeAreasPageContent; meta: PageMeta };
  practiceAreaPage?: {
    content: PracticeAreaPageContent;
    meta: PageMeta;
    title: string;
  };
  blog?: {
    hero: BlogHeroData;
    recentPosts: RecentPostsData;
    meta: PageMeta;
  };
  blogPost?: { post: BlogPostWithCategory };
  dynamicPage?: {
    title: string;
    content: unknown;
    meta: PageMeta;
  };
}

export interface CmsPreloadedState {
  currentPath: string;
  siteSettings: SiteSettings;
  routeData: CmsPreloadedRouteData;
}

declare global {
  interface Window {
    __CMS_PRELOADED_STATE__?: CmsPreloadedState;
  }
}

let serverPreloadedState: CmsPreloadedState | null = null;

export function setServerPreloadedState(state: CmsPreloadedState | null) {
  serverPreloadedState = state;
}

export function getCmsPreloadedState(): CmsPreloadedState | null {
  if (typeof window !== "undefined") {
    return window.__CMS_PRELOADED_STATE__ || null;
  }

  return serverPreloadedState;
}

export function getCmsPreloadedRouteData(
  urlPath: string,
): CmsPreloadedRouteData | null {
  const state = getCmsPreloadedState();
  if (!state?.routeData) {
    return null;
  }

  return normalizeCmsPath(state.currentPath) === normalizeCmsPath(urlPath)
    ? state.routeData
    : null;
}

export function hasCmsPrerenderedStateForPath(urlPath: string): boolean {
  return !!getCmsPreloadedRouteData(urlPath);
}

export function serializeCmsPreloadedState(state: CmsPreloadedState): string {
  return JSON.stringify(state).replace(/[<>&\u2028\u2029]/g, (char) => {
    switch (char) {
      case "<":
        return "\\u003c";
      case ">":
        return "\\u003e";
      case "&":
        return "\\u0026";
      case "\u2028":
        return "\\u2028";
      case "\u2029":
        return "\\u2029";
      default:
        return char;
    }
  });
}
