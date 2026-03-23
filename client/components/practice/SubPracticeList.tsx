import { Link } from "react-router-dom";
import * as LucideIcons from "lucide-react";
import type { SubPracticeItem } from "@site/lib/cms/practiceAreasPageTypes";

interface SubPracticeListProps {
  items: SubPracticeItem[];
}

function getIcon(name: string): LucideIcons.LucideIcon {
  const icon = (LucideIcons as Record<string, unknown>)[name];
  return (typeof icon === "function" ? icon : LucideIcons.FileText) as LucideIcons.LucideIcon;
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
                <span className="font-outfit text-[14px] md:text-[15px] font-semibold group-hover/sub:underline">
                  {sub.title}
                </span>
              </Link>
              {sub.description && (
                <p className="font-outfit text-[13px] md:text-[14px] leading-[20px] text-black/60 mt-1 pl-6">
                  {sub.description}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
