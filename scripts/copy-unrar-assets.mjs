import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = join(rootDir, "node_modules", "@unrar-browser", "core", "build");
const targetDir = join(rootDir, "public", "vendor", "unrar");

await mkdir(targetDir, { recursive: true });

await Promise.all([
  copyFile(join(sourceDir, "unrar.js"), join(targetDir, "unrar.js")),
  copyFile(join(sourceDir, "unrar.wasm"), join(targetDir, "unrar.wasm")),
]);

console.log("[UnRAR] Assets preparados em /public/vendor/unrar.");
