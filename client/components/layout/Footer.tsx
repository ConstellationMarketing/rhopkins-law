import React, { useState } from "react";

import {
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  Twitter,
  Phone,
  MapPinned,
  icons as lucideIconSet,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useSiteSettings } from "@site/contexts/SiteSettingsContext";

function getLucideIcon(name: string): React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>> | null {
  if (!name) return null;
  const pascal = name.includes("-")
    ? name.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("")
    : name.charAt(0).toUpperCase() + name.slice(1);
  const icon = lucideIconSet[pascal as keyof typeof lucideIconSet];
  return icon || null;
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
  const [isMapLoaded, setIsMapLoaded] = useState(false);

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
  const addressLines = [settings.addressLine1?.trim(), settings.addressLine2?.trim()].filter(Boolean);

  const Col2Icon = getLucideIcon(col2IconName);
  const Col3Icon = getLucideIcon(col3IconName);

  return (
    <footer className="bg-brand-dark relative mt-16">
      <div className="border-b border-[#838383] max-w-[2560px] mx-auto w-[95%] py-[20px] md:py-[27px] flex flex-col lg:flex-row gap-6 md:gap-8 lg:gap-[3%] text-center lg:text-left items-center lg:items-start">
        <div className="lg:w-[20%] lg:mr-[3%]">
          <Link to="/" className="block mb-6 inline-block">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={logoAlt}
                className="w-[140px] max-w-full"
                width={140}
                height={23}
                loading="lazy"
                decoding="async"
              />
            ) : (
              <span className="font-outfit text-white text-[24px] leading-none">
                {settings.siteName || " "}
              </span>
            )}
          </Link>

          {phoneNumber && (
            <a href={`tel:${phoneNumber.replace(/\D/g, "")}`} className="block cursor-pointer">
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <span
                  className="flex items-center justify-center w-[48px] h-[48px] rounded-full flex-shrink-0"
                  style={{ backgroundColor: "#A1134C" }}
                >
                  <Phone className="w-[24px] h-[24px] text-white" strokeWidth={1.5} />
                </span>
                <div className="flex-1">
                  {phoneLabel && (
                    <p className="font-outfit text-[14px] md:text-[16px] leading-tight text-white pb-[2px]">
                      {phoneLabel}
                    </p>
                  )}
                  <p className="font-outfit text-[20px] md:text-[26px] leading-tight text-white whitespace-nowrap">
                    {phoneDisplay}
                  </p>
                </div>
              </div>
            </a>
          )}
        </div>

        <div className="lg:w-[20%] lg:mr-[3%]">
          <div className="font-outfit text-[18px] md:text-[24px] font-light leading-tight md:leading-[36px] text-white">
            {col2Label && (
              <h3 className="font-playfair text-[28px] md:text-[36px] leading-tight md:leading-[36px] text-white pb-[10px] font-bold flex items-center gap-2 justify-center lg:justify-start">
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

        <div className="lg:w-[20%] lg:mr-[3%]">
          <div className="font-outfit text-[18px] md:text-[24px] font-light leading-tight md:leading-[36px] text-white">
            {col3Label && (
              <h3 className="font-playfair text-[28px] md:text-[36px] leading-tight md:leading-[36px] text-white pb-[10px] font-bold flex items-center gap-2 justify-center lg:justify-start">
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

        <div className="lg:w-[40%] max-w-[900px]">
          <div className="relative">
            {mapEmbedUrl ? (
              isMapLoaded ? (
                <iframe
                  src={mapEmbedUrl}
                  width="100%"
                  height="250"
                  allowFullScreen
                  loading="eager"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-[250px]"
                  title="Office Location"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setIsMapLoaded(true)}
                  className="w-full h-[250px] border border-[#616f6f] bg-brand-card/60 flex flex-col items-center justify-center gap-3 px-6 text-center"
                >
                  <span className="flex items-center justify-center w-[56px] h-[56px] rounded-full bg-brand-accent text-white">
                    <MapPinned className="w-7 h-7" strokeWidth={1.5} />
                  </span>
                  <span className="font-playfair text-[28px] leading-tight text-white">Load Map</span>
                  {addressLines.length > 0 && (
                    <span className="font-outfit text-[15px] md:text-[16px] text-white/75 leading-[24px] max-w-[420px]">
                      {addressLines.join(", ")}
                    </span>
                  )}
                </button>
              )
            ) : null}
          </div>
        </div>
      </div>

      <SocialLinksSection />

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
