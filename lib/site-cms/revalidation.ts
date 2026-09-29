import "server-only";

import { revalidatePath } from "next/cache";

/** CMS content may appear in any page through navigation, footer or hub cards. */
export function revalidateSiteCms() {
  revalidatePath("/", "layout");
  // Route handlers are not descendants of the root layout.
  revalidatePath("/sitemap.xml");
}
