import { Phone, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import type { AboutContent } from "@site/lib/cms/homePageTypes";
import { useGlobalPhone } from "@/hooks/useSiteSettings";
import RichText from "@site/components/shared/RichText";

interface AboutSectionProps {
  content?: AboutContent;
}

export default function AboutSection({ content }: AboutSectionProps) {
  if (!content || (!content.heading && !content.description)) {
    return null;
  }

  const data = content;
  const stats = data.stats || [];
  const { phoneNumber, phoneAvailability: phoneLabel, phoneDisplay } = useGlobalPhone();

  return (
    <div className="pt-[15px] md:pt-[27px] pb-[40px] md:pb-[60px]" style={{ backgroundColor: "#EFF0EB" }}>
      <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] pt-[20px] md:pt-[27px]">

        {/* Row 1 — Section label + Heading (full width) */}
        <div className="mb-[24px] md:mb-[36px]">
          {data.sectionLabel && (
            <div className="text-brand-accent font-outfit text-[18px] md:text-[24px] leading-tight md:leading-[36px] mb-[10px]">
              {data.sectionLabel}
            </div>
          )}
          {data.heading && (
            <h2 className="font-playfair text-[32px] md:text-[48px] lg:text-[54px] leading-tight md:leading-[54px] text-black">
              {data.heading}
            </h2>
          )}
        </div>

        {/* Row 2 — Two equal columns: image (left) + content (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-[5%] items-stretch">

          {/* Left column — Attorney image stretches to match right column height */}
          {data.attorneyImage && (
            <div className="flex items-center justify-center lg:justify-start">
              <img
                src={data.attorneyImage}
                alt={data.attorneyImageAlt}
                className="max-w-full w-auto object-cover object-top"
                style={{ height: "100%", maxHeight: "700px" }}
                loading="lazy"
              />
            </div>
          )}

          {/* Right column — Sub-heading, divider, description, CTAs */}
          <div className="flex flex-col justify-start">

            {/* Sub-heading */}
            {data.subheading && (
              <>
                <p className="font-playfair text-[22px] md:text-[30px] leading-snug text-black mb-[16px]">
                  {data.subheading}
                </p>
                {/* Crimson divider */}
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F50bd0f2438824f8ea1271cf7dd2c508e%2F4539924385de498486af39ac35ce9bcb?format=webp&width=800&height=1200"
                  alt=""
                  aria-hidden="true"
                  style={{ height: "5px" }}
                  className="w-auto block mb-[16px]"
                />
              </>
            )}

            {/* Description */}
            {data.description && (
              <div className="mb-[24px] md:mb-[32px]">
                <RichText
                  html={data.description}
                  className="font-outfit text-[16px] md:text-[20px] leading-[24px] md:leading-[30px] text-black"
                />
              </div>
            )}

            {/* CTAs — always inline side by side */}
            <div className="flex flex-row items-stretch gap-4 flex-wrap">
              {/* Phone CTA */}
              <a href={`tel:${phoneNumber.replace(/\D/g, "")}`} className="flex-1 min-w-[180px]">
                <div className="p-[8px] cursor-pointer h-full">
                  <div className="flex items-center gap-3 h-full">
                    <span
                      className="flex items-center justify-center w-[52px] h-[52px] rounded-full flex-shrink-0"
                      style={{ backgroundColor: "#A1134C" }}
                    >
                      <Phone className="w-[26px] h-[26px] text-white" strokeWidth={1.5} />
                    </span>
                    <div className="flex-1">
                      <h4 className="font-outfit text-[14px] md:text-[16px] leading-tight text-black pb-[2px]">
                        {phoneLabel}
                      </h4>
                      <p className="font-outfit text-[22px] md:text-[32px] text-black leading-none">
                        {phoneDisplay}
                      </p>
                    </div>
                  </div>
                </div>
              </a>

              {/* Contact Us CTA */}
              {data.contactLabel && (
                <Link to="/contact/" className="flex-1 min-w-[160px]">
                  <div className="bg-brand-accent hover:bg-brand-accent-dark group p-[8px] cursor-pointer transition-all duration-300 h-full">
                    <div className="flex items-center gap-3 h-full">
                      <div className="flex items-center justify-center p-[12px] flex-shrink-0 bg-white group-hover:bg-black transition-colors duration-300">
                        <MessageCircle className="w-7 h-7 text-brand-accent group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-outfit text-[14px] md:text-[16px] leading-tight text-white pb-[4px]">
                          {data.contactLabel}
                        </h4>
                        <p className="font-outfit text-[16px] md:text-[20px] text-white leading-none">
                          {data.contactText}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      {stats.length > 0 && (
        <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] py-[20px] md:py-[27px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 lg:gap-[3%]">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="max-w-[550px] mx-auto">
                  <h4 className="font-[Crimson_Pro,Georgia,Times_New_Roman,serif] text-[40px] md:text-[60px] leading-tight md:leading-[60px] text-black pb-[10px]">
                    {stat.value}
                  </h4>
                  <div className="font-outfit text-[16px] md:text-[20px] font-light text-black text-center">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
