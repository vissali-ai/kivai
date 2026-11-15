import { headers } from "next/headers";

const STREAMING_HOST = "streaming.kivai.com.br";

export async function getMusicPathPrefix(): Promise<string> {
  const host = (await headers()).get("host")?.split(":")[0]?.toLowerCase();
  return host === STREAMING_HOST ? "" : "/musica";
}

export function musicPath(prefix: string, ...slugs: string[]): string {
  return `${prefix}/${slugs.join("/")}`;
}
