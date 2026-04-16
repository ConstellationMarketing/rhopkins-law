import type { ContactContent } from "@site/lib/cms/homePageTypes";
import DynamicHeading from "@site/components/shared/DynamicHeading";
import CmsFormRenderer from "@site/components/shared/CmsFormRenderer";
import RichText from "@site/components/shared/RichText";

interface ContactUsSectionProps {
  content?: ContactContent;
  headingTag?: string;
}

export default function ContactUsSection({ content, headingTag }: ContactUsSectionProps) {
  if (!content || (!content.heading && !content.sectionLabel)) {
    return null;
  }

  const data = content;
  const bgImage = data.image || "/images/backgrounds/contact-us-bg.jpg";

  return (
    <section className="bg-brand-dark relative">
      <div className="relative min-h-[400px] lg:min-h-[600px] overflow-hidden">
        {/* Background image — desktop only */}
        <div
          className="absolute top-0 right-0 hidden lg:block"
          style={{ left: "7.5%", bottom: data.tagline ? "80px" : "0" }}
        >
          <img
            src={bgImage}
            alt={data.imageAlt || "Contact background"}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Content wrapper */}
        <div className="relative z-10 max-w-[1600px] mx-auto w-[95%] md:w-[90%] lg:w-[85%]">
          {/* Mobile: tagline first (via flex-col-reverse), Desktop: normal order */}
          <div className="flex flex-col-reverse lg:flex-col">
            {/* Main row */}
            <div className="flex flex-col lg:flex-row lg:items-end">
              {/* Left column: Crimson form panel */}
              <div className="lg:w-[45%] mt-[40px] md:mt-[60px] lg:mt-[100px]">
                <div className="bg-brand-accent p-6 md:p-10 lg:p-12 pt-8 md:pt-14 pb-0 flex flex-col">
                  {data.sectionLabel && (
                    <DynamicHeading
                      tag={headingTag}
                      defaultTag="h2"
                      className="font-playfair text-[22px] md:text-[32px] lg:text-[36px] leading-tight text-white font-bold mb-2 text-center"
                    >
                      {data.sectionLabel}
                    </DynamicHeading>
                  )}

                  {data.heading && (
                    <p className="font-playfair text-[16px] md:text-[22px] lg:text-[26px] leading-tight text-white mb-6 md:mb-8 text-center">
                      {data.heading}
                    </p>
                  )}

                  <div className="contact-form-white pb-0">
                    <CmsFormRenderer formId="contact" className="space-y-[16px] md:space-y-[20px]" />
                  </div>
                </div>
              </div>

              {/* Right column: Tagline — desktop only */}
              {data.tagline && (
                <div className="hidden lg:flex lg:w-[55%] flex-col justify-end">
                  <div className="bg-brand-dark py-6 px-8 text-left">
                    <RichText
                      html={data.tagline}
                      className="font-playfair text-[clamp(1.5rem,4vw,48px)] leading-tight text-white font-bold highlight-underline"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Tagline on mobile — appears above the form */}
            {data.tagline && (
              <div className="lg:hidden pt-[30px] md:pt-[40px] px-2">
                <RichText
                  html={data.tagline}
                  className="font-playfair text-[24px] md:text-[32px] leading-tight text-white font-bold text-center highlight-underline"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
