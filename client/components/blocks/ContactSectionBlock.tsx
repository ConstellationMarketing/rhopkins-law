import type { ContentBlock } from "@site/lib/blocks";
import CmsFormRenderer from "@site/components/shared/CmsFormRenderer";

interface ContactSectionBlockProps {
  block: Extract<ContentBlock, { type: "contact-section" }>;
}

export default function ContactSectionBlock({ block }: ContactSectionBlockProps) {
  const bgImage = block.backgroundImage || "/images/backgrounds/contact-us-bg.jpg";

  return (
    <section className="bg-brand-dark relative">
      <div className="relative min-h-[400px] lg:min-h-[600px] overflow-hidden">
        {/* Background image — aligned with content area left edge, extends to right edge */}
        <div
          className="absolute top-0 right-0 hidden lg:block"
          style={{ left: "7.5%", bottom: block.tagline ? "80px" : "0" }}
        >
          <img
            src={bgImage}
            alt={block.backgroundImageAlt || "Contact background"}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Content wrapper */}
        <div className="relative z-10 max-w-[1600px] mx-auto w-[95%] md:w-[90%] lg:w-[85%]">
          {/* On mobile: tagline first, then form. On desktop: form left, tagline right */}
          <div className="flex flex-col-reverse lg:flex-col">
            <div className="flex flex-col lg:flex-row lg:items-end">
              {/* Left column: Crimson form panel */}
              <div className="lg:w-[45%] mt-[40px] md:mt-[60px] lg:mt-[100px]">
                <div className="bg-brand-accent p-6 md:p-10 lg:p-12 pt-8 md:pt-14 pb-0 flex flex-col">
                  {/* Heading — centered */}
                  {block.sectionLabel && (
                    <h2 className="font-playfair text-[22px] md:text-[32px] lg:text-[36px] leading-tight text-white font-bold mb-2 text-center">
                      {block.sectionLabel}
                    </h2>
                  )}

                  {/* Description paragraph — centered */}
                  {block.heading && (
                    <p className="font-playfair text-[16px] md:text-[22px] lg:text-[26px] leading-tight text-white mb-6 md:mb-8 text-center">
                      {block.heading}
                    </p>
                  )}

                  {/* Form */}
                  <div className="contact-form-white pb-0">
                    <CmsFormRenderer formId="contact-block" className="space-y-[16px] md:space-y-[20px]" />
                  </div>
                </div>
              </div>

              {/* Right column: Tagline anchored to bottom (desktop only) */}
              {block.tagline && (
                <div className="hidden lg:flex lg:w-[55%] flex-col justify-end">
                  <div className="bg-brand-dark py-6 px-8 text-left">
                    <div
                      className="font-playfair text-[clamp(1.5rem,4vw,48px)] leading-tight text-white font-bold highlight-underline"
                      dangerouslySetInnerHTML={{ __html: block.tagline }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Tagline on mobile — shown above the form panel */}
            {block.tagline && (
              <div className="lg:hidden pt-[30px] md:pt-[40px] px-2">
                <div
                  className="font-playfair text-[24px] md:text-[32px] leading-tight text-white font-bold text-center highlight-underline"
                  dangerouslySetInnerHTML={{ __html: block.tagline }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
