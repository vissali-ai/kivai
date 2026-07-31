import UnirPdfsClient from "./unir-pdfs-client";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("unir-pdfs");

export default function Page() {
  return <UnirPdfsClient />;
}
