import { Phone, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import type { AboutContent } from "@site/lib/cms/homePageTypes";
import { useSiteSettings, useGlobalPhone } from "@/hooks/useSiteSettings";
import RichText from "@site/components/shared/RichText";

interface AboutSectionProps {
  content?: AboutContent;
}

export default function AboutSection({ content }: AboutSectionProps) {
  // Guard: if no meaningful content, don't render
  if (!content || (!content.heading && !content.description)) {
    return null;
  }

  const data = content;
  const features = data.features || [];
  const stats = data.stats || [];
  const { phoneNumber, phoneAvailability: phoneLabel, phoneDisplay } = useGlobalPhone();

  return (
    <div className="bg-white pt-[15px] md:pt-[27px]">
      {/* Main Content Section */}
      <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] pt-[20px] md:pt-[27px]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-[5.5%]">
          {/* Left Column - About Text and CTAs */}
          <div className="md:w-full">
            {/* About Us Label */}
            {data.sectionLabel && (
              <div className="text-[rgb(107,141,12)] font-outfit text-[18px] md:text-[24px] leading-tight md:leading-[36px] mb-[10px]">
                {data.sectionLabel}
              </div>
            )}

            {/* Heading */}
            <div className="mb-[20px] md:mb-[9.27%]">
              {data.heading && (
                <h2 className="font-playfair text-[32px] md:text-[48px] lg:text-[54px] leading-tight md:leading-[54px] text-black pb-[10px]">
                  {data.heading}
                </h2>
              )}
              {data.description && (
                <RichText
                  html={data.description}
                  className="font-outfit text-[16px] md:text-[20px] leading-[24px] md:leading-[30px] text-black"
                />
              )}
            </div>

            {/* Call Us 24/7 Box */}
            <a href={`tel:${phoneNumber.replace(/\D/g, "")}`} className="block mb-[9.27%]">
              <div className="p-[8px] w-full max-w-[400px] cursor-pointer">
                <div className="flex items-start gap-4">
                  <span
                    className="flex items-center justify-center w-[44px] h-[44px] rounded-full flex-shrink-0 mt-1"
                    style={{ backgroundColor: "#A1134C" }}
                  >
                    <Phone className="w-[22px] h-[22px] text-white" strokeWidth={1.5} />
                  </span>
                  <div className="flex-1">
                    <h4 className="font-outfit text-[16px] md:text-[18px] leading-tight text-black pb-[10px]">
                      {phoneLabel}
                    </h4>
                    <p className="font-outfit text-[28px] md:text-[40px] text-black leading-none">
                      {phoneDisplay}
                    </p>
                  </div>
                </div>
              </div>
            </a>

            {/* Contact Us Box */}
            {data.contactLabel && (
              <Link to="/contact/" className="p-[8px] w-full max-w-[400px] cursor-pointer block">
                <div className="flex items-start gap-4">
                  <span
                    className="flex items-center justify-center w-[44px] h-[44px] rounded-full flex-shrink-0 mt-1"
                    style={{ backgroundColor: "#A1134C" }}
                  >
                    <MessageCircle className="w-[22px] h-[22px] text-white" strokeWidth={1.5} />
                  </span>
                  <div className="flex-1">
                    <h4 className="font-outfit text-[16px] md:text-[18px] leading-tight text-black pb-[10px]">
                      {data.contactLabel}
                    </h4>
                    <p className="font-outfit text-[18px] md:text-[24px] text-black leading-none">
                      {data.contactText}
                    </p>
                  </div>
                </div>
              </Link>
            )}
          </div>

          {/* Middle Column - Image */}
          {data.attorneyImage && (
            <div className="md:w-full flex justify-center md:justify-start">
              <img
                src={data.attorneyImage}
                alt={data.attorneyImageAlt}
                className="max-w-full w-auto h-auto object-contain"
                width={462}
                height={631}
                loading="lazy"
              />
            </div>
          )}

          {/* Right Column - Features */}
          {features.length > 0 && (
            <div className="md:w-full space-y-[20px] md:space-y-[30px]">
              {features.map((feature, index) => (
                <div key={index}>
                  <div className="mb-[20px] md:mb-[30px]">
                    <h3 className="font-outfit text-[22px] md:text-[28px] leading-tight md:leading-[28px] text-black pb-[10px]">
                      {feature.number}. {feature.title}
                    </h3>
                    <RichText
                      html={feature.description}
                      className="font-outfit text-[16px] md:text-[20px] leading-[24px] md:leading-[30px] text-black"
                    />
                  </div>
                  {index < features.length - 1 && (
                    <div className="h-[23px]">
                      <div className="inline-block w-full"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
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
