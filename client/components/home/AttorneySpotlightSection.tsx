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
      <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] pt-[20px] md:pt-[30px] pb-[40px] md:pb-[60px]">
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
              <div className="font-outfit text-[16px] md:text-[20px] leading-[24px] md:leading-[30px] text-black rich-text">
                <RichText html={data.description} />
              </div>
            )}

            <Link
              to={buttonLink}
              className="inline-flex items-center gap-2 font-outfit text-[16px] text-white uppercase tracking-wide px-[24px] py-[18px] hover:opacity-90 transition-opacity self-start mt-[8px]"
              style={{ backgroundColor: "#365D96" }}
            >
              {buttonText}
              <ArrowRight className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
            </Link>
          </div>

          {/* Right column — image with decorative frame */}
          {data.image && (
            <div className="lg:w-[35%] flex-shrink-0 flex justify-center lg:justify-end">
              {/*
                Outer wrapper: padding-right + padding-bottom creates the
                "canvas" area where the decorative border can peek out.
                The image card fills the content area (top-left portion).
                The border div is absolute, offset 16px from top-left of the
                wrapper's padding box, reaching to the outer right/bottom edges.
              */}
              <div
                className="relative"
                style={{ paddingRight: "16px", paddingBottom: "16px" }}
              >
                {/* Decorative blue border — offset from image, visible only outside it */}
                <div
                  className="absolute"
                  style={{
                    top: "16px",
                    left: "16px",
                    right: "0",
                    bottom: "0",
                    border: "2px solid #365d96",
                  }}
                />

                {/* Image card — sits above the border in z-order */}
                <div
                  className="relative overflow-hidden"
                  style={{ backgroundColor: "#A1134C", zIndex: 1 }}
                >
                  <img
                    src={data.image}
                    alt={data.imageAlt || ""}
                    className="w-full block"
                  />

                  {/* Name / title overlay — absolute over the image, centered */}
                  {(data.attorneyName || data.attorneyTitle) && (
                    <div
                      className="absolute bottom-0 left-0 right-0 text-center"
                      style={{
                        background:
                          "linear-gradient(to bottom, transparent 0%, rgba(8, 18, 46, 0.90) 55%)",
                        padding: "60px 20px 22px",
                        zIndex: 2,
                      }}
                    >
                      {data.attorneyName && (
                        <p className="font-playfair text-white text-[22px] md:text-[26px] leading-tight">
                          {data.attorneyName}
                        </p>
                      )}
                      {data.attorneyTitle && (
                        <p
                          className="font-outfit text-[13px] uppercase tracking-widest mt-[5px]"
                          style={{ color: "rgba(255,255,255,0.75)" }}
                        >
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
