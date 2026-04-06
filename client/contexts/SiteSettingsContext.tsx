import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

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
  phoneDisplay: string;
  phoneLabel: string;
}

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(
  null,
);

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const SITE_SETTINGS_STORAGE_KEY = "site-settings-cache-v1";

let settingsCache: SiteSettings | null = null;

function mergeSettings(partial?: Partial<SiteSettings> | null): SiteSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...partial,
    navigationItems: partial?.navigationItems?.length
      ? partial.navigationItems
      : DEFAULT_SETTINGS.navigationItems,
    footerAboutLinks: partial?.footerAboutLinks || DEFAULT_SETTINGS.footerAboutLinks,
    footerPracticeLinks: partial?.footerPracticeLinks || DEFAULT_SETTINGS.footerPracticeLinks,
    socialLinks: partial?.socialLinks || DEFAULT_SETTINGS.socialLinks,
  };
}

function readPersistedSettings(): SiteSettings | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(SITE_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<SiteSettings>;
    return mergeSettings(parsed);
  } catch {
    return null;
  }
}

function persistSettings(settings: SiteSettings) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(SITE_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage write failures
  }
}

if (!settingsCache) {
  settingsCache = readPersistedSettings();
}

interface SiteSettingsProviderProps {
  children: ReactNode;
}

export function SiteSettingsProvider({ children }: SiteSettingsProviderProps) {
  const [settings, setSettings] = useState<SiteSettings>(() => settingsCache || DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(() => !settingsCache);

  useEffect(() => {
    if (settingsCache) {
      setSettings(settingsCache);
      setIsLoading(false);
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
          const loadedSettings = mergeSettings({
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
            headerServiceText:
              row.header_service_text || DEFAULT_SETTINGS.headerServiceText,
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
            footerTaglineHtml:
              row.footer_tagline_html || DEFAULT_SETTINGS.footerTaglineHtml,
            copyrightText:
              row.copyright_text || DEFAULT_SETTINGS.copyrightText,
            siteUrl: row.site_url || "",
            siteNoindex: row.site_noindex ?? DEFAULT_SETTINGS.siteNoindex,
            ga4MeasurementId: row.ga4_measurement_id || "",
            googleAdsId: row.google_ads_id || "",
            googleAdsConversionLabel: row.google_ads_conversion_label || "",
            headScripts: row.head_scripts || "",
            footerScripts: row.footer_scripts || "",
            globalSchema: row.global_schema || "",
          });

          settingsCache = loadedSettings;
          persistSettings(loadedSettings);
          setSettings(loadedSettings);
        }
      } catch (err) {
        console.error("[SiteSettingsContext] Error loading settings:", err);
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

export function useSiteSettings(): SiteSettingsContextValue {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    return {
      settings: DEFAULT_SETTINGS,
      isLoading: false,
      phoneDisplay: DEFAULT_SETTINGS.phoneDisplay,
      phoneLabel: DEFAULT_SETTINGS.phoneAvailability,
    };
  }
  return context;
}

export function useGlobalPhone() {
  const { settings, isLoading } = useSiteSettings();
  return {
    phoneNumber: settings.phoneNumber,
    phoneDisplay: settings.phoneDisplay,
    phoneLabel: settings.phoneAvailability,
    isLoading,
  };
}
