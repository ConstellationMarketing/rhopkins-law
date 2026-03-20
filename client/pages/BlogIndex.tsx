import Seo from "@site/components/Seo";
import Layout from "@site/components/layout/Layout";
import BlogHero from "@site/components/blog/BlogHero";
import RecentBlogPosts from "@site/components/blog/RecentBlogPosts";
import { useBlogContent } from "@site/hooks/useBlogContent";
import { Loader2 } from "lucide-react";

export default function BlogIndex() {
  const { hero, recentPosts, meta, isLoading } = useBlogContent();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-brand-accent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Seo
        title={meta.meta_title || "Blog"}
        description={meta.meta_description || undefined}
        canonical={meta.canonical_url || undefined}
        noindex={meta.noindex}
        ogTitle={meta.og_title || undefined}
        ogDescription={meta.og_description || undefined}
        ogImage={meta.og_image || undefined}
        schemaType={meta.schema_type}
        schemaData={meta.schema_data}
      />

      {/* Hero - CMS-driven, matches About page style */}
      <BlogHero hero={hero} />

      {/* Recent Blog Posts - 6 latest */}
      <RecentBlogPosts data={recentPosts} />
    </Layout>
  );
}
