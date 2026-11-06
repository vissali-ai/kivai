import { getToolMetadataAsync } from "@/lib/seo";
import ComoVotouClient from "./como-votou-client";
export async function generateMetadata() { return getToolMetadataAsync("como-votou-meu-deputado"); }
export default function Page() { return <ComoVotouClient/>; }
