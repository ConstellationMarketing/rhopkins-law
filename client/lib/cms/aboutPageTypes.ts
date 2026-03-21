// Type definitions for structured About page content
// Each section maps directly to a static component's data needs

import type { AboutContent, AttorneySpotlightContent } from "./homePageTypes";

export interface AboutHeroContent {
  sectionLabel: string; // H1 title text
  tagline: string; // Large headline
  highlightedText: string; // Portion of tagline to underline
  description: string; // Description paragraph
  phone: string;
  phoneLabel: string;
  heroImage: string;
  heroImageAlt: string;
}

export interface TeamMember {
  name: string;
  title: string;
  bio: string;
  image: string;
  imageAlt: string;
  specialties: string[];
}

export interface TeamContent {
  sectionLabel: string; // "– Our Legal Team"
  heading: string; // "Experienced Attorneys..."
  members: TeamMember[];
}

export interface ValueItem {
  icon: string; // Lucide icon name
  title: string;
  description: string;
}

export interface ValuesContent {
  sectionLabel: string; // "– Our Values"
  heading: string; // "Principles That Guide Our Practice"
  subtitle: string; // Subtitle text
  items: ValueItem[];
}

export interface StatItem {
  value: string;
  label: string;
}

export interface StatsContent {
  stats: StatItem[];
}

export interface WhyChooseUsContent {
  heading: string;
  body: string; // rich text HTML
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

// Complete About page content structure
export interface AboutPageContent {
  hero: AboutHeroContent;
  about: AboutContent;
  attorneySpotlight: AttorneySpotlightContent;
  team: TeamContent;
  values: ValuesContent;
  stats: StatsContent;
  whyChooseUs: WhyChooseUsContent;
  cta: CTAContent;
  /** Maps heading keys (e.g. "about.heading") to HTML tag names (e.g. "h2") */
  headingTags?: Record<string, string>;
}

// Default content - empty defaults, content comes exclusively from the CMS
export const defaultAboutContent: AboutPageContent = {
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
  about: {
    sectionLabel: "",
    heading: "",
    subheading: "",
    description: "",
    phone: "",
    phoneLabel: "",
    contactLabel: "",
    contactText: "",
    attorneyImage: "",
    attorneyImageAlt: "",
    features: [],
    stats: [],
  },
  attorneySpotlight: {
    sectionLabel: "",
    heading: "",
    description: "",
    buttonText: "",
    buttonLink: "",
    image: "",
    imageAlt: "",
    attorneyName: "",
    attorneyTitle: "",
  },
  team: {
    sectionLabel: "",
    heading: "",
    members: [],
  },
  values: {
    sectionLabel: "",
    heading: "",
    subtitle: "",
    items: [],
  },
  stats: {
    stats: [],
  },
  whyChooseUs: {
    heading: "",
    body: "",
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
