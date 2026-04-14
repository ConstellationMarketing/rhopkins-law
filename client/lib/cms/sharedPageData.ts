import type { Post } from "@/lib/database.types";
import type { ContentBlock } from "../blocks";
import type { AboutPageContent } from "./aboutPageTypes";
import { defaultAboutContent } from "./aboutPageTypes";
import type { ContactPageContent } from "./contactPageTypes";
import { defaultContactContent } from "./contactPageTypes";
import type { HomePageContent } from "./homePageTypes";
import { defaultHomeContent } from "./homePageTypes";
import type { PageMeta } from "./pageMeta";
import { emptyPageMeta } from "./pageMeta";
import type { PracticeAreaPageContent } from "./practiceAreaPageTypes";
import { defaultPracticeAreaPageContent } from "./practiceAreaPageTypes";
import type { PracticeAreasPageContent } from "./practiceAreasPageTypes";
import { defaultPracticeAreasContent } from "./practiceAreasPageTypes";

export interface CmsPageRow {
  title?: string | null;
  content?: unknown;
  meta_title?: string | null;
  meta_description?: string | null;
  canonical_url?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image?: string | null;
  noindex?: boolean | null;
  schema_type?: string | null;
  schema_data?: Record<string, unknown> | null;
}

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

export interface BlogPostWithCategory extends Post {
  post_categories: { name: string; slug: string } | null;
}

export function mapPageMeta(row?: CmsPageRow | null): PageMeta {
  return {
    meta_title: row?.meta_title,
    meta_description: row?.meta_description,
    canonical_url: row?.canonical_url,
    og_title: row?.og_title,
    og_description: row?.og_description,
    og_image: row?.og_image,
    noindex: Boolean(row?.noindex),
    schema_type: row?.schema_type,
    schema_data: row?.schema_data,
  };
}

export function resolveHomePageData(row: CmsPageRow) {
  return {
    content: mergeHomeContentWithDefaults(
      row.content as Partial<HomePageContent>,
      defaultHomeContent,
    ),
    meta: mapPageMeta(row),
  };
}

export function resolveAboutPageData(row: CmsPageRow) {
  return {
    content: mergeAboutContentWithDefaults(
      row.content as Partial<AboutPageContent>,
      defaultAboutContent,
    ),
    meta: mapPageMeta(row),
  };
}

export function resolveContactPageData(row: CmsPageRow) {
  return {
    content: mergeContactContentWithDefaults(
      row.content as Partial<ContactPageContent>,
      defaultContactContent,
    ),
    meta: mapPageMeta(row),
  };
}

export function resolvePracticeAreasPageData(
  row: CmsPageRow,
  aboutRow?: Pick<CmsPageRow, "content"> | null,
) {
  let content = mergePracticeAreasContentWithDefaults(
    row.content as Partial<PracticeAreasPageContent>,
    defaultPracticeAreasContent,
  );

  const aboutContent = aboutRow?.content as Partial<AboutPageContent> | undefined;
  if (aboutContent?.cta) {
    content = {
      ...content,
      cta: {
        ...content.cta,
        heading: aboutContent.cta.heading || content.cta.heading,
        description: aboutContent.cta.description || content.cta.description,
        primaryButton: {
          ...content.cta.primaryButton,
          ...aboutContent.cta.primaryButton,
        },
        secondaryButton: {
          ...content.cta.secondaryButton,
          ...aboutContent.cta.secondaryButton,
        },
      },
    };
  }

  return {
    content,
    meta: mapPageMeta(row),
  };
}

export function resolvePracticeAreaPageData(row: CmsPageRow) {
  return {
    content: mergePracticeAreaPageWithDefaults(
      row.content as Partial<PracticeAreaPageContent>,
      defaultPracticeAreaPageContent,
    ),
    meta: mapPageMeta(row),
    title: row.title || "",
  };
}

export function resolveDynamicPageData(row: CmsPageRow) {
  return {
    title: row.title || "",
    content: row.content,
    meta: mapPageMeta(row),
  };
}

const defaultBlogHero: BlogHeroData = {
  title: "",
  subtitle: "",
};

const defaultRecentPosts: RecentPostsData = {
  sectionLabel: "",
  heading: "",
  postCount: 6,
};

