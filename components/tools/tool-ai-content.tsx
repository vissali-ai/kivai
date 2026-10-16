import { getPublishedToolOverride } from "@/lib/site-cms/repository";
import { assistantCopy } from "@/lib/ai/content-assistant-copy";
import { ToolAiProvider } from "./tool-ai-provider";
export async function ToolAiContent({slug,children}:{slug:string;children:React.ReactNode}) {
 const content=await getPublishedToolOverride(slug);
 return <ToolAiProvider copy={assistantCopy(slug,content?.customData.originalFields)}>{children}</ToolAiProvider>;
}
