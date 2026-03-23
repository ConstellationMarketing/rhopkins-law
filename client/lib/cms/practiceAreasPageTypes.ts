// Type definitions for structured Practice Areas page content
// Each section maps directly to a static component's data needs

export interface PracticeAreasHeroContent {
  sectionLabel: string; // H1 title text
  tagline: string; // Large headline
  highlightedText: string; // Portion of tagline to underline
  description: string; // Description paragraph
  phone: string;
  phoneLabel: string;
  heroImage: string;
  heroImageAlt: string;
}

export interface SubPracticeItem {
  icon: string; // Lucide icon name (e.g. "FileText")
  title: string; // "Uncontested Divorce"
  description: string; // Brief description
  link: string; // "/practice-areas/uncontested-divorce/"
}

export interface PracticeAreaGroupItem {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  link: string;
  subPractices: SubPracticeItem[];
}

export interface PracticeAreasGridContent {
  heading: string; // "Our Areas of Practice"
  description: string; // Intro paragraph
  areas: PracticeAreaGroupItem[];
}

export interface PracticeAreasIntroContent {
  sectionLabel: string;
  heading: string;
  description: string;
}

export interface CTAContent {
  heading: string; // "Ready to Discuss Your Case?"
  description: string; // Subtitle text
  primaryButton: {
    label: string; // "Call Us 24/7"
    phone: string; // Phone number
  };
  secondaryButton: {
    label: string; // "Schedule Now"
    sublabel: string; // "Free Consultation"
    link: string; // Link URL
  };
}

// Complete Practice Areas page content structure
export interface PracticeAreasPageContent {
  hero: PracticeAreasHeroContent;
  intro: PracticeAreasIntroContent;
  grid: PracticeAreasGridContent;
  cta: CTAContent;
  /** Maps heading keys (e.g. "grid.heading") to HTML tag names (e.g. "h2") */
  headingTags?: Record<string, string>;
}

// Default content - empty defaults, content comes exclusively from the CMS
export const defaultPracticeAreasContent: PracticeAreasPageContent = {
  hero: {
    sectionLabel: "",
    tagline: "",
    highlightedText: "",
    description: "",
    phone: "",
    phoneLabel: "",
    heroImage: "",
    heroImageAlt: "",
  },
  intro: {
    sectionLabel: "",
    heading: "",
    description: "",
  },
  grid: {
    heading: "",
    description: "",
    areas: [],
  },
  cta: {
    heading: "",
    description: "",
    primaryButton: {
      label: "",
      phone: "",
    },
    secondaryButton: {
      label: "",
      sublabel: "",
      link: "",
    },
  },
};
