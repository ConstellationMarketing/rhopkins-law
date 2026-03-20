import Seo from "@site/components/Seo";
import Layout from "@site/components/layout/Layout";
import AboutSection from "@site/components/home/AboutSection";
import PracticeAreasSection from "@site/components/home/PracticeAreasSection";
import PracticeAreasGrid from "@site/components/home/PracticeAreasGrid";
import AwardsSection from "@site/components/home/AwardsSection";
import TestimonialsSection from "@site/components/home/TestimonialsSection";
import ProcessSection from "@site/components/home/ProcessSection";
import GoogleReviewsSection from "@site/components/home/GoogleReviewsSection";
import FaqSection from "@site/components/home/FaqSection";
import ContactUsSection from "@site/components/home/ContactUsSection";
import { useHomeContent } from "@site/hooks/useHomeContent";
import { useGlobalPhone } from "@site/contexts/SiteSettingsContext";
import { Loader2, Phone, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useSiteSettings } from "@site/contexts/SiteSettingsContext";

export default function Index() {
  const { content, meta, isLoading } = useHomeContent();
  const { phoneNumber, phoneDisplay, phoneLabel } = useGlobalPhone();
  const { settings } = useSiteSettings();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-brand-accent" />
        </div>
      </Layout>
    );
  }

  // Use CMS content for hero and partner logos
  const heroContent = content.hero;
  const partnerLogos = content.partnerLogos;

  return (
    <Layout>
      <Seo
        title={meta.meta_title || "Home"}
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

      {/* Hero Section — left-to-right gradient, image bottom-anchored */}
      <section
        className="w-full overflow-hidden"
        style={{ background: "linear-gradient(to right, #365d96 0%, #365d96 40%, #0e1e33 100%)" }}
      >
        <div className="max-w-[2560px] mx-auto w-[95%] pt-[20px] md:pt-[30px]">
          <div className="flex flex-col lg:flex-row lg:items-end gap-8 lg:gap-[3%]">

            {/* Left column */}
            <div className="lg:w-[65.667%] pb-[40px] md:pb-[60px]">

              {/* 1. Tagline — all caps */}
              <div className="mb-[30px] md:mb-[40px]">
                <p className="font-playfair text-[clamp(2.5rem,7vw,68.8px)] font-light leading-[1.2] text-white text-left uppercase">
                  {heroContent.highlightedText && heroContent.headline.includes(heroContent.highlightedText)
                    ? (() => {
                        const idx = heroContent.headline.indexOf(heroContent.highlightedText);
                        const before = heroContent.headline.slice(0, idx);
                        const match = heroContent.highlightedText;
                        const after = heroContent.headline.slice(idx + match.length);
                        return (
                          <>
                            {before}
                            <span className="text-brand-accent">{match}</span>
                            {after}
                          </>
                        );
                      })()
                    : (
                      <>
                        <span className="text-brand-accent">{heroContent.highlightedText}</span>
                        <br />
                        {heroContent.headline}
                      </>
                    )
                  }
                </p>
              </div>

              {/* 2. CTA Boxes — phone + book consultation side by side */}
              <div className="flex flex-col sm:flex-row gap-2 items-start mb-[30px] md:mb-[40px]">
                {/* Phone CTA */}
                <a href={`tel:${phoneNumber.replace(/\D/g, "")}`} className="block p-[8px] cursor-pointer">
                  <div className="flex items-center gap-4">
                    <span
                      className="flex items-center justify-center w-[60px] h-[60px] rounded-full flex-shrink-0"
                      style={{ backgroundColor: "#A1134C" }}
                    >
                      <Phone className="w-[30px] h-[30px] text-white" strokeWidth={1.5} />
                    </span>
                    <div className="flex-1">
                      <h4 className="font-outfit text-[16px] md:text-[18px] leading-tight text-white pb-[4px] font-normal">
                        {phoneLabel}
                      </h4>
                      <p className="font-outfit text-[clamp(1.75rem,5vw,40px)] text-white leading-tight whitespace-nowrap">
                        {phoneDisplay}
                      </p>
                    </div>
                  </div>
                </a>

                {/* Book a Consultation CTA — matches header button style */}
                <Link
                  to={settings.headerCtaUrl?.trim() || "/contact"}
                  className="inline-flex items-center gap-2 font-outfit text-[16px] text-white uppercase tracking-wide px-[20px] py-[18px] hover:opacity-90 transition-opacity self-center"
                  style={{ backgroundColor: "#A1134C" }}
                >
                  {settings.headerCtaText?.trim() || "Book a Consultation"}
                  <ArrowRight className="w-4 h-4" strokeWidth={2} />
                </Link>
              </div>

              {/* 3. H1 — title case */}
              {heroContent.h1Title && (
                <h1 className="font-outfit text-[18px] md:text-[20px] font-medium tracking-wider capitalize text-white">
                  {heroContent.h1Title}
                </h1>
              )}
            </div>

            {/* Right column — original width, image bottom-anchored */}
            <div className="lg:w-[31.3333%] self-end">
              {heroContent.heroImage && (
                <img
                  src={heroContent.heroImage}
                  alt={heroContent.heroImageAlt || ""}
                  className="w-full h-auto block object-bottom"
                  style={{ display: "block", marginBottom: 0 }}
                />
              )}
            </div>

          </div>
        </div>
      </section>

      {/* Partner Badges Section - Bottom of Hero */}
      {partnerLogos.length > 0 && (
        <div className="bg-brand-dark py-[20px] md:py-[30px]">
          <div className="max-w-[2560px] mx-auto w-[95%]">
            <div className="bg-brand-card border border-brand-border py-[10px] px-0 flex flex-nowrap justify-center overflow-hidden">
              {partnerLogos.map((logo, index) => (
                <div
                  key={index}
                  className="px-[8px] sm:px-[15px] md:px-[30px] py-2 flex items-center justify-center flex-shrink"
                >
                  <div className="text-center">
                    <img
                      src={logo.src}
                      alt={logo.alt}
                      className="w-[80px] sm:w-[100px] md:w-[120px] lg:w-[190px] max-w-full inline-block"
                      width={190}
                      height={123}
                      loading="lazy"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* About Us Section */}
      <AboutSection content={content.about} />

      {/* Practice Areas Section */}
      <PracticeAreasSection content={content.practiceAreasIntro} />

      {/* Practice Areas Grid */}
      <PracticeAreasGrid areas={content.practiceAreas} />

      {/* Awards & Membership Section */}
      <AwardsSection content={content.awards} headingTag={content.headingTags?.["awards.sectionLabel"]} />

      {/* Testimonials Section */}
      <TestimonialsSection content={content.testimonials} headingTag={content.headingTags?.["testimonials.sectionLabel"]} />

      {/* Process Section */}
      <ProcessSection content={content.process} headingTags={content.headingTags} />

      {/* Google Reviews Section */}
      <GoogleReviewsSection content={content.googleReviews} headingTag={content.headingTags?.["googleReviews.sectionLabel"]} />

      {/* FAQ Section */}
      <FaqSection content={content.faq} />

      {/* Contact Us Section */}
      <ContactUsSection content={content.contact} headingTag={content.headingTags?.["contact.sectionLabel"]} />
    </Layout>
  );
}
