import { Phone, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useGlobalPhone, useSiteSettings } from "@site/contexts/SiteSettingsContext";

interface PageHeroProps {
  /** Small H1 text with decorative accent bar */
  h1Title: string;
  /** Large uppercase headline */
  headline: string;
  /** Portion of headline to underline with accent color */
  highlightedText?: string;
  /** Hero image displayed on the right column */
  heroImage?: string;
  heroImageAlt?: string;
}

export default function PageHero({
  h1Title,
  headline,
  highlightedText,
  heroImage,
  heroImageAlt,
}: PageHeroProps) {
  const { phoneNumber, phoneDisplay, phoneLabel } = useGlobalPhone();
  const { settings } = useSiteSettings();
  const trimmedHeroImage = heroImage?.trim() || "";

  return (
    <>
      {trimmedHeroImage && (
        <Helmet>
          <link rel="preload" as="image" href={trimmedHeroImage} />
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
                  {highlightedText && headline.includes(highlightedText)
                    ? (() => {
                        const idx = headline.indexOf(highlightedText);
                        const before = headline.slice(0, idx);
                        const match = highlightedText;
                        const after = headline.slice(idx + match.length);
                        return (
                          <>
                            {before}
                            <span className="underline decoration-brand-accent decoration-[3px] underline-offset-4">{match}</span>
                            {after}
                          </>
                        );
                      })()
                    : highlightedText
                      ? (
                        <>
                          <span className="underline decoration-brand-accent decoration-[3px] underline-offset-4">{highlightedText}</span>
                          <br />
                          {headline}
                        </>
                      )
                      : headline}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-8 items-stretch mb-[30px] md:mb-[40px]">
                {phoneNumber && (
                  <a href={`tel:${phoneNumber.replace(/\D/g, "")}`} className="block py-[8px] cursor-pointer">
                    <div className="flex items-center gap-4">
                      <span
                        className="flex items-center justify-center w-[60px] h-[60px] rounded-full flex-shrink-0"
                        style={{ backgroundColor: "#A1134C" }}
                      >
                        <Phone className="w-[30px] h-[30px] text-white" strokeWidth={1.5} />
                      </span>
                      <div className="flex-1">
                        <p className="font-outfit text-[16px] md:text-[18px] leading-tight text-white pb-[4px] font-normal">
                          {phoneLabel}
                        </p>
                        <p className="font-outfit text-[clamp(1.75rem,5vw,40px)] text-white leading-tight whitespace-nowrap">
                          {phoneDisplay}
                        </p>
                      </div>
                    </div>
                  </a>
                )}

                <Link
                  to={settings.headerCtaUrl?.trim() || "/contact"}
                  className="inline-flex items-center gap-2 font-outfit text-[16px] text-white uppercase tracking-wide px-[24px] py-[20px] sm:py-0 hover:opacity-90 transition-opacity self-stretch"
                  style={{ backgroundColor: "#A1134C" }}
                >
                  {settings.headerCtaText?.trim() || "Book a Consultation"}
                  <ArrowRight className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
                </Link>
              </div>

              {h1Title && (
                <h1 className="font-outfit text-[18px] md:text-[20px] font-medium tracking-wider capitalize text-white flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="h-[5px] w-[72px] flex-shrink-0 bg-brand-accent"
                  />
                  {h1Title}
                </h1>
              )}
            </div>

            <div className="lg:w-[31.3333%] self-end">
              {trimmedHeroImage && (
                <div className="relative ml-auto w-full max-w-[520px] aspect-[4/5]">
                  <img
                    src={trimmedHeroImage}
                    alt={heroImageAlt || ""}
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
    </>
  );
}
