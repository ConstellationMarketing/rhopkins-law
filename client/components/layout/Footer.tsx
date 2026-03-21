import React from "react";

import * as LucideIcons from "lucide-react";
import {
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  Twitter,
  Phone,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useSiteSettings } from "@site/contexts/SiteSettingsContext";

/** Resolve a lucide icon by kebab-case name (e.g. "book-open" → BookOpen) */
function getLucideIcon(name: string): React.ComponentType<React.SVGProps<SVGSVGElement>> | null {
  if (!name) return null;
  // Convert kebab-case to PascalCase
  const pascal = name
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
  const icon = (LucideIcons as Record<string, unknown>)[pascal];
  return typeof icon === "function" ? (icon as React.ComponentType<React.SVGProps<SVGSVGElement>>) : null;
}


const SOCIAL_ICON_MAP: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  linkedin: Linkedin,
  twitter: Twitter,
};

const SOCIAL_LABEL_MAP: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "Youtube",
  linkedin: "LinkedIn",
  twitter: "X",
};

export default function Footer() {
  const { settings } = useSiteSettings();

const logoUrl = settings.logoUrl?.trim() || "";
const logoAlt = settings.logoAlt?.trim() || settings.siteName?.trim() || "Logo";

const phoneNumber = settings.phoneNumber?.trim() || "";
const phoneDisplay = settings.phoneDisplay?.trim() || "";
const phoneLabel = settings.phoneAvailability?.trim() || "";

const copyrightRaw = settings.copyrightText?.trim() || "";
const copyrightText = copyrightRaw.replace(/\{year\}/gi, String(new Date().getFullYear()));
const mapEmbedUrl = settings.mapEmbedUrl?.trim() || "";

const resourceLinks = settings.footerAboutLinks ?? [];
const col2Label = settings.footerAboutLabel?.trim() || "";
const col2IconName = settings.footerAboutIcon?.trim() || "";
const col3Label = settings.footerPracticeLabel?.trim() || "";
const col3IconName = settings.footerPracticeIcon?.trim() || "";
const col3Html = settings.footerColumn3Html?.trim() || "";

const Col2Icon = getLucideIcon(col2IconName);
const Col3Icon = getLucideIcon(col3IconName);


  return (
    <footer className="bg-brand-dark relative">
      {/* Footer Links Section */}
      <div className="border-b border-[#838383] max-w-[2560px] mx-auto w-[95%] py-[20px] md:py-[27px] flex flex-col lg:flex-row gap-6 md:gap-8 lg:gap-[3%]">
        {/* Logo + Phone Column */}
        <div className="lg:w-[20%] lg:mr-[3%]">
          <Link to="/" className="block mb-6">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={logoAlt}
                className="w-[140px] max-w-full"
                width={140}
                height={23}
              />
            ) : (
              <span className="font-outfit text-white text-[24px] leading-none">
                {settings.siteName || " "}
              </span>
            )}
          </Link>

          {/* Phone / Call Box */}
          {phoneNumber && (
            <a href={`tel:${phoneNumber.replace(/\D/g, "")}`} className="block cursor-pointer">
              <div className="flex items-center gap-3">
                <span
                  className="flex items-center justify-center w-[48px] h-[48px] rounded-full flex-shrink-0"
                  style={{ backgroundColor: "#A1134C" }}
                >
                  <Phone className="w-[24px] h-[24px] text-white" strokeWidth={1.5} />
                </span>
                <div className="flex-1">
                  {phoneLabel && (
                    <h4 className="font-outfit text-[14px] md:text-[16px] leading-tight text-white pb-[2px]">
                      {phoneLabel}
                    </h4>
                  )}
                  <p className="font-outfit text-[20px] md:text-[26px] leading-tight text-white whitespace-nowrap">
                    {phoneDisplay}
                  </p>
                </div>
              </div>
            </a>
          )}
        </div>

        {/* Column 2 — Links */}
        <div className="lg:w-[20%] lg:mr-[3%]">
          <div className="font-outfit text-[18px] md:text-[24px] font-light leading-tight md:leading-[36px] text-white">
            {col2Label && (
              <h3 className="font-outfit text-[28px] md:text-[36px] leading-tight md:leading-[36px] text-white pb-[10px] flex items-center gap-2">
                {Col2Icon && <Col2Icon className="w-[28px] h-[28px] md:w-[32px] md:h-[32px] flex-shrink-0" strokeWidth={1.5} />}
                {col2Label}
              </h3>
            )}
            {resourceLinks.length > 0 ? (
              <ul className="text-[18px] md:text-[24px] font-light leading-tight md:leading-[36px] space-y-1">
                {resourceLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href || "#"}
                      className="hover:text-brand-accent transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        {/* Column 3 — Rich Text */}
        <div className="lg:w-[20%] lg:mr-[3%]">
          <div className="font-outfit text-[18px] md:text-[24px] font-light leading-tight md:leading-[36px] text-white">
            {col3Label && (
              <h3 className="font-outfit text-[28px] md:text-[36px] leading-tight md:leading-[36px] text-white pb-[10px] flex items-center gap-2">
                {Col3Icon && <Col3Icon className="w-[28px] h-[28px] md:w-[32px] md:h-[32px] flex-shrink-0" strokeWidth={1.5} />}
                {col3Label}
              </h3>
            )}
            {col3Html ? (
              <div
                className="text-[18px] md:text-[24px] font-light leading-tight md:leading-[36px] prose prose-invert max-w-none [&_a]:text-brand-accent [&_a]:hover:underline"
                dangerouslySetInnerHTML={{ __html: col3Html }}
              />
            ) : null}
          </div>
        </div>

        {/* Map Column */}
        <div className="lg:w-[40%] max-w-[900px]">
          <div className="relative">
            {mapEmbedUrl ? (
              <iframe
                src={mapEmbedUrl}
                width="100%"
                height="250"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-[250px]"
                title="Office Location"
              />
            ) : null}
          </div>
        </div>
</div>
      {/* Social Media Section */}
      <SocialLinksSection />


      {/* Copyright Section */}
      <div className="border-t border-[#838383] max-w-[2560px] mx-auto w-full py-[10px] px-[30px]">
        <div className="w-full mx-auto my-auto">
          <div className="font-outfit text-[18px] font-light leading-[27px] text-white text-center">
            {copyrightText ? <p>{copyrightText}</p> : null}
          </div>
        </div>
      </div>
    </footer>
  );
}

/** Renders the social icon row; falls back to default set if CMS provides none */
function SocialLinksSection() {
  const { settings } = useSiteSettings();

  const socialLinks =
    settings.socialLinks?.filter((s) => s.enabled) ?? [];

  if (socialLinks.length === 0) return null;

  return (
    <div className="max-w-[1080px] mx-auto w-[80%] py-[20px]">
      <div className="w-full">
        <ul className="text-center leading-[26px]">
          {socialLinks.map((social, idx) => {
            const Icon = SOCIAL_ICON_MAP[social.platform];
            const label =
              SOCIAL_LABEL_MAP[social.platform] || social.platform;

            if (!Icon) return null;

            const isLast = idx === socialLinks.length - 1;

            return (
              <li key={social.platform} className="inline-block mb-[8px]">
                <a
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-block w-[52px] h-[52px] bg-[#142928] border border-[#616f6f] ${
                    isLast ? "" : "mr-[8px]"
                  } align-middle transition-all duration-300 hover:bg-brand-accent hover:border-brand-accent group flex items-center justify-center`}
                  title={`Follow on ${label}`}
                >
                  <Icon className="w-6 h-6 text-white group-hover:text-black transition-colors duration-300" />
                  <span className="sr-only">Follow on {label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
