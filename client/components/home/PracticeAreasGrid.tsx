import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { PracticeAreaItem } from "@site/lib/cms/homePageTypes";
import PracticeAreaCard from "@site/components/practice/PracticeAreaCard";

interface PracticeAreasGridProps {
  areas?: PracticeAreaItem[];
  buttonText?: string;
  buttonLink?: string;
}

export default function PracticeAreasGrid({
  areas,
  buttonText,
  buttonLink,
}: PracticeAreasGridProps) {
  if (!areas || areas.length === 0) {
    return null;
  }

  const ctaText = buttonText?.trim() || "";
  const ctaLink = buttonLink?.trim() || "";

  return (
    <div
      className="pb-[40px] md:pb-[60px]"
      style={{
        background: "linear-gradient(to bottom, #EFF0EB 10%, white 10%)",
      }}
    >
      <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] lg:w-[85%]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {areas.map((area, index) => (
            <PracticeAreaCard
              key={index}
              title={area.title}
              description={area.description}
              image={area.image}
              imageAlt={area.imageAlt}
              link={area.link}
            />
          ))}
        </div>

        {ctaText && ctaLink && (
          <div className="mt-[32px] md:mt-[40px] flex justify-center">
            <Link
              to={ctaLink}
              className="inline-flex items-center gap-2 font-outfit text-[16px] text-white uppercase tracking-wide px-[24px] py-[18px] hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#365D96" }}
            >
              {ctaText}
              <ArrowRight className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
