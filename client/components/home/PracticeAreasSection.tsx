import type { PracticeAreasIntroContent } from "@site/lib/cms/homePageTypes";
import RichText from "@site/components/shared/RichText";

interface PracticeAreasSectionProps {
  content?: PracticeAreasIntroContent & { description?: string };
}

export default function PracticeAreasSection({ content }: PracticeAreasSectionProps) {
  // Guard: if no meaningful content, don't render
  if (!content || (!content.heading && !content.sectionLabel)) {
    return null;
  }

  const data = content;

  return (
    <div className="py-[20px] md:py-[30px]" style={{ backgroundColor: "#EFF0EB" }}>
      <div className="max-w-[2560px] mx-auto w-[95%] md:w-[85%] lg:w-[80%] py-[10px] md:py-[13px] text-center">
        {data.sectionLabel && (
          <p className="font-outfit text-[18px] md:text-[24px] leading-tight md:leading-[36px] text-brand-accent mb-[10px]">
            {data.sectionLabel}
          </p>
        )}
        {data.heading && (
          <h2 className="font-playfair text-[32px] md:text-[48px] lg:text-[54px] leading-tight md:leading-[54px] text-black">
            {data.heading}
          </h2>
        )}
        {data.description && (
          <RichText
            html={data.description}
            className="font-outfit text-[16px] md:text-[18px] leading-[24px] md:leading-[28px] text-black/80 mt-[15px] max-w-[800px] mx-auto"
          />
        )}
      </div>
    </div>
  );
}
