"use client";

import { useState } from "react";
import { FeaturedPostCard } from "@/components/blog/featured-post-card";
import { PaginationControls } from "@/components/admin/pagination-controls";
import type { Post } from "@/lib/blog/types";

const PAGE_SIZE = 12;

export function PostList({ posts }: { posts: Post[] }) {
  const [page, setPage] = useState(1);
  const visiblePosts = posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <div className="mt-6 grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {visiblePosts.map((post) => <FeaturedPostCard key={post.id} post={post} />)}
      </div>
      <div className="mt-8"><PaginationControls page={page} totalItems={posts.length} pageSize={PAGE_SIZE} onPageChange={setPage} /></div>
    </>
  );
}
