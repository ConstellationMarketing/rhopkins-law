import { Link } from "react-router-dom";
import * as LucideIcons from "lucide-react";
import type { SubPracticeItem } from "@site/lib/cms/practiceAreasPageTypes";
import RichText from "@site/components/shared/RichText";

interface SubPracticeListProps {
  items: SubPracticeItem[];
}

function getIcon(name: string): LucideIcons.LucideIcon {
  const icon = (LucideIcons as Record<string, unknown>)[name];
  // Lucide icons are forwardRef objects, not plain functions
  if (icon && typeof icon === "object" && "render" in icon) {
    return icon as unknown as LucideIcons.LucideIcon;
  }
  if (icon && typeof icon === "function") {
    return icon as unknown as LucideIcons.LucideIcon;
  }
  return LucideIcons.FileText;
}

export default function SubPracticeList({ items }: SubPracticeListProps) {
  if (!items.length) return null;

  return (
    <div className="mt-2 mb-2">
      {/* Divider + label */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-black/15" />
        <span className="font-outfit text-[11px] md:text-[12px] uppercase tracking-[0.15em] text-black/50 whitespace-nowrap">
          Sub-Practices
        </span>
        <div className="h-px flex-1 bg-black/15" />
      </div>

      <ul className="space-y-4">
        {items.map((sub, i) => {
          const Icon = getIcon(sub.icon);
          return (
            <li key={i}>
              <Link
                to={sub.link}
                className="group/sub inline-flex items-center gap-2 text-brand-dark hover:text-brand-accent transition-colors duration-200"
              >
                <Icon className="w-4 h-4 shrink-0 text-brand-accent" />
                <span className="font-outfit text-[16px] md:text-[17px] font-semibold group-hover/sub:underline">
                  {sub.title}
                </span>
              </Link>
              {sub.description && (
                <RichText
                  html={sub.description}
                  className="font-outfit text-[15px] md:text-[16px] leading-[22px] md:leading-[24px] text-black/60 mt-1 pl-6"
                />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
