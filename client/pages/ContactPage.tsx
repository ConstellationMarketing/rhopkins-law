import Seo from "@site/components/Seo";
import Layout from "@site/components/layout/Layout";
import PageHero from "@site/components/shared/PageHero";
import ContactForm from "@site/components/home/ContactForm";
import CallBox from "@site/components/shared/CallBox";
import PracticeAreasSection from "@site/components/home/PracticeAreasSection";
import { Phone, Clock } from "lucide-react";
import { useContactContent } from "@site/hooks/useContactContent";
import { useGlobalPhone, useSiteSettings } from "@site/contexts/SiteSettingsContext";
import RichText from "@site/components/shared/RichText";
import { Loader2 } from "lucide-react";

export default function ContactPage() {
  const { content, meta, isLoading } = useContactContent();
  const { phoneNumber, phoneDisplay, phoneLabel } = useGlobalPhone();
  const { settings } = useSiteSettings();

  // Map office hours from CMS content
  const officeHours = content.officeHours.items;

  // Map process steps from CMS content
  const whatToExpect = content.process.steps;

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
        title={meta.meta_title || "Contact Us"}
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

      {/* Contact Intro Section */}
      <PracticeAreasSection content={content.contactIntro} />

      {/* Contact Form & Office Hours Section */}
      <div className="bg-brand-dark py-[40px] md:py-[60px]">
        <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] lg:w-[85%]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-[8%]">
            {/* Left Side - Contact Form */}
            <div>
              <div className="mb-[20px] md:mb-[30px] text-center lg:text-left">
                <h2 className="font-playfair text-[32px] md:text-[40px] leading-tight text-white pb-[10px] text-center">
                  {content.form.heading}
                </h2>
                {content.form.subtext && (
                  <RichText
                    html={content.form.subtext}
                    className="font-outfit text-[16px] md:text-[18px] leading-[24px] md:leading-[28px] text-white/80"
                  />
                )}
              </div>
              <ContactForm />
            </div>

            {/* Right Side - Office Hours & Additional Info */}
            <div className="space-y-[30px] md:space-y-[40px]">
              {/* Office Hours */}
              <div className="bg-brand-card border border-brand-border p-[30px] md:p-[40px]">
                <div className="flex items-center gap-3 mb-[20px]">
                  <div className="bg-brand-accent p-[15px]">
                    <Clock
                      className="w-[30px] h-[30px] text-white"
                      strokeWidth={1.5}
                    />
                  </div>
                  <h3 className="font-playfair text-[24px] md:text-[28px] leading-tight text-white">
                    {content.officeHours.heading}
                  </h3>
                </div>
                <div className="space-y-[15px]">
                  {officeHours.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center pb-[15px] border-b border-brand-border/50 last:border-0 last:pb-0"
                    >
                      <span className="font-outfit text-[16px] md:text-[18px] text-white/80">
                        {item.day}
                      </span>
                      <span className="font-outfit text-[16px] md:text-[18px] text-white font-medium">
                        {item.hours}
                      </span>
                    </div>
                  ))}
                </div>
                {content.officeHours.note && (
                  <div className="mt-[25px] pt-[25px] border-t border-brand-border/50">
                    <RichText
                      html={content.officeHours.note}
                      className="font-outfit text-[14px] md:text-[16px] text-white/70 leading-[22px] md:leading-[24px]"
                    />
                  </div>
                )}
              </div>

              {/* Phone Call Box */}
              <CallBox
                icon={Phone}
                title={phoneLabel}
                subtitle={phoneDisplay}
                phone={phoneNumber}
                className="w-full max-w-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* What to Expect Section */}
      <div className="bg-white py-[40px] md:py-[60px]">
        <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] lg:w-[80%]">
          <div className="text-center mb-[30px] md:mb-[50px]">
            <div className="mb-[10px]">
              <p className="font-outfit text-[18px] md:text-[24px] leading-tight md:leading-[36px] text-[rgb(107,141,12)]">
                {content.process.sectionLabel}
              </p>
            </div>
            <h2 className="font-playfair text-[32px] md:text-[48px] lg:text-[54px] leading-tight md:leading-[54px] text-black">
              {content.process.heading}
            </h2>
            {content.process.subtitle && (
              <p className="font-outfit text-[16px] md:text-[18px] leading-[24px] md:leading-[28px] text-black/80 mt-[15px]">
                {content.process.subtitle}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {whatToExpect.map((item, index) => (
              <div key={index} className="text-center">
                <div className="mb-[20px] flex justify-center">
                  <div className="w-[60px] h-[60px] md:w-[70px] md:h-[70px] bg-brand-accent flex items-center justify-center">
                    <span className="font-playfair text-[32px] md:text-[40px] text-black font-bold">
                      {item.number}
                    </span>
                  </div>
                </div>
                <h3 className="font-playfair text-[22px] md:text-[26px] leading-tight text-black pb-[12px]">
                  {item.title}
                </h3>
                <RichText
                  html={item.description}
                  className="font-outfit text-[14px] md:text-[16px] leading-[22px] md:leading-[24px] text-black/80"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="bg-brand-dark py-[40px] md:py-[60px]">
        <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%]">
          <div className="text-center mb-[30px] md:mb-[40px]">
            <h2 className="font-playfair text-[32px] md:text-[48px] leading-tight text-white pb-[10px]">
              {content.visitOffice.heading}
            </h2>
            {content.visitOffice.subtext && (
              <RichText
                html={content.visitOffice.subtext}
                className="font-outfit text-[16px] md:text-[18px] leading-[24px] md:leading-[28px] text-white/80"
              />
            )}
          </div>

          <div className="bg-brand-card border border-brand-border p-[20px] md:p-[30px]">
            <iframe
              src={content.visitOffice.mapEmbedUrl || settings.mapEmbedUrl}
              width="100%"
              height="450"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-[350px] md:h-[450px]"
              title="Office Location"
            ></iframe>
          </div>
        </div>
      </div>
    </Layout>
  );
}
