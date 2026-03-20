import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, ArrowRight, ChevronDown, Phone } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSiteSettings } from "@site/contexts/SiteSettingsContext";
import NavDropdown from "./NavDropdown";

export default function Header() {
  const { settings } = useSiteSettings();

  const logoUrl = settings.logoUrl?.trim() || "";
  const logoAlt =
    settings.logoAlt?.trim() || settings.siteName?.trim() || "Logo";

  const ctaText = settings.headerCtaText?.trim() || "";
  const ctaUrl = settings.headerCtaUrl?.trim() || "/contact";

  const headerServiceText = settings.headerServiceText?.trim() || "";
  const phoneDisplay = settings.phoneDisplay?.trim() || "";
  const phoneNumber = settings.phoneNumber?.trim() || "";

  const navItems = [...(settings.navigationItems ?? [])].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="px-[30px] py-[10px] flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center w-[300px]">
          <Link to="/" className="mr-[30px]">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={logoAlt}
                className="w-[306px] max-w-full"
                width={306}
                height={50}
              />
            ) : (
              <span className="font-outfit text-white text-[22px] leading-none">
                {settings.siteName || " "}
              </span>
            )}
          </Link>
        </div>

        {/* Desktop: right-side two-row layout */}
        <div className="hidden lg:flex flex-col items-end flex-1">
          {/* Top row: service area text + phone */}
          {(headerServiceText || phoneDisplay) && (
            <div className="flex items-center gap-2 mb-1">
              {headerServiceText && (
                <span className="font-outfit text-white text-[15px]">
                  {headerServiceText}
                </span>
              )}
              {phoneDisplay && (
                <>
                  <span className="flex items-center justify-center w-[22px] h-[22px] rounded-full bg-red-500 flex-shrink-0">
                    <Phone className="w-[12px] h-[12px] text-white" />
                  </span>
                  <a
                    href={`tel:${phoneNumber || phoneDisplay}`}
                    className="font-outfit font-semibold text-white text-[20px] leading-none hover:opacity-80 transition-opacity"
                  >
                    {phoneDisplay}
                  </a>
                </>
              )}
            </div>
          )}

          {/* Bottom row: nav links */}
          <nav>
            <ul className="flex flex-wrap justify-end items-center -mx-[11px]">
              {navItems.map((item) => {
                const hasChildren = item.children && item.children.length > 0;

                return (
                  <li key={item.href} className="px-[11px] flex items-center">
                    {hasChildren ? (
                      <NavDropdown item={item} />
                    ) : (
                      <Link
                        to={item.href}
                        target={item.openInNewTab ? "_blank" : undefined}
                        rel={
                          item.openInNewTab ? "noopener noreferrer" : undefined
                        }
                        className="font-outfit text-[18px] text-white py-[6px] whitespace-nowrap hover:opacity-80 transition-opacity duration-400"
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* CTA Button — far right, desktop */}
        <div className="hidden lg:block ml-[30px]">
          {ctaText ? (
            <Button
              asChild
              className="bg-brand-accent text-white font-outfit text-[16px] py-[22px] px-[20px] h-auto hover:bg-brand-accent/90 transition-all duration-300 flex items-center justify-center gap-2 uppercase tracking-wide"
            >
              <Link to={ctaUrl}>{ctaText}</Link>
            </Button>
          ) : null}
        </div>

        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon" className="text-white">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="bg-brand-card border-brand-border"
          >
            <nav className="flex flex-col gap-4 mt-8">
              {/* Mobile info bar */}
              {(headerServiceText || phoneDisplay) && (
                <div className="flex flex-col gap-1 pb-4 border-b border-white/10">
                  {headerServiceText && (
                    <span className="font-outfit text-white/70 text-[14px]">
                      {headerServiceText}
                    </span>
                  )}
                  {phoneDisplay && (
                    <a
                      href={`tel:${phoneNumber || phoneDisplay}`}
                      className="flex items-center gap-2 font-outfit font-semibold text-white text-[18px] hover:opacity-80 transition-opacity"
                    >
                      <span className="flex items-center justify-center w-[22px] h-[22px] rounded-full bg-red-500 flex-shrink-0">
                        <Phone className="w-[12px] h-[12px] text-white" />
                      </span>
                      {phoneDisplay}
                    </a>
                  )}
                </div>
              )}

              {navItems.map((item) => {
                const hasChildren = item.children && item.children.length > 0;
                return (
                  <MobileNavItem
                    key={item.href}
                    item={item}
                    hasChildren={hasChildren}
                  />
                );
              })}
              {ctaText ? (
                <Button
                  asChild
                  className="bg-brand-accent text-white font-outfit text-[18px] py-[25px] w-full hover:bg-brand-accent/90 transition-all duration-300 flex items-center justify-center gap-2 mt-4 uppercase"
                >
                  <Link to={ctaUrl}>{ctaText}</Link>
                </Button>
              ) : null}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

/* ── Mobile nav item with collapsible children ── */

interface MobileNavItemProps {
  item: {
    label: string;
    href: string;
    openInNewTab?: boolean;
    children?: { label: string; href: string; openInNewTab?: boolean }[];
  };
  hasChildren?: boolean;
}

function MobileNavItem({ item, hasChildren }: MobileNavItemProps) {
  const [expanded, setExpanded] = useState(false);

  if (!hasChildren) {
    return (
      <Link
        to={item.href}
        target={item.openInNewTab ? "_blank" : undefined}
        rel={item.openInNewTab ? "noopener noreferrer" : undefined}
        className="font-outfit text-[20px] text-white py-[10px] px-[5%] border-b border-black/5 hover:opacity-80 transition-opacity"
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div>
      <div className="flex items-center border-b border-black/5">
        <Link
          to={item.href}
          className="font-outfit text-[20px] text-white py-[10px] px-[5%] hover:opacity-80 transition-opacity flex-1"
        >
          {item.label}
        </Link>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-white/70 hover:text-white p-2 mr-2 transition-colors"
          aria-label={expanded ? "Collapse submenu" : "Expand submenu"}
        >
          <ChevronDown
            className={`w-5 h-5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      </div>
      <div className={`pl-[10%] py-1 ${expanded ? "block" : "hidden"}`}>
        {item.children!.map((child, idx) => (
          <Link
            key={idx}
            to={child.href}
            target={child.openInNewTab ? "_blank" : undefined}
            rel={child.openInNewTab ? "noopener noreferrer" : undefined}
            className="block font-outfit text-[17px] text-white/80 py-[8px] hover:text-white transition-colors"
          >
            {child.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
