import "server-only";

import { existsSync, lstatSync, readdirSync } from "node:fs";
import path from "node:path";

export type ProjectFolderMetric = {
  path: string;
  sizeBytes: number;
  fileCount: number;
  available: boolean;
};

export type ProjectMaintenanceSnapshot = {
  environment: "local" | "vercel";
  scannedAt: string;
  totalSizeBytes: number;
  totalFileCount: number;
  folders: ProjectFolderMetric[];
  largestFiles: { path: string; sizeBytes: number }[];
  truncated: boolean;
  deployment: {
    environment: string;
    commitSha: string;
    url: string;
    region: string;
  } | null;
};

const MONITORED_PATHS = [".next", ".next/dev", ".next/cache", "node_modules", "backend/.venv", ".git"];
const LARGE_FILE_BYTES = 100 * 1024 * 1024;
const MAX_ENTRIES = 300_000;
const MAX_SCAN_MILLISECONDS = 25_000;

function normalizedRelative(root: string, absolutePath: string) {
  return path.relative(root, absolutePath).split(path.sep).join("/");
}

export function scanProjectMaintenance(): ProjectMaintenanceSnapshot {
  const root = process.cwd();
  const startedAt = Date.now();
  const metrics = new Map(MONITORED_PATHS.map((item) => [item, {
    path: item,
    sizeBytes: 0,
    fileCount: 0,
    available: existsSync(path.join(/*turbopackIgnore: true*/ root, item)),
  }]));
  const stack = [root];
  const largestFiles: { path: string; sizeBytes: number }[] = [];
  let totalSizeBytes = 0;
  let totalFileCount = 0;
  let inspectedEntries = 0;
  let truncated = false;

  while (stack.length) {
    if (inspectedEntries >= MAX_ENTRIES || Date.now() - startedAt >= MAX_SCAN_MILLISECONDS) {
      truncated = true;
      break;
    }
    const directory = stack.pop()!;
    let entries;
    try {
      entries = readdirSync(/*turbopackIgnore: true*/ directory, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      inspectedEntries += 1;
      const absolutePath = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        stack.push(absolutePath);
        continue;
      }
      if (!entry.isFile()) continue;
      let sizeBytes = 0;
      try {
        sizeBytes = lstatSync(/*turbopackIgnore: true*/ absolutePath).size;
      } catch {
        continue;
      }
      const relativePath = normalizedRelative(root, absolutePath);
      totalSizeBytes += sizeBytes;
      totalFileCount += 1;
      for (const monitoredPath of MONITORED_PATHS) {
        if (relativePath === monitoredPath || relativePath.startsWith(`${monitoredPath}/`)) {
          const metric = metrics.get(monitoredPath)!;
          metric.sizeBytes += sizeBytes;
          metric.fileCount += 1;
        }
      }
      if (sizeBytes >= LARGE_FILE_BYTES) largestFiles.push({ path: relativePath, sizeBytes });
    }
  }

  return {
    environment: process.env.VERCEL === "1" ? "vercel" : "local",
    scannedAt: new Date().toISOString(),
    totalSizeBytes,
    totalFileCount,
    folders: [...metrics.values()],
    largestFiles: largestFiles.sort((left, right) => right.sizeBytes - left.sizeBytes).slice(0, 20),
    truncated,
    deployment: process.env.VERCEL === "1" ? {
      environment: process.env.VERCEL_ENV ?? "produção",
      commitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? "indisponível",
      url: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "indisponível",
      region: process.env.VERCEL_REGION ?? "indisponível",
    } : null,
  };
}
