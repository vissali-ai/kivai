import type { Metadata } from "next";
import { MusicPlayerProvider } from "@/components/music/music-player-provider";
export const metadata:Metadata={title:{default:"Música independente",template:"%s | Kivai Música"},description:"Descubra artistas independentes e ouça seus álbuns no Kivai."};
export default function MusicLayout({children}:{children:React.ReactNode}){return <MusicPlayerProvider>{children}</MusicPlayerProvider>;}
