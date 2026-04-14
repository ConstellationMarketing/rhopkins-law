import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Seo from "@site/components/Seo";
import Layout from "@site/components/layout/Layout";
import BlogPostHero from "@site/components/blog/BlogPostHero";
import BlogSidebar from "@site/components/blog/BlogSidebar";
import RecentPosts from "@site/components/blog/RecentPosts";
import { ArrowLeft } from "lucide-react";
import NotFound from "./NotFound";
import { getCmsPreloadedRouteData } from "@site/lib/cms/preloadedState";
import { buildBlogPostPath } from "@site/lib/cms/publicRoutes";
import {
  type BlogPostWithCategory,
  resolveBlogPostData,
} from "@site/lib/cms/sharedPageData";
import { getPublicEnv } from "@site/lib/runtimeEnv";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const postPath = buildBlogPostPath(slug);
  const preloaded = slug
    ? getCmsPreloadedRouteData(postPath)?.blogPost?.post || null
    : null;

  const [post, setPost] = useState<BlogPostWithCategory | null>(preloaded);
  const [loading, setLoading] = useState(!preloaded);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (post) return;
    if (!slug) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    fetchPost(buildBlogPostPath(slug));
  }, [slug, post]);

  const fetchPost = async (postPathname: string) => {
    const supabaseUrl = getPublicEnv("VITE_SUPABASE_URL");
    const supabaseKey = getPublicEnv("VITE_SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseKey) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    try {
      const slugValue = postPathname.replace(/^\/blog\//, "").replace(/\/$/, "");
      const res = await fetch(
        `${supabaseUrl}/rest/v1/posts?slug=eq.${encodeURIComponent(`${slugValue}/`)}&status=eq.published&select=*,post_categories(name,slug)&limit=1`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        },
      );

      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setPost(resolveBlogPostData(data[0]).post);
        } else {
          setNotFound(true);
        }
      } else {
        setNotFound(true);
      }
    } catch (err) {
      console.error("Error fetching post:", err);
      setNotFound(true);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2a4a7a]" />
        </div>
      </Layout>
    );
  }

  if (notFound || !post) {
    return <NotFound />;
  }

  const displayDate = post.published_at || post.created_at;

  return (
    <Layout>
      <Seo
        title={post.meta_title || post.title}
        description={post.meta_description || post.excerpt || undefined}
        canonical={post.canonical_url || undefined}
        noindex={post.noindex}
        ogTitle={post.og_title || undefined}
        ogDescription={post.og_description || undefined}
        ogImage={post.og_image || post.featured_image || undefined}
      />

      <BlogPostHero
        title={post.title}
        categoryName={post.post_categories?.name}
        publishedDate={displayDate}
        featuredImage={post.featured_image}
      />

      <section className="bg-white py-10 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/blog/"
            className="inline-flex items-center gap-2 text-sm text-[#2a4a7a] hover:text-[#a1134c] transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>

          <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">
            <article className="flex-1 min-w-0 lg:max-w-[70%]">
              {post.body ? (
                <div
                  className="prose prose-lg max-w-none
                    prose-headings:font-semibold prose-headings:text-gray-900
                    prose-a:text-[#2a4a7a] prose-a:underline hover:prose-a:text-[#a1134c]
                    prose-blockquote:border-l-4 prose-blockquote:border-[#a1134c] prose-blockquote:text-gray-600
                    prose-img:rounded-lg prose-img:shadow-md"
                  dangerouslySetInnerHTML={{ __html: post.body }}
                />
              ) : post.excerpt ? (
                <p className="text-xl text-gray-600 leading-relaxed border-l-4 border-[#a1134c] pl-4">
                  {post.excerpt}
                </p>
              ) : (
                <p className="text-gray-400 italic">This post has no content yet.</p>
              )}
            </article>

            <div className="w-full lg:w-[30%] lg:max-w-[340px] shrink-0">
              <div className="sticky top-8">
                <BlogSidebar />
              </div>
            </div>
          </div>
        </div>
      </section>

      <RecentPosts excludeId={post.id} />
    </Layout>
  );
}
