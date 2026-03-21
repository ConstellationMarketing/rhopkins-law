import Seo from "@site/components/Seo";
import Layout from "@site/components/layout/Layout";
import PageHero from "@site/components/shared/PageHero";
import CallBox from "@site/components/shared/CallBox";
import StatsGrid from "@site/components/shared/StatsGrid";
import AboutSection from "@site/components/home/AboutSection";
import AttorneySpotlightSection from "@site/components/home/AttorneySpotlightSection";
import TeamMemberCard from "@site/components/about/TeamMemberCard";
import ValueCard from "@site/components/about/ValueCard";
import {
  Phone,
  Calendar,
  Scale,
  Award,
  Users,
  Heart,
  type LucideIcon,
  Loader2,
} from "lucide-react";
import { useAboutContent } from "@site/hooks/useAboutContent";
import { useGlobalPhone } from "@site/contexts/SiteSettingsContext";
import RichText from "@site/components/shared/RichText";

// Icon mapping for values section
const iconMap: Record<string, LucideIcon> = {
  Scale,
  Award,
  Users,
  Heart,
};

export default function AboutUs() {
  const { content, meta, isLoading } = useAboutContent();
  const { phoneNumber, phoneDisplay, phoneLabel } = useGlobalPhone();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-brand-accent" />
        </div>
      </Layout>
    );
  }

  // Map team members from CMS content
  const teamMembers = content.team.members;

  // Map core values from CMS content with icon components
  const coreValues = content.values.items.map((item) => ({
    icon: iconMap[item.icon] || Scale,
    title: item.title,
    description: item.description,
  }));

  // Map stats from CMS content
  const stats = content.stats.stats;

  return (
    <Layout headerOverlay>
      <Seo
        title={meta.meta_title || "About Us"}
        description={meta.meta_description || undefined}
        canonical={meta.canonical_url || undefined}
        noindex={meta.noindex}
        ogTitle={meta.og_title || undefined}
        ogDescription={meta.og_description || undefined}
        ogImage={meta.og_image || undefined}
        schemaType={meta.schema_type}
        schemaData={meta.schema_data}
        pageContent={content}
      />

      {/* Hero Section */}
      <PageHero
        h1Title={content.hero.sectionLabel}
        headline={content.hero.tagline}
        highlightedText={content.hero.highlightedText}
        heroImage={content.hero.heroImage}
        heroImageAlt={content.hero.heroImageAlt}
      />

      {/* About Section — reuses homepage component with independent content */}
      <AboutSection content={content.about} />

      {/* Attorney Spotlight — reuses homepage component with independent content */}
      <AttorneySpotlightSection content={content.attorneySpotlight} hideButton />

      {/* Team Section */}
      {teamMembers.length > 0 && (
        <div className="bg-white pt-[40px] md:pt-[60px] pb-[30px] md:pb-[54px]">
          <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] lg:w-[85%]">
            <div className="text-center mb-[30px] md:mb-[50px]">
              <div className="mb-[10px]">
                <p className="font-outfit text-[18px] md:text-[24px] leading-tight md:leading-[36px] text-[rgb(107,141,12)]">
                  {content.team.sectionLabel}
                </p>
              </div>
              <h2 className="font-playfair text-[32px] md:text-[48px] lg:text-[54px] leading-tight md:leading-[54px] text-black">
                {content.team.heading.split("\n").map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < content.team.heading.split("\n").length - 1 && (
                      <br className="hidden md:block" />
                    )}
                  </span>
                ))}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {teamMembers.map((member, index) => (
                <TeamMemberCard key={index} {...member} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Core Values Section */}
      {coreValues.length > 0 && (
        <div className="bg-brand-dark py-[40px] md:py-[60px]">
          <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] lg:w-[85%]">
            <div className="text-center mb-[30px] md:mb-[50px]">
              <div className="mb-[10px]">
                <p className="font-outfit text-[18px] md:text-[24px] leading-tight md:leading-[36px] text-brand-accent">
                  {content.values.sectionLabel}
                </p>
              </div>
              <h2 className="font-playfair text-[32px] md:text-[48px] lg:text-[54px] leading-tight md:leading-[54px] text-white">
                {content.values.heading}
              </h2>
              {content.values.subtitle && (
                <p className="font-outfit text-[16px] md:text-[18px] leading-[24px] md:leading-[28px] text-white/80 mt-[15px]">
                  {content.values.subtitle}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-[5%]">
              {coreValues.map((value, index) => (
                <ValueCard key={index} {...value} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats Section */}
      {stats.length > 0 && (
        <div className="bg-white py-[30px] md:py-[40px]">
          <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%]">
            <StatsGrid stats={stats} />
          </div>
        </div>
      )}

      {/* Why Choose Us — centered rich text block */}
      {(content.whyChooseUs.heading || content.whyChooseUs.body) && (
        <div className="bg-white pt-[30px] md:pt-[40px] pb-[40px] md:pb-[60px]">
          <div className="max-w-[900px] mx-auto w-[90%] text-center">
            {content.whyChooseUs.heading && (
              <h2 className="font-playfair text-[32px] md:text-[48px] lg:text-[54px] leading-tight md:leading-[54px] text-black pb-[20px]">
                {content.whyChooseUs.heading}
              </h2>
            )}
            {content.whyChooseUs.body && (
              <RichText
                html={content.whyChooseUs.body}
                className="font-outfit text-[16px] md:text-[18px] leading-[24px] md:leading-[28px] text-black"
              />
            )}
          </div>
        </div>
      )}

      {/* Call to Action Section */}
      {content.cta.heading && (
        <div className="py-[40px] md:py-[60px]" style={{ backgroundColor: "#365D96" }}>
          <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] lg:w-[80%]">
            <div className="text-center mb-[30px] md:mb-[40px]">
              <h2 className="font-playfair text-[36px] md:text-[48px] lg:text-[60px] leading-tight text-white pb-[15px]">
                {content.cta.heading}
              </h2>
              <RichText
                html={content.cta.description}
                className="font-outfit text-[18px] md:text-[22px] leading-[26px] md:leading-[32px] text-white/80"
              />
            </div>

            <div className="flex flex-col md:flex-row gap-6 md:gap-8 justify-center items-center md:items-start">
              <CallBox
                icon={Phone}
                title={phoneLabel}
                subtitle={phoneDisplay}
                phone={phoneNumber}
                className="bg-transparent"
                variant="dark"
              />
              <CallBox
                icon={Calendar}
                title={content.cta.secondaryButton.label}
                subtitle={content.cta.secondaryButton.sublabel}
                link={content.cta.secondaryButton.link}
                className="bg-brand-accent hover:bg-brand-accent-dark"
                variant="dark"
                accentIcon
              />
            </div>
          </div>
        </div>
      )}

      {/* Divider between CTA and footer */}
      <div className="w-full h-0 relative z-10">
        <div className="absolute left-0 right-0" style={{ transform: "translateY(-50%)" }}>
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2F50bd0f2438824f8ea1271cf7dd2c508e%2F870edef9ac1b45fca64a1bcbadb1a17c?format=webp&width=800&height=1200"
            alt=""
            aria-hidden="true"
            className="w-full block"
          />
        </div>
      </div>
    </Layout>
  );
}
