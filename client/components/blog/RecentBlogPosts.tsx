import { useEffect, useState } from "react";
import BlogPostCard from "@site/components/blog/BlogPostCard";
import type { Post } from "@/lib/database.types";
import type { RecentPostsData } from "@site/hooks/useBlogContent";
import { getPublicEnv } from "@site/lib/runtimeEnv";

interface PostWithCategory extends Post {
  post_categories: { name: string; slug: string } | null;
}

interface RecentBlogPostsProps {
  data: RecentPostsData;
}

const SUPABASE_URL = getPublicEnv("VITE_SUPABASE_URL");
const SUPABASE_ANON_KEY = getPublicEnv("VITE_SUPABASE_ANON_KEY");

export default function RecentBlogPosts({ data }: RecentBlogPostsProps) {
  const [posts, setPosts] = useState<PostWithCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecentPosts() {
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/posts?status=eq.published&select=*,post_categories(name,slug)&order=published_at.desc&limit=${data.postCount}`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
          }
        );

        if (res.ok) {
          const data = await res.json();
          setPosts(data || []);
        }
      } catch (err) {
        console.error("Error fetching recent posts:", err);
      }
      setLoading(false);
    }

    fetchRecentPosts();
  }, []);

  return (
    <section className="bg-white py-[40px] md:py-[60px]">
      <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] lg:w-[85%]">
        {/* Section Header */}
        <div className="text-center mb-[30px] md:mb-[50px]">
          <p className="font-outfit text-[18px] md:text-[24px] leading-tight md:leading-[36px] text-[rgb(107,141,12)] mb-[10px]">
            {data.sectionLabel}
          </p>
          <h2 className="font-playfair text-[32px] md:text-[48px] lg:text-[54px] leading-tight md:leading-[54px] text-black">
            {data.heading}
          </h2>
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-dark" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-outfit text-[18px] text-black/60">
              No posts published yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {posts.map((post) => (
              <BlogPostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
