import { Link } from "react-router-dom";
import type { AreasWeServeContent } from "@site/lib/cms/homePageTypes";
import DynamicHeading from "@site/components/shared/DynamicHeading";

interface AreasWeServeSectionProps {
  content?: AreasWeServeContent;
  headingTag?: string;
}

function isExternalLink(link: string) {
  return /^(https?:)?\/\//i.test(link);
}

export default function AreasWeServeSection({
  content,
  headingTag,
}: AreasWeServeSectionProps) {
  if (
    !content ||
    (!content.heading?.trim() &&
      !content.subtitle?.trim() &&
      !content.counties?.length &&
      !content.closingText?.trim())
  ) {
    return null;
  }

  return (
    <section className="w-full bg-white">
      <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] pt-[50px] md:pt-[70px] pb-[50px] md:pb-[70px]">
        <div className="max-w-[1100px] mx-auto text-center">
          {content.heading?.trim() && (
            <DynamicHeading
              tag={headingTag}
              defaultTag="h2"
              className="font-playfair text-[32px] md:text-[48px] lg:text-[54px] leading-tight text-black"
            >
              {content.heading}
            </DynamicHeading>
          )}

          {content.subtitle?.trim() && (
            <p className="mt-[16px] font-outfit text-[16px] md:text-[20px] leading-[26px] md:leading-[32px] text-black/80 whitespace-pre-line">
              {content.subtitle}
            </p>
          )}
        </div>

        {content.counties?.length ? (
          <div className="mt-[32px] md:mt-[40px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[18px] md:gap-[22px]">
            {content.counties.map((county, index) => {
              const link = county.link?.trim() || "";

              return (
                <article
                  key={`${county.title}-${index}`}
                  className="h-full rounded-[2px] border border-brand-border bg-[#EFF0EB] px-[22px] py-[24px] md:px-[24px] md:py-[28px] flex flex-col"
                >
                  <span
                    aria-hidden="true"
                    className="mb-[18px] h-[4px] w-[56px] bg-brand-accent"
                  />

                  {county.title?.trim() && (
                    <h3 className="font-playfair text-[26px] md:text-[30px] leading-tight text-black">
                      {county.title}
                    </h3>
                  )}

                  {county.description?.trim() && (
                    <p className="mt-[14px] font-outfit text-[16px] md:text-[18px] leading-[26px] md:leading-[30px] text-black/80 whitespace-pre-line flex-1">
                      {county.description}
                    </p>
                  )}

                  {link ? (
                    isExternalLink(link) ? (
                      <a
                        href={link}
                        className="mt-[18px] inline-flex items-center font-outfit text-[15px] md:text-[16px] uppercase tracking-[0.16em] text-brand-accent hover:opacity-80 transition-opacity"
                      >
                        Learn More
                      </a>
                    ) : (
                      <Link
                        to={link}
                        className="mt-[18px] inline-flex items-center font-outfit text-[15px] md:text-[16px] uppercase tracking-[0.16em] text-brand-accent hover:opacity-80 transition-opacity"
                      >
                        Learn More
                      </Link>
                    )
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : null}

        {content.closingText?.trim() && (
          <div className="max-w-[980px] mx-auto text-center">
            <p className="mt-[28px] md:mt-[36px] font-outfit text-[16px] md:text-[19px] leading-[26px] md:leading-[32px] text-black/80 whitespace-pre-line">
              {content.closingText}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
