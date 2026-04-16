/**
 * StructuredPagePreview
 *
 * Renders a read-only preview of structured page content inside the admin
 * preview tab and anywhere structured CMS objects are rendered.
 */

import type { HomePageContent } from "@/lib/cms/homePageTypes";
import type { AboutPageContent } from "@/lib/cms/aboutPageTypes";
import type { ContactPageContent } from "@/lib/cms/contactPageTypes";
import type { PracticeAreasPageContent } from "@/lib/cms/practiceAreasPageTypes";
import type { PracticeAreaPageContent } from "@/lib/cms/practiceAreaPageTypes";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isHomeContent(content: unknown): content is HomePageContent {
  return (
    isRecord(content) &&
    isRecord(content.hero) &&
    Array.isArray(content.partnerLogos) &&
    isRecord(content.about) &&
    isRecord(content.attorneySpotlight) &&
    isRecord(content.homeCta) &&
    isRecord(content.practiceAreasIntro) &&
    Array.isArray(content.practiceAreas) &&
    isRecord(content.awards) &&
    isRecord(content.testimonials) &&
    isRecord(content.process) &&
    isRecord(content.googleReviews) &&
    isRecord(content.faq) &&
    isRecord(content.contact)
  );
}

function isAboutContent(content: unknown): content is AboutPageContent {
  return (
    isRecord(content) &&
    isRecord(content.hero) &&
    isRecord(content.about) &&
    isRecord(content.attorneySpotlight) &&
    isRecord(content.team) &&
    isRecord(content.values) &&
    isRecord(content.stats) &&
    isRecord(content.whyChooseUs) &&
    isRecord(content.cta)
  );
}

function isContactContent(content: unknown): content is ContactPageContent {
  return (
    isRecord(content) &&
    isRecord(content.hero) &&
    isRecord(content.contactIntro) &&
    isRecord(content.form) &&
    isRecord(content.officeHours) &&
    isRecord(content.process) &&
    isRecord(content.visitOffice) &&
    isRecord(content.cta)
  );
}

function isPracticeAreasContent(content: unknown): content is PracticeAreasPageContent {
  return (
    isRecord(content) &&
    isRecord(content.hero) &&
    isRecord(content.intro) &&
    isRecord(content.grid) &&
    isRecord(content.cta)
  );
}

function isPracticeAreaPageContent(content: unknown): content is PracticeAreaPageContent {
  return (
    isRecord(content) &&
    isRecord(content.hero) &&
    isRecord(content.socialProof) &&
    Array.isArray(content.contentSections) &&
    isRecord(content.faq)
  );
}

function PreviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border rounded-lg overflow-hidden mb-4">
      <div className="bg-slate-100 px-4 py-2 border-b">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          {title}
        </h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function PreviewField({
  label,
  value,
}: {
  label: string;
  value: string | number | undefined | null;
}) {
  if (!value && value !== 0) return null;

  return (
    <p className="text-sm text-gray-700 mb-1">
      <span className="font-medium text-gray-500">{label}:</span> {value}
    </p>
  );
}

function PreviewImage({ src, alt }: { src?: string; alt?: string }) {
  if (!src) return null;

  return (
    <img
      src={src}
      alt={alt || ""}
      className="max-h-40 rounded border object-cover mt-2"
      width={280}
      height={160}
    />
  );
}

function HomePreview({ content }: { content: HomePageContent }) {
  return (
    <div className="space-y-4">
      <PreviewSection title="Hero">
        <PreviewField label="H1 Title" value={content.hero.h1Title} />
        <PreviewField label="Headline" value={content.hero.headline} />
        <PreviewField label="Highlighted Text" value={content.hero.highlightedText} />
        <PreviewImage src={content.hero.heroImage} alt={content.hero.heroImageAlt} />
      </PreviewSection>

      <PreviewSection title="About Section">
        <PreviewField label="Heading" value={content.about.heading} />
        <PreviewField label="Contact Label" value={content.about.contactLabel} />
        <PreviewImage
          src={content.about.attorneyImage}
          alt={content.about.attorneyImageAlt}
        />
      </PreviewSection>

      <PreviewSection title="Attorney Spotlight">
        <PreviewField label="Heading" value={content.attorneySpotlight.heading} />
        <PreviewField label="Attorney Name" value={content.attorneySpotlight.attorneyName} />
        <PreviewImage
          src={content.attorneySpotlight.image}
          alt={content.attorneySpotlight.imageAlt}
        />
      </PreviewSection>

      <PreviewSection title="Practice Areas">
        <PreviewField label="Section Heading" value={content.practiceAreasIntro.heading} />
        <PreviewField label="Areas" value={content.practiceAreas.length} />
      </PreviewSection>

      <PreviewSection title="Awards & Testimonials">
        <PreviewField label="Award Logos" value={content.awards.logos.length} />
        <PreviewField label="Testimonials" value={content.testimonials.items.length} />
        <PreviewImage
          src={content.testimonials.backgroundImage}
          alt={content.testimonials.backgroundImageAlt}
        />
      </PreviewSection>

      <PreviewSection title="FAQ & Contact">
        <PreviewField label="FAQ Items" value={content.faq.items.length} />
        <PreviewImage
          src={content.faq.videoThumbnail}
          alt={content.faq.videoThumbnailAlt}
        />
        <PreviewImage src={content.contact.image} alt={content.contact.imageAlt} />
      </PreviewSection>
    </div>
  );
}

