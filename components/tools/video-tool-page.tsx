import { VideoToolSeoContent } from "@/components/tools/video-tool-seo-content";
import { VideoWorkbenchClient, type WorkbenchMode } from "@/components/tools/video-workbench-client";

export function VideoToolPage({ mode }: { mode: WorkbenchMode }) {
  return <><VideoWorkbenchClient mode={mode} /><VideoToolSeoContent variant={mode} /></>;
}
