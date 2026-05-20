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
    <section className="w-full" style={{ backgroundColor: "#EFF0EB" }}>
      <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] lg:w-[80%] pt-[120px] md:pt-[160px] pb-[120px] md:pb-[160px]">
        <div className="max-w-[1040px] mx-auto text-center">
          {content.heading?.trim() && (
            <div className="mb-[24px] md:mb-[36px]">
              <DynamicHeading
                tag={headingTag}
                defaultTag="h2"
                className="font-playfair text-[32px] md:text-[48px] lg:text-[54px] leading-tight md:leading-[54px] text-black"
              >
                {content.heading}
              </DynamicHeading>
            </div>
          )}

          {content.description?.trim() && (
            <RichText
              html={content.description}
              className="max-w-[940px] mx-auto text-black rich-text [&_p]:font-outfit [&_p]:text-[16px] md:[&_p]:text-[20px] [&_p]:leading-[24px] md:[&_p]:leading-[30px] [&_p]:text-black [&_p]:mb-[22px] md:[&_p]:mb-[28px] [&_p:last-child]:mb-0"
            />
          )}
        </div>
      </div>
    </section>
  );
}
