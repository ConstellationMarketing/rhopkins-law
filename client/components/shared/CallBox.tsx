import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface CallBoxProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  /** Internal route link (uses React Router) */
  link?: string;
  /** Raw phone digits — when provided, the entire box becomes a tel: link */
  phone?: string;
  className?: string;
  variant?: "light" | "dark"; // light = black text on light bg, dark = white text on dark bg
}

/** Strip all non-digit characters for use in tel: href */
function toRawDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export default function CallBox({
  icon: Icon,
  title,
  subtitle,
  link,
  phone,
  className = "",
  variant = "light",
}: CallBoxProps) {
  const content = (
    <div
      className={`p-[8px] w-full lg:w-[340px] cursor-pointer ${className}`}
    >
      <div className="flex items-start gap-4">
        <span
          className="flex items-center justify-center w-[44px] h-[44px] rounded-full flex-shrink-0 mt-1"
          style={{ backgroundColor: "#A1134C" }}
        >
          <Icon className="w-[22px] h-[22px] text-white" strokeWidth={1.5} />
        </span>
        <div className="flex-1">
          <h4 className="font-outfit text-[16px] md:text-[18px] leading-tight text-white pb-[10px]">
            {title}
          </h4>
          <p className="font-outfit text-[18px] md:text-[24px] text-white leading-none whitespace-nowrap">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );

  // Phone link takes priority over route link
  if (phone) {
    const digits = toRawDigits(phone);
    return <a href={`tel:${digits}`} className="block">{content}</a>;
  }

  if (link) {
    return <Link to={link} className="block">{content}</Link>;
  }

  return content;
}
