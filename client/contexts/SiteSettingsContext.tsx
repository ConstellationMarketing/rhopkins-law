import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

// Site Settings types (matching submodule)
interface SiteSettings {
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
  socialLinks: { platform: string; url: string; enabled: boolean }[];
  copyrightText: string;
  siteUrl: string;
  siteNoindex: boolean;
  // Analytics & Scripts
  ga4MeasurementId: string;
  googleAdsId: string;
  googleAdsConversionLabel: string;
  headScripts: string;
  footerScripts: string;
  // SEO
  globalSchema: string;
}

// TEMPLATE: Update default fallback values for each new project
const DEFAULT_SETTINGS: SiteSettings = {
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

interface SiteSettingsContextValue {
  settings: SiteSettings;
  isLoading: boolean;
  // Convenience getters for phone
  phoneDisplay: string;
  phoneLabel: string;
}

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(
  null,
);

// Supabase configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Global cache
let settingsCache: SiteSettings | null = null;

interface SiteSettingsProviderProps {
  children: ReactNode;
}

export function SiteSettingsProvider({ children }: SiteSettingsProviderProps) {
  const [settings, setSettings] = useState<SiteSettings>(
    settingsCache || DEFAULT_SETTINGS,
  );
  const [isLoading, setIsLoading] = useState(!settingsCache);

  useEffect(() => {
    if (settingsCache) {
      setSettings(settingsCache);
      setIsLoading(false);
      return;
    }

    async function fetchSettings() {
      try {
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/site_settings_public?settings_key=eq.global&select=*`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
          const row = data[0];
          const loadedSettings: SiteSettings = {
            siteName: row.site_name || DEFAULT_SETTINGS.siteName,
            logoUrl: row.logo_url || DEFAULT_SETTINGS.logoUrl,
            logoAlt: row.logo_alt || DEFAULT_SETTINGS.logoAlt,
            phoneNumber: row.phone_number || DEFAULT_SETTINGS.phoneNumber,
            phoneDisplay: row.phone_display || DEFAULT_SETTINGS.phoneDisplay,
            phoneAvailability:
              row.phone_availability || DEFAULT_SETTINGS.phoneAvailability,
            applyPhoneGlobally:
              row.apply_phone_globally ?? DEFAULT_SETTINGS.applyPhoneGlobally,
            headerCtaText:
              row.header_cta_text || DEFAULT_SETTINGS.headerCtaText,
            headerCtaUrl: row.header_cta_url || DEFAULT_SETTINGS.headerCtaUrl,
            headerServiceText: row.header_service_text || DEFAULT_SETTINGS.headerServiceText,
            navigationItems: row.navigation_items?.length
              ? row.navigation_items
              : DEFAULT_SETTINGS.navigationItems,
            footerAboutLinks:
              row.footer_about_links || DEFAULT_SETTINGS.footerAboutLinks,
            footerPracticeLinks:
              row.footer_practice_links || DEFAULT_SETTINGS.footerPracticeLinks,
            footerAboutLabel: row.footer_about_label || "",
            footerAboutIcon: row.footer_about_icon || "",
            footerPracticeLabel: row.footer_practice_label || "",
            footerPracticeIcon: row.footer_practice_icon || "",
            footerColumn3Html: row.footer_column3_html || "",
            addressLine1: row.address_line1 || DEFAULT_SETTINGS.addressLine1,
            addressLine2: row.address_line2 || DEFAULT_SETTINGS.addressLine2,
            mapEmbedUrl: row.map_embed_url || DEFAULT_SETTINGS.mapEmbedUrl,
            socialLinks: row.social_links || DEFAULT_SETTINGS.socialLinks,
            footerTaglineHtml: row.footer_tagline_html || DEFAULT_SETTINGS.footerTaglineHtml,
            copyrightText: row.copyright_text || DEFAULT_SETTINGS.copyrightText,
            siteUrl: row.site_url || "",
            siteNoindex: row.site_noindex ?? DEFAULT_SETTINGS.siteNoindex,
            ga4MeasurementId: row.ga4_measurement_id || "",
            googleAdsId: row.google_ads_id || "",
            googleAdsConversionLabel: row.google_ads_conversion_label || "",
            headScripts: row.head_scripts || "",
            footerScripts: row.footer_scripts || "",
            globalSchema: row.global_schema || "",
          };

          settingsCache = loadedSettings;
          setSettings(loadedSettings);
        }
      } catch (err) {
        console.error("[SiteSettingsContext] Error loading settings:", err);
        // Keep defaults on error
      } finally {
        setIsLoading(false);
      }
    }

    fetchSettings();
  }, []);

  const value: SiteSettingsContextValue = {
    settings,
    isLoading,
    phoneDisplay: settings.phoneDisplay,
    phoneLabel: settings.phoneAvailability,
  };

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

// Hook to access site settings
export function useSiteSettings(): SiteSettingsContextValue {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    // Return defaults if used outside provider (for safety)
    return {
      settings: DEFAULT_SETTINGS,
      isLoading: false,
      phoneDisplay: DEFAULT_SETTINGS.phoneDisplay,
      phoneLabel: DEFAULT_SETTINGS.phoneAvailability,
    };
  }
  return context;
}

// Convenience hook specifically for phone
export function useGlobalPhone() {
  const { settings, isLoading } = useSiteSettings();
  return {
    phoneNumber: settings.phoneNumber,
    phoneDisplay: settings.phoneDisplay,
    phoneLabel: settings.phoneAvailability,
    isLoading,
  };
}
