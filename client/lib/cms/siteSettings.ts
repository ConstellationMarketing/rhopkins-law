import type { ReactNode } from "react";

export interface SiteSettings {
  siteName: string;
  logoUrl: string;
  logoAlt: string;
  phoneNumber: string;
  phoneDisplay: string;
  phoneAvailability: string;
  applyPhoneGlobally: boolean;
  headerCtaText: string;
  headerCtaUrl: string;
  headerServiceText: string;
  navigationItems: {
    label: string;
    href: string;
    order?: number;
    openInNewTab?: boolean;
    children?: { label: string; href: string; openInNewTab?: boolean }[];
  }[];
  footerAboutLinks: { label: string; href?: string }[];
  footerPracticeLinks: { label: string; href?: string }[];
  footerAboutLabel: string;
  footerAboutIcon: string;
  footerPracticeLabel: string;
  footerPracticeIcon: string;
  footerColumn3Html: string;
  footerTaglineHtml: string;
  addressLine1: string;
  addressLine2: string;
  mapEmbedUrl: string;
  socialLinks: {
    platform: "facebook" | "instagram" | "twitter" | "linkedin" | "youtube";
    url: string;
    enabled: boolean;
  }[];
  copyrightText: string;
  siteUrl: string;
  siteNoindex: boolean;
  ga4MeasurementId: string;
  googleAdsId: string;
  googleAdsConversionLabel: string;
  headScripts: string;
  footerScripts: string;
  globalSchema: string;
}

export interface SiteSettingsRow {
  site_name?: string | null;
  logo_url?: string | null;
  logo_alt?: string | null;
  phone_number?: string | null;
  phone_display?: string | null;
  phone_availability?: string | null;
  apply_phone_globally?: boolean | null;
  header_cta_text?: string | null;
  header_cta_url?: string | null;
  header_service_text?: string | null;
  navigation_items?: SiteSettings["navigationItems"] | null;
  footer_about_links?: SiteSettings["footerAboutLinks"] | null;
  footer_practice_links?: SiteSettings["footerPracticeLinks"] | null;
  footer_about_label?: string | null;
  footer_about_icon?: string | null;
  footer_practice_label?: string | null;
  footer_practice_icon?: string | null;
  footer_column3_html?: string | null;
  footer_tagline_html?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  map_embed_url?: string | null;
  social_links?: SiteSettings["socialLinks"] | null;
  copyright_text?: string | null;
  site_url?: string | null;
  site_noindex?: boolean | null;
  ga4_measurement_id?: string | null;
  google_ads_id?: string | null;
  google_ads_conversion_label?: string | null;
  head_scripts?: string | null;
  footer_scripts?: string | null;
  global_schema?: string | null;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "",
  logoUrl: "",
  logoAlt: "",
  phoneNumber: "",
  phoneDisplay: "",
  phoneAvailability: "",
  applyPhoneGlobally: true,
  headerCtaText: "",
  headerCtaUrl: "",
  headerServiceText: "",
  navigationItems: [],
  footerAboutLinks: [],
  footerPracticeLinks: [],
  footerAboutLabel: "",
  footerAboutIcon: "",
  footerPracticeLabel: "",
  footerPracticeIcon: "",
  footerColumn3Html: "",
  footerTaglineHtml: "",
  addressLine1: "",
  addressLine2: "",
  mapEmbedUrl: "",
  socialLinks: [],
  copyrightText: "",
  siteUrl: "",
  siteNoindex: false,
  ga4MeasurementId: "",
  googleAdsId: "",
  googleAdsConversionLabel: "",
  headScripts: "",
  footerScripts: "",
  globalSchema: "",
};

export function mergeSettings(partial?: Partial<SiteSettings> | null): SiteSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...partial,
    navigationItems: partial?.navigationItems?.length
      ? partial.navigationItems
      : DEFAULT_SETTINGS.navigationItems,
    footerAboutLinks: partial?.footerAboutLinks || DEFAULT_SETTINGS.footerAboutLinks,
    footerPracticeLinks:
      partial?.footerPracticeLinks || DEFAULT_SETTINGS.footerPracticeLinks,
    socialLinks: partial?.socialLinks || DEFAULT_SETTINGS.socialLinks,
  };
}

export function mapSiteSettingsRow(row?: SiteSettingsRow | null): SiteSettings {
  return mergeSettings({
    siteName: row?.site_name || DEFAULT_SETTINGS.siteName,
    logoUrl: row?.logo_url || DEFAULT_SETTINGS.logoUrl,
    logoAlt: row?.logo_alt || DEFAULT_SETTINGS.logoAlt,
    phoneNumber: row?.phone_number || DEFAULT_SETTINGS.phoneNumber,
    phoneDisplay: row?.phone_display || DEFAULT_SETTINGS.phoneDisplay,
    phoneAvailability: row?.phone_availability || DEFAULT_SETTINGS.phoneAvailability,
    applyPhoneGlobally:
      row?.apply_phone_globally ?? DEFAULT_SETTINGS.applyPhoneGlobally,
    headerCtaText: row?.header_cta_text || DEFAULT_SETTINGS.headerCtaText,
    headerCtaUrl: row?.header_cta_url || DEFAULT_SETTINGS.headerCtaUrl,
    headerServiceText:
      row?.header_service_text || DEFAULT_SETTINGS.headerServiceText,
    navigationItems: row?.navigation_items?.length
      ? row.navigation_items
      : DEFAULT_SETTINGS.navigationItems,
    footerAboutLinks: row?.footer_about_links || DEFAULT_SETTINGS.footerAboutLinks,
    footerPracticeLinks:
      row?.footer_practice_links || DEFAULT_SETTINGS.footerPracticeLinks,
    footerAboutLabel: row?.footer_about_label || "",
    footerAboutIcon: row?.footer_about_icon || "",
    footerPracticeLabel: row?.footer_practice_label || "",
    footerPracticeIcon: row?.footer_practice_icon || "",
    footerColumn3Html: row?.footer_column3_html || "",
    addressLine1: row?.address_line1 || DEFAULT_SETTINGS.addressLine1,
    addressLine2: row?.address_line2 || DEFAULT_SETTINGS.addressLine2,
    mapEmbedUrl: row?.map_embed_url || DEFAULT_SETTINGS.mapEmbedUrl,
    socialLinks: row?.social_links || DEFAULT_SETTINGS.socialLinks,
    footerTaglineHtml: row?.footer_tagline_html || DEFAULT_SETTINGS.footerTaglineHtml,
    copyrightText: row?.copyright_text || DEFAULT_SETTINGS.copyrightText,
    siteUrl: row?.site_url || "",
    siteNoindex: row?.site_noindex ?? DEFAULT_SETTINGS.siteNoindex,
    ga4MeasurementId: row?.ga4_measurement_id || "",
    googleAdsId: row?.google_ads_id || "",
    googleAdsConversionLabel: row?.google_ads_conversion_label || "",
    headScripts: row?.head_scripts || "",
    footerScripts: row?.footer_scripts || "",
    globalSchema: row?.global_schema || "",
  });
}
