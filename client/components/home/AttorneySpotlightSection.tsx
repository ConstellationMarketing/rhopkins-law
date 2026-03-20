import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { AttorneySpotlightContent } from "@site/lib/cms/homePageTypes";
import RichText from "@site/components/shared/RichText";

interface AttorneySpotlightSectionProps {
  content?: AttorneySpotlightContent;
}

export default function AttorneySpotlightSection({ content }: AttorneySpotlightSectionProps) {
  if (!content || (!content.heading && !content.description)) return null;

  const data = content;
  const buttonText = data.buttonText?.trim() || "Meet The Attorney";
  const buttonLink = data.buttonLink?.trim() || "/about/";

  return (
    <section className="w-full" style={{ backgroundColor: "#EFF0EB" }}>
      <div className="max-w-[2560px] mx-auto w-[95%] pt-[20px] md:pt-[30px] pb-[40px] md:pb-[60px]">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-[5%] items-center">

          {/* Left column — ~65% */}
          <div className="flex flex-col justify-center lg:w-[65%] gap-[18px]">
            {data.sectionLabel && (
              <p className="text-brand-accent font-outfit text-[16px] md:text-[18px] uppercase tracking-widest font-medium">
                {data.sectionLabel}
              </p>
            )}

            {data.heading && (
              <h2 className="font-playfair text-[32px] md:text-[48px] lg:text-[54px] leading-tight text-black">
                {data.heading}
              </h2>
            )}

            {data.description && (
              <div className="font-outfit text-[15px] md:text-[16px] text-gray-700 leading-relaxed rich-text">
                <RichText html={data.description} />
              </div>
            )}

            <Link
              to={buttonLink}
              className="inline-flex items-center gap-2 font-outfit text-[16px] text-white uppercase tracking-wide px-[24px] py-[18px] hover:opacity-90 transition-opacity self-start mt-[8px]"
              style={{ backgroundColor: "#A1134C" }}
            >
              {buttonText}
              <ArrowRight className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
            </Link>
          </div>

          {/* Right column — image with decorative frame */}
          {data.image && (
            <div className="lg:w-[35%] flex-shrink-0 flex justify-center lg:justify-end">
              {/* Outer wrapper provides space for the offset border */}
              <div className="relative" style={{ paddingBottom: "16px", paddingRight: "16px" }}>
                {/* Decorative offset blue border — sits behind and offset bottom-right */}
                <div
                  className="absolute bottom-0 right-0 w-full h-full"
                  style={{ border: "2px solid #365d96" }}
                />

                {/* Image card with crimson background */}
                <div
                  className="relative overflow-hidden"
                  style={{ backgroundColor: "#A1134C" }}
                >
                  <img
                    src={data.image}
                    alt={data.imageAlt || ""}
                    className="w-full block object-cover relative z-10"
                  />
                  {(data.attorneyName || data.attorneyTitle) && (
                    <div
                      className="relative z-10 px-[20px] py-[16px]"
                      style={{ backgroundColor: "rgba(10, 20, 50, 0.82)" }}
                    >
                      {data.attorneyName && (
                        <p className="font-playfair text-white text-[20px] md:text-[24px] leading-tight">
                          {data.attorneyName}
                        </p>
                      )}
                      {data.attorneyTitle && (
                        <p className="font-outfit text-white/80 text-[13px] md:text-[14px] mt-[2px] uppercase tracking-wide">
                          {data.attorneyTitle}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
