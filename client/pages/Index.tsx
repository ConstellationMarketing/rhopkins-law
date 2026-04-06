import Seo from "@site/components/Seo";
import Layout from "@site/components/layout/Layout";
import AboutSection from "@site/components/home/AboutSection";
import AttorneySpotlightSection from "@site/components/home/AttorneySpotlightSection";
import HomeCTASection from "@site/components/home/HomeCTASection";
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
import { Phone, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useSiteSettings } from "@site/contexts/SiteSettingsContext";
import { Helmet } from "react-helmet-async";

const deferredSectionStyle = {
  contentVisibility: "auto" as const,
  containIntrinsicSize: "900px",
};

export default function Index() {
  const { content, meta } = useHomeContent();
  const { phoneNumber, phoneDisplay, phoneLabel } = useGlobalPhone();
  const { settings } = useSiteSettings();

  const heroContent = content.hero;
  const partnerLogos = content.partnerLogos;
  const heroImage = heroContent.heroImage?.trim() || "";

  return (
    <Layout headerOverlay>
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

      {heroImage && (
        <Helmet>
          <link rel="preload" as="image" href={heroImage} />
        </Helmet>
      )}

      <section
        className="w-full overflow-hidden"
        style={{ background: "linear-gradient(to right, #365d96 0%, #365d96 28%, #060d1a 100%)" }}
      >
        <div className="max-w-[2560px] mx-auto w-[95%] pt-[120px] lg:pt-[105px]">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4 lg:gap-[3%]">
            <div className="lg:w-[65.667%] pb-[20px] md:pb-[60px]">
              <div className="mb-[30px] md:mb-[40px]">
                <p className="font-playfair text-[clamp(2.1rem,5.5vw,60px)] leading-[1.2] text-white text-left uppercase">
                  {heroContent.highlightedText && heroContent.headline.includes(heroContent.highlightedText)
                    ? (() => {
                        const idx = heroContent.headline.indexOf(heroContent.highlightedText);
                        const before = heroContent.headline.slice(0, idx);
                        const match = heroContent.highlightedText;
                        const after = heroContent.headline.slice(idx + match.length);
                        return (
                          <>
                            {before}
                            <span className="underline decoration-brand-accent decoration-[3px] underline-offset-4">{match}</span>
                            {after}
                          </>
                        );
                      })()
                    : (
                      <>
                        <span className="underline decoration-brand-accent decoration-[3px] underline-offset-4">{heroContent.highlightedText}</span>
                        <br />
                        {heroContent.headline}
                      </>
                    )}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-8 items-stretch mb-[30px] md:mb-[40px]">
                <a href={`tel:${phoneNumber.replace(/\D/g, "")}`} className="block py-[8px] cursor-pointer">
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

                <Link
                  to={settings.headerCtaUrl?.trim() || "/contact"}
                  className="inline-flex items-center gap-2 font-outfit text-[16px] text-white uppercase tracking-wide px-[24px] py-[20px] sm:py-0 hover:opacity-90 transition-opacity self-stretch"
                  style={{ backgroundColor: "#A1134C" }}
                >
                  {settings.headerCtaText?.trim() || "Book a Consultation"}
                  <ArrowRight className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
                </Link>
              </div>

              {heroContent.h1Title && (
                <h1 className="font-outfit text-[18px] md:text-[20px] font-medium tracking-wider capitalize text-white flex items-center gap-3">
                  <span aria-hidden="true" className="h-[5px] w-[72px] flex-shrink-0 bg-brand-accent" />
                  {heroContent.h1Title}
                </h1>
              )}
            </div>

            <div className="lg:w-[31.3333%] self-end">
              {heroImage && (
                <div className="relative ml-auto w-full max-w-[520px] aspect-[4/5]">
                  <img
                    src={heroImage}
                    alt={heroContent.heroImageAlt || ""}
                    className="absolute inset-0 h-full w-full block object-contain object-bottom"
                    width={640}
                    height={800}
                    sizes="(min-width: 1024px) 31vw, 90vw"
                    loading="eager"
                    decoding="async"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

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
                      decoding="async"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="relative h-0 w-full z-10">
        <div className="absolute right-0 w-[60%]" style={{ transform: "translateY(-50%)" }}>
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2F50bd0f2438824f8ea1271cf7dd2c508e%2F870edef9ac1b45fca64a1bcbadb1a17c?format=webp&width=800&height=1200"
            alt=""
            aria-hidden="true"
            className="w-full block"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      <AboutSection content={content.about} />
      <AttorneySpotlightSection content={content.attorneySpotlight} />

      <div className="relative h-0 w-full z-10">
        <div className="absolute left-0 w-[60%]" style={{ transform: "translateY(-50%) scaleX(-1)" }}>
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2F50bd0f2438824f8ea1271cf7dd2c508e%2F870edef9ac1b45fca64a1bcbadb1a17c?format=webp&width=800&height=1200"
            alt=""
            aria-hidden="true"
            className="w-full block"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      <HomeCTASection content={content.homeCta} />
      <PracticeAreasSection content={content.practiceAreasIntro} />
      <PracticeAreasGrid areas={content.practiceAreas} />

      <div style={deferredSectionStyle}>
        <AwardsSection content={content.awards} headingTag={content.headingTags?.["awards.sectionLabel"]} />
      </div>

      <div style={deferredSectionStyle}>
        <TestimonialsSection content={content.testimonials} headingTag={content.headingTags?.["testimonials.sectionLabel"]} />
      </div>

      <div style={deferredSectionStyle}>
        <ProcessSection content={content.process} headingTags={content.headingTags} />
      </div>

      <div style={deferredSectionStyle}>
        <GoogleReviewsSection content={content.googleReviews} headingTag={content.headingTags?.["googleReviews.sectionLabel"]} />
      </div>

      <div style={deferredSectionStyle}>
        <FaqSection content={content.faq} />
      </div>

      <div style={deferredSectionStyle}>
        <ContactUsSection content={content.contact} headingTag={content.headingTags?.["contact.sectionLabel"]} />
      </div>
    </Layout>
  );
}
