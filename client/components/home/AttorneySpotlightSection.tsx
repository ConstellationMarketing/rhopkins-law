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
    <section className="w-full">
      <div className="max-w-[2560px] mx-auto w-[95%] py-[40px] md:py-[60px]">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-[5%]">

          {/* Left column — ~70% */}
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

          {/* Right column — image with name/title overlay */}
          {data.image && (
            <div className="lg:w-[35%] relative flex-shrink-0">
              <div className="relative overflow-hidden">
                <img
                  src={data.image}
                  alt={data.imageAlt || ""}
                  className="w-full h-full object-cover block"
                />
                {(data.attorneyName || data.attorneyTitle) && (
                  <div
                    className="absolute bottom-0 left-0 right-0 px-[20px] py-[16px]"
                    style={{ backgroundColor: "rgba(54, 93, 150, 0.92)" }}
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
          )}

        </div>
      </div>
    </section>
  );
}
