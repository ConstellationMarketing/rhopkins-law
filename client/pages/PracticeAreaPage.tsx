import { useParams } from "react-router-dom";
import Layout from "@site/components/layout/Layout";
import Seo from "@site/components/Seo";
import { usePracticeAreaPageContent } from "@site/hooks/usePracticeAreaPageContent";
import PracticeAreaHero from "@site/components/practice/PracticeAreaHero";
import PracticeAreaSocialProof from "@site/components/practice/PracticeAreaSocialProof";
import PracticeAreaContentSection from "@site/components/practice/PracticeAreaContentSection";
import PracticeAreaFaq from "@site/components/practice/PracticeAreaFaq";
import { Loader2 } from "lucide-react";

export default function PracticeAreaPage() {
  const { slug } = useParams<{ slug: string }>();
  const { content, meta, title, isLoading, notFound } =
    usePracticeAreaPageContent(slug);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-brand-accent" />
        </div>
      </Layout>
    );
  }

  if (notFound) {
    return (
      <Layout>
        <div className="bg-brand-dark py-[60px] md:py-[100px]">
          <div className="max-w-[800px] mx-auto text-center px-4">
            <h1 className="font-playfair text-[36px] md:text-[48px] text-white mb-4">
              Page Not Found
            </h1>
            <p className="font-outfit text-[18px] text-white/80">
              The practice area page you're looking for doesn't exist or hasn't
              been published yet.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Seo
        title={meta.meta_title || title || undefined}
        description={meta.meta_description || undefined}
        canonical={meta.canonical_url || undefined}
        noindex={meta.noindex}
        ogTitle={meta.og_title || undefined}
        ogDescription={meta.og_description || undefined}
        ogImage={meta.og_image || undefined}
        schemaType={meta.schema_type}
        schemaData={meta.schema_data}
        pageContent={content}
      />

      {/* Wrapper: background image spans hero + awards, extends behind header */}
      {/* Header height = 30px spacer + ~82px bar + 30px pb ≈ 142px; using 160px for safe full coverage */}
      <div className="relative -mt-[180px] bg-brand-dark">
        {content.hero.backgroundImage && (
          <>
            <img
              src={content.hero.backgroundImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{ backgroundColor: "rgba(6, 29, 27, 0.85)" }}
            />
          </>
        )}

        {/* Spacer to compensate for the -mt-[180px] so hero content sits below header */}
        <div className="h-[180px]" />

        <PracticeAreaHero
          content={content.hero}
          headingTags={content.headingTags}
        />

        <PracticeAreaSocialProof
          content={content.socialProof}
          headingTags={content.headingTags}
        />
      </div>

      {content.contentSections.map((section, index) => (
        <PracticeAreaContentSection
          key={index}
          section={section}
          index={index}
        />
      ))}

      <PracticeAreaFaq
        content={content.faq}
        headingTags={content.headingTags}
      />
    </Layout>
  );
}
