import "server-only";

export type SocialNetwork = "youtube" | "instagram" | "tiktok" | "facebook" | "linkedin" | "x" | "threads" | "pinterest";
export type SocialLink = { network: SocialNetwork; url: string; videoId?: string };
export type SocialEvidence = { title: string; caption: string; author: string; source: string; durationSeconds?: number };

const hosts: Array<[SocialNetwork, string[]]> = [
  ["youtube", ["youtube.com", "youtu.be", "youtube-nocookie.com"]],
  ["instagram", ["instagram.com"]],
  ["tiktok", ["tiktok.com"]],
  ["facebook", ["facebook.com", "fb.watch"]],
  ["linkedin", ["linkedin.com"]],
  ["x", ["x.com", "twitter.com"]],
  ["threads", ["threads.net", "threads.com"]],
  ["pinterest", ["pinterest.com", "pin.it"]],
];

export function parseSocialLink(value: string): SocialLink | null {
  try {
    const url = new URL(value.trim());
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.port || url.href.length > 2048) return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, "").replace(/^m\./, "");
    const network = hosts.find(([, allowed]) => allowed.some((name) => host === name || host.endsWith("." + name)))?.[0];
    if (!network) return null;
    url.protocol = "https:";
    url.hash = "";
    let videoId: string | undefined;
    if (network === "youtube") {
      const candidate = host === "youtu.be" ? url.pathname.split("/")[1] : url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/embed/") ? url.pathname.split("/")[2] : url.searchParams.get("v");
      if (candidate && /^[\w-]{11}$/.test(candidate)) videoId = candidate;
    }
    return { network, url: url.toString(), videoId };
  } catch { return null; }
}

type YoutubeData = { items?: Array<{ snippet?: { title?: string; description?: string; channelTitle?: string }; contentDetails?: { duration?: string } }> };
type OembedData = { title?: string; author_name?: string };
const timeout = 7_000;

async function jsonOrNull<T>(url: string): Promise<T | null> {
  try {
    // Fixed provider hosts only. No user-selected fetch target or redirect chain.
    const response = await fetch(url, { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(timeout), headers: { Accept: "application/json" } });
    if (!response.ok || Number(response.headers.get("content-length") || 0) > 250_000) return null;
    const body = await response.text();
    return body.length < 250_000 ? JSON.parse(body) as T : null;
  } catch { return null; }
}

export async function getSocialEvidence(link: SocialLink): Promise<SocialEvidence> {
  const empty: SocialEvidence = { title: "", caption: "", author: "", source: "Nenhum metadado disponível" };
  if (link.network === "youtube" && link.videoId) {
    const apiKey = process.env.YOUTUBE_API_KEY || process.env.GEMINI_API_KEY;
    if (apiKey) {
      const data = await jsonOrNull<YoutubeData>(`https://www.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails&id=${encodeURIComponent(link.videoId)}&key=${encodeURIComponent(apiKey)}`);
      const snippet = data?.items?.[0]?.snippet;
      if (snippet) {
        const duration = data?.items?.[0]?.contentDetails?.duration?.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
        const durationSeconds = duration ? Number(duration[1] || 0) * 3600 + Number(duration[2] || 0) * 60 + Number(duration[3] || 0) : undefined;
        return { title: (snippet.title || "").slice(0, 200), caption: (snippet.description || "").slice(0, 8000), author: (snippet.channelTitle || "").slice(0, 200), source: "YouTube Data API", durationSeconds };
      }
    }
    const data = await jsonOrNull<OembedData>(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent("https://www.youtube.com/watch?v=" + link.videoId)}`);
    if (data?.title) return { title: data.title.slice(0, 200), caption: "", author: (data.author_name || "").slice(0, 200), source: "YouTube oEmbed (sem descrição)" };
  }
  if (link.network === "tiktok") {
    const data = await jsonOrNull<OembedData>(`https://www.tiktok.com/oembed?url=${encodeURIComponent(link.url)}`);
    if (data?.title) return { title: "", caption: data.title.slice(0, 5000), author: (data.author_name || "").slice(0, 200), source: "TikTok oEmbed" };
  }
  return empty;
}
