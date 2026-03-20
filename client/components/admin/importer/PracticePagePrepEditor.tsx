import { useState, useCallback } from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TransformedPracticePage } from "@site/lib/importer/types";
import HtmlFieldEditor from "./HtmlFieldEditor";

interface PracticePagePrepEditorProps {
  record: TransformedPracticePage;
  onChange: (updated: TransformedPracticePage) => void;
}

interface ContentSection {
  body: string;
  image: string;
  imageAlt: string;
  imagePosition: "left" | "right";
  showCTAs?: boolean;
}

interface FaqItem {
  question: string;
  answer: string;
}

export default function PracticePagePrepEditor({
  record,
  onChange,
}: PracticePagePrepEditorProps) {
  const content = record.content as Record<string, unknown>;
  const hero = (content?.hero as Record<string, unknown>) ?? {};
  const contentSections = ((content?.contentSections as ContentSection[]) ?? []);
  const faq = (content?.faq as Record<string, unknown>) ?? {};
  const faqItems = ((faq?.items as FaqItem[]) ?? []);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    seo: true,
  });

  const toggleSection = useCallback((key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Helper to update top-level record fields
  const updateField = useCallback(
    (field: keyof TransformedPracticePage, value: unknown) => {
      onChange({ ...record, [field]: value });
    },
    [record, onChange],
  );

  // Helper to update nested content fields
  const updateContent = useCallback(
    (path: string, value: unknown) => {
      const newContent = structuredClone(content);
      const parts = path.split(".");
      let target: Record<string, unknown> = newContent;
      for (let i = 0; i < parts.length - 1; i++) {
        target = target[parts[i]] as Record<string, unknown>;
      }
      target[parts[parts.length - 1]] = value;
      onChange({ ...record, content: newContent });
    },
    [record, content, onChange],
  );

  // --- Content Sections helpers ---
  const updateSection = useCallback(
    (index: number, field: string, value: unknown) => {
      const updated = [...contentSections];
      updated[index] = { ...updated[index], [field]: value };
      updateContent("contentSections", updated);
    },
    [contentSections, updateContent],
  );

  const addSection = useCallback(() => {
    const updated = [
      ...contentSections,
      {
        body: "",
        image: "",
        imageAlt: "",
        imagePosition: contentSections.length % 2 === 0 ? "right" as const : "left" as const,
        showCTAs: true,
      },
    ];
    updateContent("contentSections", updated);
  }, [contentSections, updateContent]);

  const removeSection = useCallback(
    (index: number) => {
      const updated = contentSections.filter((_, i) => i !== index);
      updateContent("contentSections", updated);
    },
    [contentSections, updateContent],
  );

  // --- FAQ helpers ---
  const updateFaqItem = useCallback(
    (index: number, field: string, value: string) => {
      const updated = [...faqItems];
      updated[index] = { ...updated[index], [field]: value };
      updateContent("faq.items", updated);
    },
    [faqItems, updateContent],
  );

  const addFaqItem = useCallback(() => {
    const updated = [...faqItems, { question: "", answer: "" }];
    updateContent("faq.items", updated);
  }, [faqItems, updateContent]);

  const removeFaqItem = useCallback(
    (index: number) => {
      const updated = faqItems.filter((_, i) => i !== index);
      updateContent("faq.items", updated);
    },
    [faqItems, updateContent],
  );

  return (
    <div className="space-y-3">
      {/* Basic Info */}
      <CollapsibleSection
        title="Basic Info"
        isCollapsed={collapsed["basic"]}
        onToggle={() => toggleSection("basic")}
      >
        <div className="space-y-3">
          <FieldRow label="Title" required>
            <Input
              value={record.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="Page title"
            />
          </FieldRow>
          <FieldRow label="URL Path" required>
            <Input
              value={record.url_path}
              onChange={(e) => updateField("url_path", e.target.value)}
              placeholder="/practice-areas/my-page/"
              className="font-mono text-sm"
            />
          </FieldRow>
        </div>
      </CollapsibleSection>

      {/* Hero */}
      <CollapsibleSection
        title="Hero"
        isCollapsed={collapsed["hero"]}
        onToggle={() => toggleSection("hero")}
      >
        <div className="space-y-3">
          <FieldRow label="Section Label">
            <Input
              value={String(hero.sectionLabel ?? "")}
              onChange={(e) => updateContent("hero.sectionLabel", e.target.value)}
              placeholder="e.g. Personal Injury"
            />
          </FieldRow>
          <FieldRow label="Tagline">
            <Input
              value={String(hero.tagline ?? "")}
              onChange={(e) => updateContent("hero.tagline", e.target.value)}
              placeholder="Main hero headline"
            />
          </FieldRow>
          <HtmlFieldEditor
            label="Description"
            value={String(hero.description ?? "")}
            onChange={(val) => updateContent("hero.description", val)}
            rows={4}
          />
          <FieldRow label="Background Image">
            <div className="flex gap-2">
              <Input
                value={String(hero.backgroundImage ?? "")}
                onChange={(e) => updateContent("hero.backgroundImage", e.target.value)}
                placeholder="https://..."
                className="flex-1"
              />
              {hero.backgroundImage && String(hero.backgroundImage) && (
                <ImageThumbnail src={String(hero.backgroundImage)} />
              )}
            </div>
          </FieldRow>
          <FieldRow label="Image Alt Text">
            <Input
              value={String(hero.backgroundImageAlt ?? "")}
              onChange={(e) => updateContent("hero.backgroundImageAlt", e.target.value)}
              placeholder="Describe the image"
            />
          </FieldRow>
        </div>
      </CollapsibleSection>

      {/* Content Sections */}
      <CollapsibleSection
        title={`Content Sections (${contentSections.length})`}
        isCollapsed={collapsed["contentSections"]}
        onToggle={() => toggleSection("contentSections")}
      >
        <div className="space-y-3">
          {contentSections.map((section, idx) => (
            <Card key={idx} className="border-dashed">
              <CardHeader className="py-2 px-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs flex items-center gap-1.5">
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                    Section {idx + 1}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => removeSection(idx)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-3 space-y-3">
                <HtmlFieldEditor
                  label="Body"
                  value={section.body}
                  onChange={(val) => updateSection(idx, "body", val)}
                  rows={5}
                />
                <FieldRow label="Image">
                  <div className="flex gap-2">
                    <Input
                      value={section.image}
                      onChange={(e) => updateSection(idx, "image", e.target.value)}
                      placeholder="https://..."
                      className="flex-1"
                    />
                    {section.image && <ImageThumbnail src={section.image} />}
                  </div>
                </FieldRow>
                <FieldRow label="Image Alt">
                  <Input
                    value={section.imageAlt}
                    onChange={(e) => updateSection(idx, "imageAlt", e.target.value)}
                    placeholder="Describe the image"
                  />
                </FieldRow>
                <FieldRow label="Image Position">
                  <Select
                    value={section.imagePosition}
                    onValueChange={(val) => updateSection(idx, "imagePosition", val)}
                  >
                    <SelectTrigger className="w-32 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldRow>
              </CardContent>
            </Card>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={addSection}
            className="gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Section
          </Button>
        </div>
      </CollapsibleSection>

      {/* FAQ */}
      <CollapsibleSection
        title={`FAQ (${faqItems.length} items)`}
        isCollapsed={collapsed["faq"]}
        onToggle={() => toggleSection("faq")}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Label className="text-sm">Enabled</Label>
            <Switch
              checked={faq.enabled === true}
              onCheckedChange={(val) => updateContent("faq.enabled", val)}
            />
          </div>
          <FieldRow label="Heading">
            <Input
              value={String(faq.heading ?? "")}
              onChange={(e) => updateContent("faq.heading", e.target.value)}
              placeholder="Frequently Asked Questions"
            />
          </FieldRow>
          <HtmlFieldEditor
            label="Description"
            value={String(faq.description ?? "")}
            onChange={(val) => updateContent("faq.description", val)}
            rows={3}
          />
          {faqItems.map((item, idx) => (
            <Card key={idx} className="border-dashed">
              <CardHeader className="py-2 px-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs flex items-center gap-1.5">
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                    Q{idx + 1}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => removeFaqItem(idx)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-3 space-y-2">
                <FieldRow label="Question">
                  <Input
                    value={item.question}
                    onChange={(e) => updateFaqItem(idx, "question", e.target.value)}
                    placeholder="What is...?"
                  />
                </FieldRow>
                <HtmlFieldEditor
                  label="Answer"
                  value={item.answer}
                  onChange={(val) => updateFaqItem(idx, "answer", val)}
                  rows={3}
                />
              </CardContent>
            </Card>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={addFaqItem}
            className="gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Add FAQ Item
          </Button>
        </div>
      </CollapsibleSection>

      {/* SEO */}
      <CollapsibleSection
        title="SEO"
        isCollapsed={collapsed["seo"]}
        onToggle={() => toggleSection("seo")}
      >
        <div className="space-y-3">
          <FieldRow label="Meta Title">
            <Input
              value={record.meta_title ?? ""}
              onChange={(e) => updateField("meta_title", e.target.value)}
              placeholder="SEO title"
            />
          </FieldRow>
          <FieldRow label="Meta Description">
            <Textarea
              value={record.meta_description ?? ""}
              onChange={(e) => updateField("meta_description", e.target.value)}
              placeholder="SEO description"
              rows={2}
            />
          </FieldRow>
          <FieldRow label="Canonical URL">
            <Input
              value={record.canonical_url ?? ""}
              onChange={(e) => updateField("canonical_url", e.target.value || null)}
              placeholder="https://..."
            />
          </FieldRow>
          <FieldRow label="OG Title">
            <Input
              value={record.og_title ?? ""}
              onChange={(e) => updateField("og_title", e.target.value || null)}
              placeholder="Social sharing title"
            />
          </FieldRow>
          <FieldRow label="OG Description">
            <Textarea
              value={record.og_description ?? ""}
              onChange={(e) => updateField("og_description", e.target.value || null)}
              placeholder="Social sharing description"
              rows={2}
            />
          </FieldRow>
          <FieldRow label="OG Image">
            <div className="flex gap-2">
              <Input
                value={record.og_image ?? ""}
                onChange={(e) => updateField("og_image", e.target.value || null)}
                placeholder="https://..."
                className="flex-1"
              />
              {record.og_image && <ImageThumbnail src={record.og_image} />}
            </div>
          </FieldRow>
          <div className="flex items-center gap-3">
            <Label className="text-sm">Noindex</Label>
            <Switch
              checked={record.noindex === true}
              onCheckedChange={(val) => updateField("noindex", val)}
            />
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared Sub-Components
// ---------------------------------------------------------------------------

function CollapsibleSection({
  title,
  isCollapsed,
  onToggle,
  children,
}: {
  title: string;
  isCollapsed?: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-muted/50 transition-colors"
      >
        <span className="text-sm font-medium">{title}</span>
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {!isCollapsed && <CardContent className="pt-0 pb-4">{children}</CardContent>}
    </Card>
  );
}

function FieldRow({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-sm">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

function ImageThumbnail({ src }: { src: string }) {
  return (
    <div className="w-10 h-10 rounded border overflow-hidden shrink-0 bg-muted">
      <img
        src={src}
        alt=""
        className="w-full h-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    </div>
  );
}
