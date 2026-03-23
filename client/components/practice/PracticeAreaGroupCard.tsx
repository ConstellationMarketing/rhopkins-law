import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import RichText from "@site/components/shared/RichText";
import type { PracticeAreaGroupItem } from "@site/lib/cms/practiceAreasPageTypes";
import SubPracticeList from "./SubPracticeList";

interface PracticeAreaGroupCardProps {
  area: PracticeAreaGroupItem;
}

export default function PracticeAreaGroupCard({ area }: PracticeAreaGroupCardProps) {
  return (
    <div className="flex flex-col overflow-hidden">
      {/* Top Zone: Image with dark overlay + heading */}
      <Link
        to={area.link}
        className="relative min-h-[250px] flex items-center justify-center overflow-hidden group"
      >
        <div
          role="img"
          aria-label={area.imageAlt || area.title}
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
          style={{ backgroundImage: `url(${area.image})` }}
        />
        <div className="absolute inset-0 bg-brand-dark/70" />
        <h3 className="relative font-playfair text-[28px] md:text-[34px] leading-tight text-white text-center px-6 font-bold">
          {area.title}
        </h3>
      </Link>

      {/* Bottom Zone: Description + Sub-practices */}
      <div className="bg-[#EFF0EB] p-6 md:p-8 flex flex-col flex-1">
        {area.description && (
          <RichText
            html={area.description}
            className="font-outfit text-[16px] md:text-[18px] leading-[24px] md:leading-[28px] text-black/80 mb-4"
          />
        )}

        {area.subPractices?.length > 0 && (
          <SubPracticeList items={area.subPractices} />
        )}

        <Link
          to={area.link}
          className="inline-flex items-center gap-2 text-brand-accent hover:text-brand-accent-dark transition-colors duration-300 mt-auto pt-4"
        >
          <span className="font-outfit text-[14px] md:text-[16px] font-semibold uppercase tracking-wide">
            Learn More
          </span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
