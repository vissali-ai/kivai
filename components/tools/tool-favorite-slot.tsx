"use client";

// Populate the favorites portal only after this streamed slot has hydrated.
export function ToolFavoriteSlot({ className }: { className?: string }) {
  return <div className={className} data-kivai-favorite-pending="" ref={node => {
    if (node) node.setAttribute("data-kivai-favorite-slot", "");
  }} />;
}
