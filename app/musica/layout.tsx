import type { Metadata } from "next";
import { MusicPlayerProvider } from "@/components/music/music-player-provider";
import { getCmsHubMetadata, getPageMetadata } from "@/lib/seo";
const baseMetadata=getPageMetadata({title:"Kivai Música | Artistas independentes",description:"Descubra artistas independentes e ouça seus álbuns no Kivai.",pathname:"/musica"});
export async function generateMetadata():Promise<Metadata>{return getCmsHubMetadata("musica",baseMetadata);}
export default function MusicLayout({children}:{children:React.ReactNode}){return <MusicPlayerProvider>{children}</MusicPlayerProvider>;}
