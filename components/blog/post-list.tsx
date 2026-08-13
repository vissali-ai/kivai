"use client";

import { useState } from "react";
import { FeaturedPostCard } from "@/components/blog/featured-post-card";
import { Button } from "@/components/ui/button";
import type { Post } from "@/lib/blog/types";

const PAGE_SIZE = 12;

export function PostList({ posts }: { posts: Post[] }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visiblePosts = posts.slice(0, visibleCount);
  const hasMore = visibleCount < posts.length;

  return (
    <>
      <div className="mt-6 grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {visiblePosts.map((post) => <FeaturedPostCard key={post.id} post={post} />)}
      </div>
      {hasMore ? (
        <div className="mt-8 flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => setVisibleCount((current) => Math.min(current + PAGE_SIZE, posts.length))}
          >
            Mais notícias
          </Button>
        </div>
      ) : null}
    </>
  );
}
