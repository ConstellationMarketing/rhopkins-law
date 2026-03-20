import { useEffect, useState } from "react";
import type { Post } from "@/lib/database.types";
import BlogPostCard from "./BlogPostCard";

interface PostWithCategory extends Post {
  post_categories: { name: string; slug: string } | null;
}

interface RecentPostsProps {
  /** Post ID to exclude (current post) */
  excludeId?: string;
}

export default function RecentPosts({ excludeId }: RecentPostsProps) {
  const [posts, setPosts] = useState<PostWithCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentPosts();
  }, [excludeId]);

  const fetchRecentPosts = async () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      setLoading(false);
      return;
    }

    try {
      // Fetch extra to allow excluding current post
      const res = await fetch(
        `${supabaseUrl}/rest/v1/posts?status=eq.published&select=*,post_categories(name,slug)&order=published_at.desc&limit=4`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        },
      );

      if (res.ok) {
        const data: PostWithCategory[] = await res.json();
        const filtered = excludeId
          ? data.filter((p) => p.id !== excludeId)
          : data;
        setPosts(filtered.slice(0, 3));
      }
    } catch (err) {
      console.error("Error fetching recent posts:", err);
    }
    setLoading(false);
  };

  if (!loading && posts.length === 0) return null;

  return (
    <section className="bg-gray-50 py-14 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2
          className="text-3xl md:text-4xl font-light text-gray-900 mb-10 text-center"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          Recent Articles
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-48 mb-4" />
                <div className="bg-gray-200 rounded h-4 w-3/4 mb-2" />
                <div className="bg-gray-200 rounded h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <BlogPostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
