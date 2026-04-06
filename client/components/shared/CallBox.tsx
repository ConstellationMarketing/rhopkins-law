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
  /** When true, the icon square uses crimson accent colour */
  accentIcon?: boolean;
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
  accentIcon = false,
}: CallBoxProps) {
  const isPhone = !!phone;

  // ── Phone variant: transparent bg, circular crimson badge ──────────────────
  if (isPhone) {
    const digits = toRawDigits(phone!);
    const content = (
      <div className={`p-[8px] w-full lg:w-[340px] cursor-pointer ${className}`}>
        <div className="flex items-center gap-4">
          <span
            className="flex items-center justify-center w-[60px] h-[60px] rounded-full flex-shrink-0"
            style={{ backgroundColor: "#A1134C" }}
          >
            <Icon className="w-[30px] h-[30px] text-white" strokeWidth={1.5} />
          </span>
          <div className="flex-1">
            <p className="font-outfit text-[16px] md:text-[18px] leading-tight text-white pb-[4px]">
              {title}
            </p>
            <p className="font-outfit text-[18px] md:text-[24px] text-white leading-none whitespace-nowrap">
              {subtitle}
            </p>
          </div>
        </div>
      </div>
    );
    return <a href={`tel:${digits}`} className="block">{content}</a>;
  }

  // ── Link/static variant: original square-icon box ──────────────────────────
  const isDark = variant === "dark";
  const outerBg = isDark ? className : `bg-brand-accent hover:bg-brand-accent-dark group ${className}`;

  const content = (
    <div className={`p-[8px] w-full lg:w-[340px] cursor-pointer transition-all duration-300 ${outerBg}`}>
      <div className="flex items-start gap-4">
        <div
          className={`flex items-center justify-center p-[15px] mt-1 flex-shrink-0 transition-colors duration-300 ${
            accentIcon
              ? "bg-white"
              : isDark ? "bg-white group-hover:bg-black" : "bg-white group-hover:bg-black"
          }`}
        >
          <Icon
            className={`w-8 h-8 transition-colors duration-300 ${
              accentIcon
                ? "text-brand-accent"
                : isDark
                  ? "text-black group-hover:text-white"
                  : "text-brand-accent group-hover:text-white"
            }`}
            strokeWidth={1.5}
          />
        </div>
        <div className="flex-1">
          <h4
            className={`font-outfit text-[16px] md:text-[18px] leading-tight pb-[10px] ${
              isDark ? "text-white" : "text-white"
            }`}
          >
            {title}
          </h4>
          <p
            className={`font-outfit text-[18px] md:text-[24px] leading-none whitespace-nowrap ${
              isDark ? "text-white" : "text-white"
            }`}
          >
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );

  if (link) {
    return <Link to={link} className="block">{content}</Link>;
  }

  return content;
}