function AboutPreview({ content }: { content: AboutPageContent }) {
  return (
    <div className="space-y-4">
      <PreviewSection title="Hero">
        <PreviewField label="Section Label" value={content.hero.sectionLabel} />
        <PreviewField label="Tagline" value={content.hero.tagline} />
        <PreviewImage src={content.hero.heroImage} alt={content.hero.heroImageAlt} />
      </PreviewSection>

      <PreviewSection title="About Section">
        <PreviewField label="Heading" value={content.about.heading} />
        <PreviewImage
          src={content.about.attorneyImage}
          alt={content.about.attorneyImageAlt}
        />
      </PreviewSection>

      <PreviewSection title="Attorney Spotlight">
        <PreviewField label="Heading" value={content.attorneySpotlight.heading} />
        <PreviewImage
          src={content.attorneySpotlight.image}
          alt={content.attorneySpotlight.imageAlt}
        />
      </PreviewSection>

      <PreviewSection title="Team & Values">
        <PreviewField label="Team Members" value={content.team.members.length} />
        <PreviewField label="Values" value={content.values.items.length} />
      </PreviewSection>

      <PreviewSection title="Stats & CTA">
        <PreviewField label="Stats" value={content.stats.stats.length} />
        <PreviewField label="CTA Heading" value={content.cta.heading} />
      </PreviewSection>
    </div>
  );
}

function ContactPreview({ content }: { content: ContactPageContent }) {
  return (
    <div className="space-y-4">
      <PreviewSection title="Hero">
        <PreviewField label="Section Label" value={content.hero.sectionLabel} />
        <PreviewField label="Tagline" value={content.hero.tagline} />
        <PreviewImage src={content.hero.heroImage} alt={content.hero.heroImageAlt} />
      </PreviewSection>

      <PreviewSection title="Contact Intro & Form">
        <PreviewField label="Intro Heading" value={content.contactIntro.heading} />
        <PreviewField label="Form Heading" value={content.form.heading} />
      </PreviewSection>

      <PreviewSection title="Office Hours & Process">
        <PreviewField label="Office Hour Rows" value={content.officeHours.items.length} />
        <PreviewField label="Process Steps" value={content.process.steps.length} />
      </PreviewSection>

      <PreviewSection title="Visit Office & CTA">
        <PreviewField label="Visit Office Heading" value={content.visitOffice.heading} />
        <PreviewField label="CTA Heading" value={content.cta.heading} />
      </PreviewSection>
    </div>
  );
}

function PracticeAreasPreview({ content }: { content: PracticeAreasPageContent }) {
  return (
    <div className="space-y-4">
      <PreviewSection title="Hero">
        <PreviewField label="Section Label" value={content.hero.sectionLabel} />
        <PreviewField label="Tagline" value={content.hero.tagline} />
        <PreviewImage src={content.hero.heroImage} alt={content.hero.heroImageAlt} />
      </PreviewSection>

      <PreviewSection title="Intro">
        <PreviewField label="Heading" value={content.intro.heading} />
        <PreviewField label="Description" value={content.intro.description} />
      </PreviewSection>

      <PreviewSection title="Grid">
        <PreviewField label="Heading" value={content.grid.heading} />
        <PreviewField label="Areas" value={content.grid.areas.length} />
      </PreviewSection>
    </div>
  );
}

function PracticeAreaPagePreview({
  content,
}: {
  content: PracticeAreaPageContent;
}) {
  return (
    <div className="space-y-4">
      <PreviewSection title="Hero">
        <PreviewField label="Section Label" value={content.hero.sectionLabel} />
        <PreviewField label="Tagline" value={content.hero.tagline} />
        <PreviewImage
          src={content.hero.backgroundImage}
          alt={content.hero.backgroundImageAlt}
        />
      </PreviewSection>

      <PreviewSection title="Social Proof">
        <PreviewField label="Mode" value={content.socialProof.mode} />
        <PreviewField
          label="Testimonials"
          value={content.socialProof.testimonials.length}
        />
        <PreviewField
          label="Award Logos"
          value={content.socialProof.awards.logos.length}
        />
      </PreviewSection>

      <PreviewSection title="Content Sections">
        <PreviewField label="Sections" value={content.contentSections.length} />
        {content.contentSections.slice(0, 3).map((section, index) => (
          <PreviewImage
            key={`${section.image}-${index}`}
            src={section.image}
            alt={section.imageAlt}
          />
        ))}
      </PreviewSection>

      <PreviewSection title="FAQ">
        <PreviewField label="Enabled" value={content.faq.enabled ? "Yes" : "No"} />
        <PreviewField label="Heading" value={content.faq.heading} />
        <PreviewField label="Items" value={content.faq.items.length} />
      </PreviewSection>
    </div>
  );
}

interface StructuredPagePreviewProps {
  content: unknown;
}

export default function StructuredPagePreview({
  content,
}: StructuredPagePreviewProps) {
  if (isHomeContent(content)) {
    return <HomePreview content={content} />;
  }

  if (isAboutContent(content)) {
    return <AboutPreview content={content} />;
  }

  if (isContactContent(content)) {
    return <ContactPreview content={content} />;
  }

  if (isPracticeAreasContent(content)) {
    return <PracticeAreasPreview content={content} />;
  }

  if (isPracticeAreaPageContent(content)) {
    return <PracticeAreaPagePreview content={content} />;
  }

  return (
    <div className="p-4">
      <p className="text-sm text-gray-500 mb-2">Structured content preview:</p>
      <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto max-h-96">
        {JSON.stringify(content, null, 2)}
      </pre>
    </div>
  );
}
