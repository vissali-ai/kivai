import type { ReactNode } from "react";

import { ToolDownloadNavigator } from "@/components/tools/tool-download-navigator";

export default function ToolsLayout({ children }: { children: ReactNode }) {
  return <ToolDownloadNavigator>{children}</ToolDownloadNavigator>;
}
