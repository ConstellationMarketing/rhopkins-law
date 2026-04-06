import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCmsForm } from "@site/hooks/useCmsForm";
import { Loader2 } from "lucide-react";
import type { CmsForm, FormFieldDef } from "@site/lib/cms/formTypes";

interface CmsFormRendererProps {
  /** Pass a pre-loaded form object directly */
  form?: CmsForm;
  /** Or pass an ID/name to fetch it */
  formId?: string;
  /** Optional extra className on the wrapper */
  className?: string;
}

const ATTRIBUTION_FIELD_NAMES = [
  "source",
  "medium",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
  "msclkid",
  "landing_page",
  "referrer",
] as const;

const ATTRIBUTION_STORAGE_PREFIX = "netlify_attribution_";

function getAttributionValues() {
  const values: Record<string, string> = {};

  if (typeof window === "undefined") {
    return values;
  }

  const params = new URLSearchParams(window.location.search);

  for (const fieldName of ATTRIBUTION_FIELD_NAMES) {
    if (fieldName === "landing_page" || fieldName === "referrer") {
      continue;
    }

    const currentValue = params.get(fieldName)?.trim() || "";
    const storedValue = sessionStorage.getItem(`${ATTRIBUTION_STORAGE_PREFIX}${fieldName}`) || "";
    const resolvedValue = currentValue || storedValue;

    if (currentValue) {
      sessionStorage.setItem(`${ATTRIBUTION_STORAGE_PREFIX}${fieldName}`, currentValue);
    }

    values[fieldName] = resolvedValue;
  }

  const currentLandingPage = `${window.location.pathname}${window.location.search}`;
  const storedLandingPage = sessionStorage.getItem(`${ATTRIBUTION_STORAGE_PREFIX}landing_page`) || "";
  const resolvedLandingPage = storedLandingPage || currentLandingPage;
  sessionStorage.setItem(`${ATTRIBUTION_STORAGE_PREFIX}landing_page`, resolvedLandingPage);
  values.landing_page = resolvedLandingPage;

  const currentReferrer = document.referrer.trim();
  const storedReferrer = sessionStorage.getItem(`${ATTRIBUTION_STORAGE_PREFIX}referrer`) || "";
  const resolvedReferrer = storedReferrer || currentReferrer;
  if (currentReferrer && !storedReferrer) {
    sessionStorage.setItem(`${ATTRIBUTION_STORAGE_PREFIX}referrer`, currentReferrer);
  }
  values.referrer = resolvedReferrer;

  return values;
}

export default function CmsFormRenderer({
  form: formProp,
  formId,
  className,
}: CmsFormRendererProps) {
  const { form: fetchedForm, isLoading } = useCmsForm(
    formProp ? undefined : formId,
  );
  const form = formProp ?? fetchedForm;

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!form) return null;

  return <FormInner form={form} className={className} />;
}

function FormInner({
  form,
  className,
}: {
  form: CmsForm;
  className?: string;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attributionValues, setAttributionValues] = useState<Record<string, string>>({});

  useEffect(() => {
    setAttributionValues(getAttributionValues());
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const body = new URLSearchParams();
      const latestAttributionValues = getAttributionValues();
      body.set("form-name", form.name);

      formData.forEach((value, key) => {
        if (key !== "form-name" && key !== "bot-field") {
          body.set(key, value as string);
        }
      });

      Object.entries(latestAttributionValues).forEach(([key, value]) => {
        if (value) {
          body.set(key, value);
        }
      });

      await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      toast.success(form.success_message);
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      console.error("[CmsFormRenderer] Submit error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      name={form.name}
      method="POST"
      data-netlify="true"
      data-netlify-honeypot="bot-field"
      onSubmit={handleSubmit}
      className={className ?? "space-y-[25px]"}
    >
      <input type="hidden" name="form-name" value={form.name} />
      {ATTRIBUTION_FIELD_NAMES.map((fieldName) => (
        <input
          key={fieldName}
          type="hidden"
          name={fieldName}
          value={attributionValues[fieldName] || ""}
          readOnly
        />
      ))}

      {form.fields.map((field) => (
        <FormField key={field.id} field={field} />
      ))}

      {/* Submit */}
      <div>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-brand-accent-dark text-white border-brand-accent font-outfit text-[22px] h-[50px] hover:bg-brand-accent hover:text-black transition-all duration-300 rounded-none"
        >
          {isSubmitting ? "SUBMITTING..." : form.submit_button_text}
        </Button>
      </div>

      {/* Netlify Honeypot */}
      <div className="absolute invisible" aria-hidden="true">
        <label>
          If you are a human, leave this empty.
          <Input
            type="text"
            name="bot-field"
            tabIndex={-1}
            autoComplete="off"
            className="invisible"
          />
        </label>
      </div>
    </form>
  );
}

const fieldInputClass =
  "w-full h-[50px] bg-[#f7f7f7] border-[0.8px] border-[#c4c4c4] text-[#6b6b6b] text-[16px] px-[12px] py-[12px] rounded-none focus-visible:ring-0 focus-visible:ring-offset-0";

function FormField({ field }: { field: FormFieldDef }) {
  switch (field.type) {
    case "text":
    case "email":
    case "phone":
      return (
        <div>
          <Input
            type={field.type === "phone" ? "tel" : field.type}
            name={field.name}
            placeholder={field.label}
            required={field.required}
            className={fieldInputClass}
          />
        </div>
      );

    case "textarea":
      return (
        <div>
          <Textarea
            name={field.name}
            placeholder={field.label}
            required={field.required}
            className="w-full h-[200px] bg-[#f7f7f7] border-[0.8px] border-[#c4c4c4] text-[#6b6b6b] text-[16px] px-[12px] py-[12px] rounded-none resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
      );

    case "select":
      return (
        <div>
          <select
            name={field.name}
            required={field.required}
            defaultValue=""
            className={fieldInputClass + " appearance-none"}
          >
            <option value="" disabled>
              {field.label}
            </option>
            {(field.options ?? []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      );

    case "checkbox":
      return (
        <fieldset>
          <legend className="font-outfit text-[16px] text-[#6b6b6b] mb-2">
            {field.label}
          </legend>
          <div className="space-y-2">
            {(field.options ?? []).map((opt) => (
              <label key={opt} className="flex items-center gap-2">
                <input type="checkbox" name={field.name} value={opt} />
                <span className="font-outfit text-[16px] text-[#6b6b6b]">{opt}</span>
              </label>
            ))}
          </div>
        </fieldset>
      );

    default:
      return null;
  }
}
