import { useState, useEffect } from "react";
import type { CmsForm } from "../lib/cms/formTypes";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Module-level caches
const formCache = new Map<string, CmsForm>();
let allFormsCache: CmsForm[] | null = null;

/**
 * Fetch a single form by ID or by Netlify form name.
 */
export function useCmsForm(idOrName: string | undefined) {
  const [form, setForm] = useState<CmsForm | null>(
    idOrName ? formCache.get(idOrName) ?? null : null,
  );
  const [isLoading, setIsLoading] = useState(!form && !!idOrName);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!idOrName) return;

    let mounted = true;

    async function fetchForm() {
      // Check cache first (by id or name)
      const cached = formCache.get(idOrName!);
      if (cached) {
        if (mounted) {
          setForm(cached);
          setIsLoading(false);
        }
        return;
      }

      try {
        // Try by UUID first, fall back to name
        const isUuid =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            idOrName!,
          );
        const filter = isUuid
          ? `id=eq.${idOrName}`
          : `name=eq.${idOrName}`;

        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/cms_forms?${filter}&limit=1`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
          },
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const rows = await res.json();
        if (!Array.isArray(rows) || rows.length === 0) {
          if (mounted) {
            setForm(null);
            setIsLoading(false);
          }
          return;
        }

        const f = rows[0] as CmsForm;
        // Cache by both id and name
        formCache.set(f.id, f);
        formCache.set(f.name, f);

        if (mounted) {
          setForm(f);
          setError(null);
        }
      } catch (err) {
        console.error("[useCmsForm] Error:", err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    fetchForm();
    return () => {
      mounted = false;
    };
  }, [idOrName]);

  return { form, isLoading, error };
}

/**
 * Fetch all forms (for admin list page).
 */
export function useCmsForms() {
  const [forms, setForms] = useState<CmsForm[]>(allFormsCache ?? []);
  const [isLoading, setIsLoading] = useState(!allFormsCache);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchForms() {
      if (allFormsCache) {
        if (mounted) {
          setForms(allFormsCache);
          setIsLoading(false);
        }
        return;
      }

      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/cms_forms?order=created_at.asc`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
          },
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const rows = (await res.json()) as CmsForm[];
        allFormsCache = rows;

        // Populate per-form cache too
        for (const f of rows) {
          formCache.set(f.id, f);
          formCache.set(f.name, f);
        }

        if (mounted) {
          setForms(rows);
          setError(null);
        }
      } catch (err) {
        console.error("[useCmsForms] Error:", err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    fetchForms();
    return () => {
      mounted = false;
    };
  }, []);

  return { forms, isLoading, error };
}

/** Clear all form caches (call after admin edits). */
export function clearFormCache() {
  formCache.clear();
  allFormsCache = null;
}
