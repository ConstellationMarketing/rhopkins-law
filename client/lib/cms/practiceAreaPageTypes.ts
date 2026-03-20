// Type definitions for individual Practice Area page content (e.g. /practice-areas/personal-injury)
// Each section maps directly to a static component's data needs

export interface PracticeAreaHeroContent {
  sectionLabel: string;
  tagline: string;
  description: string;
  backgroundImage?: string;
  backgroundImageAlt?: string;
}

export interface PracticeAreaTestimonialItem {
  text: string;
  author: string;
  ratingImage: string;
  ratingImageAlt?: string;
}

export interface PracticeAreaAwardsContent {
  logos: Array<{ src: string; alt: string }>;
}

export interface PracticeAreaSocialProofContent {
  mode: "testimonials" | "awards" | "none";
  testimonials: PracticeAreaTestimonialItem[];
  awards: PracticeAreaAwardsContent;
}

export interface PracticeAreaContentSectionItem {
  body: string;
  image: string;
  imageAlt: string;
  imagePosition: "left" | "right";
  /** Whether to show the CTA call-boxes (phone + contact). Defaults to true. */
  showCTAs?: boolean;
}

export interface PracticeAreaFaqContent {
  enabled: boolean;
  heading: string;
  description: string;
  items: Array<{ question: string; answer: string }>;
}

export interface PracticeAreaPageContent {
  hero: PracticeAreaHeroContent;
  socialProof: PracticeAreaSocialProofContent;
  contentSections: PracticeAreaContentSectionItem[];
  faq: PracticeAreaFaqContent;
  headingTags?: Record<string, string>;
}

// Default content - empty defaults, content comes exclusively from the CMS
export const defaultPracticeAreaPageContent: PracticeAreaPageContent = {
  hero: {
    sectionLabel: "",
    tagline: "",
    description: "",
    backgroundImage: "",
  },
  socialProof: {
    mode: "none",
    testimonials: [],
    awards: {
      logos: [],
    },
  },
  contentSections: [],
  faq: {
    enabled: false,
    heading: "",
    description: "",
    items: [],
  },
};