export function resolveBlogPageData(row: CmsPageRow) {
  const blocks = row.content as ContentBlock[] | null;
  let hero = defaultBlogHero;
  let recentPosts = defaultRecentPosts;

  if (Array.isArray(blocks)) {
    const heroBlock = blocks.find((block) => block.type === "hero") as
      | Extract<ContentBlock, { type: "hero" }>
      | undefined;

    if (heroBlock) {
      hero = {
        title: heroBlock.sectionLabel || defaultBlogHero.title,
        subtitle: heroBlock.tagline || defaultBlogHero.subtitle,
        backgroundImage: heroBlock.backgroundImage,
      };
    }

    const recentPostsBlock = blocks.find(
      (block) => block.type === "recent-posts",
    ) as Extract<ContentBlock, { type: "recent-posts" }> | undefined;

    if (recentPostsBlock) {
      recentPosts = {
        sectionLabel:
          recentPostsBlock.sectionLabel || defaultRecentPosts.sectionLabel,
        heading: recentPostsBlock.heading || defaultRecentPosts.heading,
        postCount: recentPostsBlock.postCount || defaultRecentPosts.postCount,
      };
    }
  }

  return {
    hero,
    recentPosts,
    meta: mapPageMeta(row),
  };
}

export function resolveBlogPostData(post: BlogPostWithCategory) {
  return {
    post: {
      ...post,
      post_categories: post.post_categories || null,
    },
  };
}

export function getEmptyPageMeta() {
  return emptyPageMeta;
}

function mergeHomeContentWithDefaults(
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
    attorneySpotlight: {
      ...defaults.attorneySpotlight,
      ...cmsContent.attorneySpotlight,
    },
    homeCta: {
      ...defaults.homeCta,
      ...cmsContent.homeCta,
      secondaryButton: {
        ...defaults.homeCta.secondaryButton,
        ...cmsContent.homeCta?.secondaryButton,
      },
    },
    contact: { ...defaults.contact, ...cmsContent.contact },
  };
}

function mergeAboutContentWithDefaults(
  cmsContent: Partial<AboutPageContent> | null | undefined,
  defaults: AboutPageContent,
): AboutPageContent {
  if (!cmsContent) return defaults;

  return {
    hero: { ...defaults.hero, ...cmsContent.hero },
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
    attorneySpotlight: {
      ...defaults.attorneySpotlight,
      ...cmsContent.attorneySpotlight,
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

function mergeContactContentWithDefaults(
  cmsContent: Partial<ContactPageContent> | null | undefined,
  defaults: ContactPageContent,
): ContactPageContent {
  if (!cmsContent) return defaults;

  return {
    hero: { ...defaults.hero, ...cmsContent.hero },
    contactIntro: { ...defaults.contactIntro, ...cmsContent.contactIntro },
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

function mergePracticeAreasContentWithDefaults(
  cmsContent: Partial<PracticeAreasPageContent> | null | undefined,
  defaults: PracticeAreasPageContent,
): PracticeAreasPageContent {
  if (!cmsContent) return defaults;

  return {
    hero: { ...defaults.hero, ...cmsContent.hero },
    intro: { ...defaults.intro, ...cmsContent.intro },
    grid: {
      ...defaults.grid,
      ...cmsContent.grid,
      areas: cmsContent.grid?.areas?.length
        ? cmsContent.grid.areas
        : defaults.grid.areas,
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

function mergePracticeAreaPageWithDefaults(
  cms: Partial<PracticeAreaPageContent> | null | undefined,
  defaults: PracticeAreaPageContent,
): PracticeAreaPageContent {
  if (!cms) return defaults;

  return {
    hero: { ...defaults.hero, ...cms.hero },
    socialProof: {
      ...defaults.socialProof,
      ...cms.socialProof,
      testimonials: cms.socialProof?.testimonials?.length
        ? cms.socialProof.testimonials
        : defaults.socialProof.testimonials,
      awards: {
        ...defaults.socialProof.awards,
        ...cms.socialProof?.awards,
        logos: cms.socialProof?.awards?.logos?.length
          ? cms.socialProof.awards.logos
          : defaults.socialProof.awards.logos,
      },
    },
    contentSections: cms.contentSections?.length
      ? cms.contentSections
      : defaults.contentSections,
    faq: {
      ...defaults.faq,
      ...cms.faq,
      items: cms.faq?.items?.length ? cms.faq.items : defaults.faq.items,
    },
    headingTags: cms.headingTags ?? defaults.headingTags,
  };
}
