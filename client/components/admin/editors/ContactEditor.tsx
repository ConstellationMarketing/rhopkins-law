import type { ContactPageContent } from "@/lib/cms/contactPageTypes";
import { Section, ArrayEditor, GlobalSectionInfo, ImageField, RichTextField, HeadingField, Input, Label, Textarea } from "./EditorShared";

interface ContactEditorProps {
  content: ContactPageContent;
  onChange: (c: ContactPageContent) => void;
}

export default function ContactEditor({ content, onChange }: ContactEditorProps) {
  const update = <K extends keyof ContactPageContent>(key: K, value: ContactPageContent[K]) => {
    onChange({ ...content, [key]: value });
  };

  return (
    <div className="space-y-6">
      <HeroSection content={content} update={update} />
      <ContactIntroSection content={content} update={update} />
      <FormSection content={content} update={update} />
      <OfficeHoursSection content={content} update={update} />
      <ProcessSection content={content} update={update} />
      <VisitOfficeSection content={content} update={update} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
type Updater = <K extends keyof ContactPageContent>(key: K, value: ContactPageContent[K]) => void;
type SectionProps = { content: ContactPageContent; update: Updater };

function useHeadingTag(content: ContactPageContent, update: Updater) {
  return {
    get: (key: string) => content.headingTags?.[key] ?? "h2",
    set: (key: string, tag: string) =>
      update("headingTags", { ...content.headingTags, [key]: tag }),
  };
}

/* ------------------------------------------------------------------ */
function HeroSection({ content, update }: SectionProps) {
  const hero = content.hero;
  const set = (patch: Partial<typeof hero>) => update("hero", { ...hero, ...patch });
  const ht = useHeadingTag(content, update);

  return (
    <Section title="Hero Section">
      <div className="grid gap-4">
        <HeadingField
          label="H1 Title"
          value={hero.sectionLabel}
          onChange={(v) => set({ sectionLabel: v })}
          tag={ht.get("hero.sectionLabel") === "h2" ? "h1" : ht.get("hero.sectionLabel")}
          onTagChange={(t) => ht.set("hero.sectionLabel", t)}
        />
        <div>
          <Label>Full Headline</Label>
          <Input value={hero.tagline} onChange={(e) => set({ tagline: e.target.value })} />
          <p className="text-xs text-gray-500 mt-1">The complete headline sentence displayed in the hero</p>
        </div>
        <div>
          <Label>Highlighted Text</Label>
          <Input value={hero.highlightedText || ""} onChange={(e) => set({ highlightedText: e.target.value })} />
          <p className="text-xs text-gray-500 mt-1">Enter the exact portion of the headline to display with accent underline</p>
        </div>
        <ImageField
          label="Hero Image"
          value={hero.heroImage || ""}
          onChange={(v) => set({ heroImage: v })}
          onAltAutoFill={(altText) => set({ heroImageAlt: altText })}
        />
        <div>
          <Label>Hero Image Alt Text</Label>
          <Input value={hero.heroImageAlt || ""} onChange={(e) => set({ heroImageAlt: e.target.value })} />
        </div>
        <p className="text-xs text-gray-500 italic">Phone number is managed in Site Settings &gt; Contact Info</p>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
function ContactIntroSection({ content, update }: SectionProps) {
  const intro = content.contactIntro;
  const set = (patch: Partial<typeof intro>) => update("contactIntro", { ...intro, ...patch });
  const ht = useHeadingTag(content, update);

  return (
    <Section title="Contact Intro Section" defaultOpen={false}>
      <div className="grid gap-4">
        <div>
          <Label>Section Label</Label>
          <Input value={intro.sectionLabel} onChange={(e) => set({ sectionLabel: e.target.value })} />
        </div>
        <HeadingField
          label="Heading"
          value={intro.heading}
          onChange={(v) => set({ heading: v })}
          tag={ht.get("contactIntro.heading")}
          onTagChange={(t) => ht.set("contactIntro.heading", t)}
        />
        <RichTextField
          label="Description"
          value={intro.description}
          onChange={(v) => set({ description: v })}
        />
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
function FormSection({ content, update }: SectionProps) {
  const form = content.form;
  const set = (patch: Partial<typeof form>) => update("form", { ...form, ...patch });
  const ht = useHeadingTag(content, update);

  return (
    <Section title="Contact Form" defaultOpen={false}>
      <div className="grid gap-4">
        <HeadingField
          label="Heading"
          value={form.heading}
          onChange={(v) => set({ heading: v })}
          tag={ht.get("form.heading")}
          onTagChange={(t) => ht.set("form.heading", t)}
        />
        <RichTextField label="Subtext" value={form.subtext} onChange={(v) => set({ subtext: v })} />
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
function OfficeHoursSection({ content, update }: SectionProps) {
  const oh = content.officeHours;
  const set = (patch: Partial<typeof oh>) => update("officeHours", { ...oh, ...patch });
  const ht = useHeadingTag(content, update);

  return (
    <Section title="Office Hours" defaultOpen={false}>
      <div className="grid gap-4">
        <HeadingField
          label="Heading"
          value={oh.heading}
          onChange={(v) => set({ heading: v })}
          tag={ht.get("officeHours.heading")}
          onTagChange={(t) => ht.set("officeHours.heading", t)}
        />
        <ArrayEditor
          items={oh.items}
          onChange={(items) => set({ items })}
          itemLabel="Schedule"
          newItem={() => ({ day: "", hours: "" })}
          renderItem={(item, _, upd) => (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Day</Label>
                <Input value={item.day} onChange={(e) => upd({ ...item, day: e.target.value })} />
              </div>
              <div>
                <Label>Hours</Label>
                <Input value={item.hours} onChange={(e) => upd({ ...item, hours: e.target.value })} />
              </div>
            </div>
          )}
        />
        <div>
          <Label>Note</Label>
          <Textarea value={oh.note} onChange={(e) => set({ note: e.target.value })} rows={2} />
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
function ProcessSection({ content, update }: SectionProps) {
  const p = content.process;
  const set = (patch: Partial<typeof p>) => update("process", { ...p, ...patch });
  const ht = useHeadingTag(content, update);

  return (
    <Section title="Process Steps" defaultOpen={false}>
      <div className="grid gap-4">
        <div>
          <Label>Section Label</Label>
          <Input value={p.sectionLabel} onChange={(e) => set({ sectionLabel: e.target.value })} />
        </div>
        <HeadingField
          label="Heading"
          value={p.heading}
          onChange={(v) => set({ heading: v })}
          tag={ht.get("process.heading")}
          onTagChange={(t) => ht.set("process.heading", t)}
        />
        <div>
          <Label>Subtitle</Label>
          <Input value={p.subtitle} onChange={(e) => set({ subtitle: e.target.value })} />
        </div>
        <ArrayEditor
          items={p.steps}
          onChange={(items) => set({ steps: items })}
          itemLabel="Step"
          newItem={() => ({ number: String(p.steps.length + 1), title: "", description: "" })}
          renderItem={(item, _, upd) => (
            <div className="grid gap-3">
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <Label>Number</Label>
                  <Input value={item.number} onChange={(e) => upd({ ...item, number: e.target.value })} />
                </div>
                <div className="col-span-3">
                  <Label>Title</Label>
                  <Input value={item.title} onChange={(e) => upd({ ...item, title: e.target.value })} />
                </div>
              </div>
              <RichTextField label="Description" value={item.description} onChange={(v) => upd({ ...item, description: v })} />
            </div>
          )}
        />
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
function VisitOfficeSection({ content, update }: SectionProps) {
  const vo = content.visitOffice;
  const set = (patch: Partial<typeof vo>) => update("visitOffice", { ...vo, ...patch });
  const ht = useHeadingTag(content, update);

  return (
    <Section title="Visit Our Office" defaultOpen={false}>
      <div className="grid gap-4">
        <HeadingField
          label="Heading"
          value={vo.heading}
          onChange={(v) => set({ heading: v })}
          tag={ht.get("visitOffice.heading")}
          onTagChange={(t) => ht.set("visitOffice.heading", t)}
        />
        <RichTextField label="Subtext" value={vo.subtext} onChange={(v) => set({ subtext: v })} />
        <div>
          <Label>Google Maps Embed URL</Label>
          <Input value={vo.mapEmbedUrl} onChange={(e) => set({ mapEmbedUrl: e.target.value })} placeholder="https://www.google.com/maps/embed?..." />
        </div>
      </div>
    </Section>
  );
}
