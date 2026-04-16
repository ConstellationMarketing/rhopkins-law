import { useState, useEffect } from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, ArrowRight, ChevronDown, Phone } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useSiteSettings } from "@site/contexts/SiteSettingsContext";
import NavDropdown from "./NavDropdown";
import { normalizePhoneDigits } from "@site/lib/syncDniPhone";

export default function Header({ overlay = false }: { overlay?: boolean }) {
  const { settings } = useSiteSettings();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll(); // check position immediately on mount
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const logoUrl = settings.logoUrl?.trim() || "";
  const logoAlt =
    settings.logoAlt?.trim() || settings.siteName?.trim() || "Logo";

  const ctaText = settings.headerCtaText?.trim() || "";
  const ctaUrl = settings.headerCtaUrl?.trim() || "/contact";

  const headerServiceText = settings.headerServiceText?.trim() || "";
  const phoneDisplay = settings.phoneDisplay?.trim() || "";
  const phoneNumber = settings.phoneNumber?.trim() || "";
  const phoneHref = normalizePhoneDigits(phoneNumber || phoneDisplay) || phoneNumber || phoneDisplay;

  const navItems = [...(settings.navigationItems ?? [])].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );

  // overlay mode: absolute at top (overlays hero), switches to fixed once scrolled
  const positionClass = overlay
    ? scrolled ? "fixed top-0 left-0 right-0 z-50" : "absolute top-0 left-0 right-0 z-50"
    : "sticky top-0 z-50";

  return (
    <header className={`w-full ${positionClass}`}>
      <div
        className="px-[30px] py-[5px] flex items-center justify-between transition-colors duration-300"
        style={scrolled ? { backgroundColor: "#365d96" } : {}}
      >
        {/* Logo */}
        <div className="flex items-center w-[180px]">
          <Link to="/" className="mr-[30px]">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={logoAlt}
                className="w-[100px] lg:w-[154px] max-w-full"
                width={154}
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
                  <span className="flex items-center justify-center w-[30px] h-[30px] rounded-full flex-shrink-0" style={{backgroundColor:'#A1134C'}}>
                    <Phone className="w-[16px] h-[16px] text-white" />
                  </span>
                  <a
                    href={`tel:${phoneHref}`}
                    className="font-outfit font-semibold text-white text-[28px] leading-none hover:opacity-80 transition-opacity"
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
                        className="font-outfit text-[16px] text-white py-[4px] whitespace-nowrap hover:opacity-80 transition-opacity duration-400"
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
              className="text-white font-outfit text-[16px] py-[30px] px-[20px] h-auto transition-all duration-300 flex items-center justify-center gap-2 uppercase tracking-wide hover:opacity-90" style={{backgroundColor:'#A1134C'}}
            >
              <Link to={ctaUrl}>{ctaText}</Link>
            </Button>
          ) : null}
        </div>

        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger
            className="lg:hidden bg-transparent border-0 text-white cursor-pointer p-2 flex items-center justify-center"
            style={{ appearance: "none" }}
          >
            <Menu size={36} strokeWidth={2} color="white" />
          </SheetTrigger>
          <SheetContent
            side="right"
            className="bg-brand-card border-brand-border"
          >
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
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
                      href={`tel:${phoneHref}`}
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

interface MobileNavNode {
  label: string;
  href: string;
  openInNewTab?: boolean;
  children?: MobileNavNode[];
}

interface MobileNavItemProps {
  item: MobileNavNode;
  hasChildren?: boolean;
  depth?: number;
}

function MobileNavItem({ item, hasChildren, depth = 0 }: MobileNavItemProps) {
  const [expanded, setExpanded] = useState(false);
  const paddingLeft = depth === 0 ? "px-[5%]" : depth === 1 ? "pl-[10%] pr-[5%]" : "pl-[15%] pr-[5%]";
  const textClass = depth === 0 ? "text-[20px] text-white" : depth === 1 ? "text-[17px] text-white/80" : "text-[15px] text-white/70";

  if (!hasChildren) {
    return (
      <Link
        to={item.href}
        target={item.openInNewTab ? "_blank" : undefined}
        rel={item.openInNewTab ? "noopener noreferrer" : undefined}
        className={`block font-outfit py-[10px] ${paddingLeft} ${textClass} border-b border-black/5 hover:opacity-80 transition-opacity`}
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
          target={item.openInNewTab ? "_blank" : undefined}
          rel={item.openInNewTab ? "noopener noreferrer" : undefined}
          className={`font-outfit py-[10px] ${paddingLeft} ${textClass} hover:opacity-80 transition-opacity flex-1`}
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
      <div className={`${expanded ? "block" : "hidden"}`}>
        {item.children!.map((child, idx) => (
          <MobileNavItem
            key={`${child.href}-${idx}`}
            item={child}
            hasChildren={Boolean(child.children?.length)}
            depth={depth + 1}
          />
        ))}
      </div>
    </div>
  );
}
