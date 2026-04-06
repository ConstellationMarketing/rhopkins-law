import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import RichText from "@site/components/shared/RichText";
import { type LucideIcon } from "lucide-react";

interface PracticeAreaCardProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  image: string;
  imageAlt?: string;
  link?: string;
}

export default function PracticeAreaCard({
  title,
  description,
  image,
  imageAlt,
  link = "/contact/",
}: PracticeAreaCardProps) {
  const ctaLabel = `Learn More About ${title}`;

  return (
    <div className="flex flex-col overflow-hidden">
      {/* Top Zone: Image with dark blue gradient overlay + heading */}
      <Link
        to={link}
        className="relative min-h-[250px] flex items-center justify-center overflow-hidden group"
      >
        <div
          role="img"
          aria-label={imageAlt || title}
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
          style={{ backgroundImage: `url(${image})` }}
        />
        {/* Dark blue gradient overlay */}
        <div className="absolute inset-0 bg-brand-dark/70" />
        {/* Heading centered */}
        <h3 className="relative font-playfair text-[28px] md:text-[34px] leading-tight text-white text-center px-6 font-bold">
          {title}
        </h3>
      </Link>

      {/* Bottom Zone: Gray content area with description + Learn More */}
      <div className="bg-[#EFF0EB] p-6 md:p-8 flex flex-col flex-1">
        {description && (
          <RichText
            html={description}
            className="font-outfit text-[14px] md:text-[16px] leading-[22px] md:leading-[26px] text-black/80 mb-4 flex-1"
          />
        )}
        <Link
          to={link}
          className="inline-flex items-center gap-2 text-brand-accent hover:text-brand-accent-dark transition-colors duration-300 mt-auto"
        >
          <span className="font-outfit text-[14px] md:text-[16px] font-semibold uppercase tracking-wide">
            {ctaLabel}
          </span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
