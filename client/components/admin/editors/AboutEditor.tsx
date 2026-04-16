import type { AboutPageContent } from "@/lib/cms/aboutPageTypes";
import { Section, ArrayEditor, ImageField, RichTextField, HeadingField, Input, Label, Textarea } from "./EditorShared";

interface AboutEditorProps {
  content: AboutPageContent;
  onChange: (c: AboutPageContent) => void;
}

export default function AboutEditor({ content, onChange }: AboutEditorProps) {
  const update = <K extends keyof AboutPageContent>(key: K, value: AboutPageContent[K]) => {
    onChange({ ...content, [key]: value });
  };

  return (
    <div className="space-y-6">
      <HeroSection content={content} update={update} />
      <AboutSectionEditor content={content} update={update} />
      <AttorneySpotlightEditor content={content} update={update} />
      <TeamSection content={content} update={update} />
      <ValuesSection content={content} update={update} />
      <StatsSection content={content} update={update} />
      <WhyChooseUsSection content={content} update={update} />
      <CTASection content={content} update={update} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
type Updater = <K extends keyof AboutPageContent>(key: K, value: AboutPageContent[K]) => void;
type SectionProps = { content: AboutPageContent; update: Updater };

function useHeadingTag(content: AboutPageContent, update: Updater) {
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
          onChange={(v, details) =>
            set({
              heroImage: v,
              heroImageAlt: details?.altText || hero.heroImageAlt,
            })
          }
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
function AboutSectionEditor({ content, update }: SectionProps) {
  const about = content.about;
  const set = (patch: Partial<typeof about>) => update("about", { ...about, ...patch });
  const ht = useHeadingTag(content, update);

  return (
    <Section title="About Section" defaultOpen={false}>
      <div className="grid gap-4">
        <div>
          <Label>Section Label</Label>
          <Input value={about.sectionLabel} onChange={(e) => set({ sectionLabel: e.target.value })} />
        </div>
        <HeadingField
          label="Heading"
          value={about.heading}
          onChange={(v) => set({ heading: v })}
          tag={ht.get("about.heading")}
          onTagChange={(t) => ht.set("about.heading", t)}
        />
        <div>
          <Label>Sub-heading</Label>
          <Textarea
            value={about.subheading ?? ""}
            onChange={(e) => set({ subheading: e.target.value })}
            placeholder="Larger intro text displayed above the description"
          />
        </div>
        <RichTextField label="Description" value={about.description} onChange={(v) => set({ description: v })} />
        <p className="text-xs text-gray-500 italic">Phone number is managed in Site Settings &gt; Contact Info</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Contact Label</Label>
            <Input value={about.contactLabel} onChange={(e) => set({ contactLabel: e.target.value })} />
          </div>
          <div>
            <Label>Contact Text</Label>
            <Input value={about.contactText} onChange={(e) => set({ contactText: e.target.value })} />
          </div>
        </div>
        <ImageField
          label="Attorney Image"
          value={about.attorneyImage}
          onChange={(url, details) =>
            set({
              attorneyImage: url,
              attorneyImageAlt: details?.altText || about.attorneyImageAlt,
            })
          }
          folder="team"
        />
        <div>
          <Label>Attorney Image Alt</Label>
          <Input value={about.attorneyImageAlt} onChange={(e) => set({ attorneyImageAlt: e.target.value })} />
        </div>

        <h4 className="font-medium mt-2">Stats</h4>
        <ArrayEditor
          items={about.stats}
          onChange={(items) => set({ stats: items })}
          itemLabel="Stat"
          newItem={() => ({ value: "", label: "" })}
          renderItem={(item, _, upd) => (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Value</Label>
                <Input value={item.value} onChange={(e) => upd({ ...item, value: e.target.value })} />
              </div>
              <div>
                <Label>Label</Label>
                <Input value={item.label} onChange={(e) => upd({ ...item, label: e.target.value })} />
              </div>
            </div>
          )}
        />
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
function AttorneySpotlightEditor({ content, update }: SectionProps) {
  const s = content.attorneySpotlight;
  const set = (patch: Partial<typeof s>) => update("attorneySpotlight", { ...s, ...patch });

  return (
    <Section title="Attorney Spotlight" defaultOpen={false}>
      <div className="grid gap-4">
        <div>
          <Label>Section Label</Label>
          <Input value={s.sectionLabel} onChange={(e) => set({ sectionLabel: e.target.value })} placeholder="e.g. Meet The Attorney" />
        </div>
        <div>
          <Label>Heading</Label>
          <Input value={s.heading} onChange={(e) => set({ heading: e.target.value })} />
        </div>
        <RichTextField label="Description" value={s.description} onChange={(v) => set({ description: v })} />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Button Text</Label>
            <Input value={s.buttonText} onChange={(e) => set({ buttonText: e.target.value })} placeholder="Meet The Attorney" />
          </div>
          <div>
            <Label>Button Link</Label>
            <Input value={s.buttonLink} onChange={(e) => set({ buttonLink: e.target.value })} placeholder="/about/" />
          </div>
        </div>
        <ImageField
          label="Attorney Image"
          value={s.image}
          onChange={(url, details) =>
            set({ image: url, imageAlt: details?.altText || s.imageAlt })
          }
          folder="team"
        />
        <div>
          <Label>Image Alt Text</Label>
          <Input value={s.imageAlt} onChange={(e) => set({ imageAlt: e.target.value })} placeholder="Describe the image" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Attorney Name</Label>
            <Input value={s.attorneyName} onChange={(e) => set({ attorneyName: e.target.value })} placeholder="e.g. Robert R. Hopkins" />
          </div>
          <div>
            <Label>Attorney Title</Label>
            <Input value={s.attorneyTitle} onChange={(e) => set({ attorneyTitle: e.target.value })} placeholder="e.g. Divorce Attorney" />
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
function TeamSection({ content, update }: SectionProps) {
  const team = content.team;
  const set = (patch: Partial<typeof team>) => update("team", { ...team, ...patch });
  const ht = useHeadingTag(content, update);

  return (
    <Section title="Team Members" defaultOpen={false}>
      <div className="grid gap-4">
        <div>
          <Label>Section Label</Label>
          <Input value={team.sectionLabel} onChange={(e) => set({ sectionLabel: e.target.value })} />
        </div>
        <HeadingField
          label="Heading"
          value={team.heading}
          onChange={(v) => set({ heading: v })}
          tag={ht.get("team.heading")}
          onTagChange={(t) => ht.set("team.heading", t)}
        />
        <ArrayEditor
          items={team.members}
          onChange={(items) => set({ members: items })}
          itemLabel="Member"
          newItem={() => ({ name: "", title: "", bio: "", image: "", imageAlt: "", specialties: [] })}
          renderItem={(item, _, upd) => (
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Name</Label>
                  <Input value={item.name} onChange={(e) => upd({ ...item, name: e.target.value })} />
                </div>
                <div>
                  <Label>Title</Label>
                  <Input value={item.title} onChange={(e) => upd({ ...item, title: e.target.value })} />
                </div>
              </div>
              <RichTextField label="Bio" value={item.bio} onChange={(v) => upd({ ...item, bio: v })} />
              <ImageField
                label="Photo"
                value={item.image}
                onChange={(url, details) =>
                  upd({ ...item, image: url, imageAlt: details?.altText || item.imageAlt })
                }
                folder="team"
              />
              <div>
                <Label>Photo Alt Text</Label>
                <Input value={item.imageAlt} onChange={(e) => upd({ ...item, imageAlt: e.target.value })} placeholder="Describe the photo" />
              </div>
              <div>
                <Label>Specialties (comma-separated)</Label>
                <Input
                  value={item.specialties.join(", ")}
                  onChange={(e) => upd({ ...item, specialties: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                />
              </div>
            </div>
          )}
        />
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
function ValuesSection({ content, update }: SectionProps) {
  const values = content.values;
  const set = (patch: Partial<typeof values>) => update("values", { ...values, ...patch });
  const ht = useHeadingTag(content, update);

  return (
    <Section title="Our Values" defaultOpen={false}>
      <div className="grid gap-4">
        <div>
          <Label>Section Label</Label>
          <Input value={values.sectionLabel} onChange={(e) => set({ sectionLabel: e.target.value })} />
        </div>
        <HeadingField
          label="Heading"
          value={values.heading}
          onChange={(v) => set({ heading: v })}
          tag={ht.get("values.heading")}
          onTagChange={(t) => ht.set("values.heading", t)}
        />
        <div>
          <Label>Subtitle</Label>
          <Input value={values.subtitle} onChange={(e) => set({ subtitle: e.target.value })} />
        </div>
        <ArrayEditor
          items={values.items}
          onChange={(items) => set({ items })}
          itemLabel="Value"
          newItem={() => ({ icon: "Star", title: "", description: "" })}
          renderItem={(item, _, upd) => (
            <div className="grid gap-3">
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <Label>Icon</Label>
                  <Input value={item.icon} onChange={(e) => upd({ ...item, icon: e.target.value })} placeholder="Lucide icon name" />
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
function StatsSection({ content, update }: SectionProps) {
  return (
    <Section title="Stats" defaultOpen={false}>
      <ArrayEditor
        items={content.stats.stats}
        onChange={(items) => update("stats", { stats: items })}
        itemLabel="Stat"
        newItem={() => ({ value: "", label: "" })}
        renderItem={(item, _, upd) => (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Value</Label>
              <Input value={item.value} onChange={(e) => upd({ ...item, value: e.target.value })} />
            </div>
            <div>
              <Label>Label</Label>
              <Input value={item.label} onChange={(e) => upd({ ...item, label: e.target.value })} />
            </div>
          </div>
        )}
      />
    </Section>
  );
}

/* ------------------------------------------------------------------ */
function WhyChooseUsSection({ content, update }: SectionProps) {
  const wcu = content.whyChooseUs;
  const set = (patch: Partial<typeof wcu>) => update("whyChooseUs", { ...wcu, ...patch });
  const ht = useHeadingTag(content, update);

  return (
    <Section title="Why Choose Us" defaultOpen={false}>
      <div className="grid gap-4">
        <HeadingField
          label="Heading"
          value={wcu.heading}
          onChange={(v) => set({ heading: v })}
          tag={ht.get("whyChooseUs.heading")}
          onTagChange={(t) => ht.set("whyChooseUs.heading", t)}
        />
        <RichTextField label="Body" value={wcu.body} onChange={(v) => set({ body: v })} />
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
function CTASection({ content, update }: SectionProps) {
  const cta = content.cta;
  const set = (patch: Partial<typeof cta>) => update("cta", { ...cta, ...patch });
  const ht = useHeadingTag(content, update);

  return (
    <Section title="Call to Action" defaultOpen={false}>
      <div className="grid gap-4">
        <HeadingField
          label="Heading"
          value={cta.heading}
          onChange={(v) => set({ heading: v })}
          tag={ht.get("cta.heading")}
          onTagChange={(t) => ht.set("cta.heading", t)}
        />
        <RichTextField label="Description" value={cta.description} onChange={(v) => set({ description: v })} />
        <p className="text-xs text-gray-500 italic">Phone number is managed in Site Settings &gt; Contact Info</p>
        <hr />
        <h4 className="font-medium">Secondary Button</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Label</Label>
            <Input value={cta.secondaryButton.label} onChange={(e) => set({ secondaryButton: { ...cta.secondaryButton, label: e.target.value } })} />
          </div>
          <div>
            <Label>Sublabel</Label>
            <Input value={cta.secondaryButton.sublabel} onChange={(e) => set({ secondaryButton: { ...cta.secondaryButton, sublabel: e.target.value } })} />
          </div>
          <div>
            <Label>Link</Label>
            <Input value={cta.secondaryButton.link} onChange={(e) => set({ secondaryButton: { ...cta.secondaryButton, link: e.target.value } })} />
          </div>
        </div>
      </div>
    </Section>
  );
}
