import { tools } from "@/lib/tools";

// Compatibility export; the Admin and public tools share the central catalog.
export const archiveSearchItems = tools.filter((tool) => tool.category === "arquivos");
