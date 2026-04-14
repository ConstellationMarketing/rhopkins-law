import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getCmsPreloadedState } from "../lib/cms/preloadedState";
import { getPublicEnv } from "../lib/runtimeEnv";
import {
  DEFAULT_SETTINGS,
  mapSiteSettingsRow,
  mergeSettings,
  type SiteSettings,
} from "../lib/cms/siteSettings";

interface SiteSettingsContextValue {
  settings: SiteSettings;
  isLoading: boolean;
  phoneDisplay: string;
  phoneLabel: string;
}

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(null);

const SUPABASE_URL = getPublicEnv("VITE_SUPABASE_URL");
const SUPABASE_ANON_KEY = getPublicEnv("VITE_SUPABASE_ANON_KEY");
const SITE_SETTINGS_STORAGE_KEY = "site-settings-cache-v1";

let settingsCache: SiteSettings | null = null;

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
    window.localStorage.setItem(
      SITE_SETTINGS_STORAGE_KEY,
      JSON.stringify(settings),
    );
  } catch {
    // Ignore storage write failures
  }
}

interface SiteSettingsProviderProps {
  children: ReactNode;
}

export function SiteSettingsProvider({ children }: SiteSettingsProviderProps) {
  const preloadedSettings = useMemo(() => {
    const state = getCmsPreloadedState();
    return state?.siteSettings ? mergeSettings(state.siteSettings) : null;
  }, []);

  const [settings, setSettings] = useState<SiteSettings>(() => {
    if (preloadedSettings) {
      settingsCache = preloadedSettings;
      return preloadedSettings;
    }

    if (!settingsCache) {
      settingsCache = readPersistedSettings();
    }

    return settingsCache || DEFAULT_SETTINGS;
  });
  const [isLoading, setIsLoading] = useState(() => !preloadedSettings && !settingsCache);

  useEffect(() => {
    if (preloadedSettings) {
      settingsCache = preloadedSettings;
      persistSettings(preloadedSettings);
      setSettings(preloadedSettings);
      setIsLoading(false);
      return;
    }

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
          const loadedSettings = mapSiteSettingsRow(data[0]);
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
  }, [preloadedSettings]);

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
