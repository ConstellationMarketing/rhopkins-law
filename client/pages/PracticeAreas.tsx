import Seo from "@site/components/Seo";
import Layout from "@site/components/layout/Layout";
import PageHero from "@site/components/shared/PageHero";
import PracticeAreaGroupCard from "@site/components/practice/PracticeAreaGroupCard";
import CallBox from "@site/components/shared/CallBox";
import { Phone, Calendar } from "lucide-react";
import { usePracticeAreasContent } from "@site/hooks/usePracticeAreasContent";
import { useGlobalPhone } from "@site/contexts/SiteSettingsContext";
import RichText from "@site/components/shared/RichText";
import PracticeAreasSection from "@site/components/home/PracticeAreasSection";
import { Loader2 } from "lucide-react";

export default function PracticeAreas() {
  const { content, meta, isLoading } = usePracticeAreasContent();
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

  return (
    <Layout headerOverlay>
      <Seo
        title={meta.meta_title || "Practice Areas"}
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

      {/* Practice Areas Intro */}
      <PracticeAreasSection content={content.intro} />

      {/* Practice Areas Grid Section */}
      <div className="bg-white py-[40px] md:py-[60px]">
        <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] lg:w-[85%]">
          <div className="text-center mb-[30px] md:mb-[50px]">
            <h2 className="font-playfair text-[32px] md:text-[48px] lg:text-[54px] leading-tight md:leading-[54px] text-black">
              {content.grid.heading}
            </h2>
            <RichText
              html={content.grid.description}
              className="font-outfit text-[16px] md:text-[18px] leading-[24px] md:leading-[28px] text-black/80 mt-[15px] max-w-[800px] mx-auto"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {content.grid.areas.map((area, index) => (
              <PracticeAreaGroupCard key={index} area={area} />
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
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

      {/* Divider between CTA and footer */}
      <div className="w-full h-[3px]" style={{ backgroundColor: "#A1134C" }} />
    </Layout>
  );
}
