import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";

interface NavDropdownItem {
  label: string;
  href: string;
  openInNewTab?: boolean;
  children?: NavDropdownItem[];
}

interface NavDropdownProps {
  item: NavDropdownItem;
}

interface NavDropdownLinkProps {
  item: NavDropdownItem;
  className: string;
  onClick?: () => void;
  tabIndex?: number;
}

interface NestedDropdownItemProps {
  item: NavDropdownItem;
  parentOpen: boolean;
  onNavigate: () => void;
  level?: number;
}

function NavDropdownLink({ item, className, onClick, tabIndex }: NavDropdownLinkProps) {
  return (
    <Link
      to={item.href}
      target={item.openInNewTab ? "_blank" : undefined}
      rel={item.openInNewTab ? "noopener noreferrer" : undefined}
      className={className}
      onClick={onClick}
      tabIndex={tabIndex}
    >
      {item.label}
    </Link>
  );
}

function NestedDropdownItem({
  item,
  parentOpen,
  onNavigate,
  level = 0,
}: NestedDropdownItemProps) {
  const [open, setOpen] = useState(false);
  const hasChildren = Boolean(item.children?.length);
  const indentClass = level === 0 ? "" : level === 1 ? "pl-4" : "pl-8";

  return (
    <div>
      <div className={`flex items-stretch ${indentClass}`}>
        <NavDropdownLink
          item={item}
          className="flex-1 px-5 py-2.5 font-outfit text-[16px] text-white/90 hover:bg-white/10 hover:text-white transition-colors whitespace-nowrap"
          tabIndex={parentOpen ? 0 : -1}
          onClick={onNavigate}
        />
        {hasChildren && (
          <button
            type="button"
            className="px-3 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            aria-label={open ? "Collapse submenu" : "Expand submenu"}
            tabIndex={parentOpen ? 0 : -1}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setOpen((current) => !current);
            }}
          >
            <ChevronRight
              className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
            />
          </button>
        )}
      </div>

      {hasChildren && open && (
        <div className="pb-1">
          {item.children!.map((child, index) => (
            <NestedDropdownItem
              key={`${child.href}-${index}`}
              item={child}
              parentOpen={parentOpen}
              onNavigate={onNavigate}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function NavDropdown({ item }: NavDropdownProps) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  };

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <NavDropdownLink
        item={item}
        className="font-outfit text-[16px] text-white py-[4px] whitespace-nowrap hover:opacity-80 transition-opacity duration-400"
      />
      <button
        type="button"
        className="ml-1 text-white hover:opacity-80 transition-opacity duration-400"
        aria-label={open ? "Collapse submenu" : "Expand submenu"}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((current) => !current);
        }}
      >
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`absolute top-full left-0 mt-2 min-w-[240px] bg-brand-card border border-brand-border rounded-md shadow-xl z-50 py-2 transition-all duration-200 ${
          open
            ? "visible opacity-100 pointer-events-auto"
            : "invisible opacity-0 pointer-events-none"
        }`}
      >
        {item.children!.map((child, index) => (
          <NestedDropdownItem
            key={`${child.href}-${index}`}
            item={child}
            parentOpen={open}
            onNavigate={() => setOpen(false)}
          />
        ))}
      </div>
    </div>
  );
}
