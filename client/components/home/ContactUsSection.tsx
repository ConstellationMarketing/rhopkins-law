import type { ContactContent } from "@site/lib/cms/homePageTypes";
import DynamicHeading from "@site/components/shared/DynamicHeading";
import CmsFormRenderer from "@site/components/shared/CmsFormRenderer";

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
      <div className="relative min-h-[600px]">
        {/* Background image — starts at ~45% from left (aligned with form panel left edge), extends to right */}
        <div
          className="absolute top-0 right-0 bottom-0 hidden lg:block"
          style={{ left: "40%" }}
        >
          <img
            src={bgImage}
            alt={data.imageAlt || "Contact background"}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Crimson form panel — left side */}
        <div className="relative z-10 max-w-[1600px] mx-auto w-[95%] md:w-[90%] lg:w-[85%]">
          <div className="lg:w-[45%] bg-brand-accent p-8 md:p-10 lg:p-12 py-10 md:py-14">
            {/* Heading */}
            {data.sectionLabel && (
              <DynamicHeading
                tag={headingTag}
                defaultTag="h2"
                className="font-playfair text-[24px] md:text-[32px] lg:text-[36px] leading-tight text-white font-bold mb-2"
              >
                {data.sectionLabel}
              </DynamicHeading>
            )}

            {/* Description paragraph */}
            {data.heading && (
              <p className="font-playfair text-[18px] md:text-[22px] lg:text-[26px] leading-tight text-white mb-8">
                {data.heading}
              </p>
            )}

            {/* Form */}
            <div className="contact-form-white">
              <CmsFormRenderer formId="contact" className="space-y-[20px]" />
            </div>
          </div>
        </div>

        {/* Tagline strip — bottom right */}
        {data.tagline && (
          <div className="relative z-10 max-w-[1600px] mx-auto w-[95%] md:w-[90%] lg:w-[85%] flex justify-end">
            <div className="bg-brand-dark py-6 px-8 lg:w-[60%] text-right">
              <div
                className="font-playfair text-[clamp(1.5rem,4vw,48px)] leading-tight text-white font-bold highlight-underline"
                dangerouslySetInnerHTML={{ __html: data.tagline }}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
