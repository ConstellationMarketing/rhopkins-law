import type { WhyChooseUsContent } from "@site/lib/cms/homePageTypes";
import DynamicHeading from "@site/components/shared/DynamicHeading";
import RichText from "@site/components/shared/RichText";

interface WhyChooseUsSectionProps {
  content?: WhyChooseUsContent;
  headingTag?: string;
}

export default function WhyChooseUsSection({
  content,
  headingTag,
}: WhyChooseUsSectionProps) {
  if (!content || (!content.heading?.trim() && !content.description?.trim())) {
    return null;
  }

  return (
    <section className="w-full bg-white">
      <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] lg:w-[80%] pt-[46px] md:pt-[64px] pb-[46px] md:pb-[64px]">
        <div className="max-w-[980px] mx-auto text-center">
          {content.heading?.trim() && (
            <DynamicHeading
              tag={headingTag}
              defaultTag="h2"
              className="font-playfair text-[34px] md:text-[48px] lg:text-[56px] leading-tight text-black"
            >
              {content.heading}
            </DynamicHeading>
          )}

          {content.description?.trim() && (
            <RichText
              html={content.description}
              className="mt-[18px] md:mt-[22px] font-outfit text-[18px] md:text-[22px] leading-[30px] md:leading-[38px] text-black/80 rich-text [&_p]:mb-[20px] [&_p:last-child]:mb-0"
            />
          )}
        </div>
      </div>
    </section>
  );
}
