/**
 * Renders CMS rich-text content (HTML from Tiptap) as real HTML.
 * Supports {{form:uuid}} shortcodes that render CmsFormRenderer inline.
 *
 * Usage:
 *   <RichText html={faq.answer} className="text-white" />
 *
 * If the value is plain text (no tags) it still renders correctly.
 * Accepts the same props as a <div> so you can pass className, style, etc.
 */

import { useMemo, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import CmsFormRenderer from "@site/components/shared/CmsFormRenderer";
import { useSiteSettings } from "@site/contexts/SiteSettingsContext";
import { getPublicEnv } from "@site/lib/runtimeEnv";
import { normalizeHtmlAnchorHrefs } from "@site/lib/seo";

const FORM_SHORTCODE_RE = /\{\{form:([a-f0-9-]+)\}\}/gi;

interface RichTextProps extends HTMLAttributes<HTMLDivElement> {
  /** The HTML string from the CMS / Tiptap editor */
  html: string | undefined | null;
  /** Render as a <span> instead of a <div> (for inline contexts) */
  inline?: boolean;
}

export default function RichText({
  html,
  inline = false,
  ...rest
}: RichTextProps) {
  const { settings } = useSiteSettings();
  const siteUrl = settings.siteUrl || getPublicEnv("VITE_SITE_URL") || "";
  const normalizedHtml = useMemo(
    () => normalizeHtmlAnchorHrefs(html, siteUrl),
    [html, siteUrl],
  );

  if (!normalizedHtml) return null;

  const hasShortcodes = FORM_SHORTCODE_RE.test(normalizedHtml);
  FORM_SHORTCODE_RE.lastIndex = 0;

  if (!hasShortcodes) {
    const Tag = inline ? "span" : "div";
    return (
      <Tag
        {...rest}
        className={cn("rich-text", rest.className)}
        dangerouslySetInnerHTML={{ __html: normalizedHtml }}
      />
    );
  }

  return <RichTextWithForms html={normalizedHtml} inline={inline} {...rest} />;
}

/**
 * Splits the HTML around {{form:id}} shortcodes and renders
 * alternating HTML fragments + CmsFormRenderer components.
 */
function RichTextWithForms({
  html,
  inline = false,
  ...rest
}: {
  html: string;
  inline?: boolean;
} & HTMLAttributes<HTMLDivElement>) {
  const segments = useMemo(() => parseSegments(html), [html]);
  const Tag = inline ? "span" : "div";

  return (
    <Tag {...rest} className={cn("rich-text", rest.className)}>
      {segments.map((seg, i) =>
        seg.type === "html" ? (
          <span key={i} dangerouslySetInnerHTML={{ __html: seg.content }} />
        ) : (
          <CmsFormRenderer key={i} formId={seg.content} />
        ),
      )}
    </Tag>
  );
}

type Segment =
  | { type: "html"; content: string }
  | { type: "form"; content: string };

function parseSegments(html: string): Segment[] {
  const segments: Segment[] = [];
  const re = /\{\{form:([a-f0-9-]+)\}\}/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(html)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "html", content: html.slice(lastIndex, match.index) });
    }

    segments.push({ type: "form", content: match[1] });
    lastIndex = re.lastIndex;
  }

  if (lastIndex < html.length) {
    segments.push({ type: "html", content: html.slice(lastIndex) });
  }

  return segments;
}
