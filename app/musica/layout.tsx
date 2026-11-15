import type { Metadata } from "next";
import { MusicPlayerProvider } from "@/components/music/music-player-provider";
import { getCmsHubMetadata, getPageMetadata } from "@/lib/seo";
import { headers } from "next/headers";
const baseMetadata=getPageMetadata({title:"Kivai Música | Artistas independentes",description:"Descubra artistas independentes e ouça seus álbuns no Kivai.",pathname:"/musica"});
export async function generateMetadata():Promise<Metadata>{
  const metadata = await getCmsHubMetadata("musica",baseMetadata);
  const host = (await headers()).get("host")?.split(":")[0]?.toLowerCase();
  if (host !== "streaming.kivai.com.br") return metadata;
  const canonical = "https://streaming.kivai.com.br";
  return { ...metadata, alternates: { canonical }, openGraph: { ...metadata.openGraph, url: canonical } };
}
export default function MusicLayout({children}:{children:React.ReactNode}){return <MusicPlayerProvider>{children}</MusicPlayerProvider>;}

