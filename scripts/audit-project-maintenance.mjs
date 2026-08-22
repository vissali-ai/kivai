import { lstatSync, readdirSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

function git(...args) {
  const result = spawnSync("git", args, { cwd: process.cwd(), encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr.trim() || "Não foi possível consultar o Git.");
  return result.stdout.trim();
}

const tracked = git("ls-files").split(/\r?\n/).filter(Boolean);
const residuePattern = /(^|\/)(tatus|.*\.tsbuildinfo|.*\.(log|tmp|bak|orig))$/i;
const residues = tracked.filter((file) => {
  try {
    statSync(file);
    return residuePattern.test(file);
  } catch {
    return false;
  }
});
const largeFiles = tracked.flatMap((file) => {
  try {
    const size = statSync(file).size;
    return size >= 5 * 1024 * 1024 ? [{ file, megabytes: (size / 1024 / 1024).toFixed(1) }] : [];
  } catch {
    return [];
  }
});
const worktree = git("status", "--short");
const monitoredPaths = [".next", ".next/dev", ".next/cache", "node_modules", "backend/.venv", ".git"];
const folderMetrics = new Map(monitoredPaths.map((item) => [item, { bytes: 0, files: 0 }]));
const largeLocalFiles = [];
const root = process.cwd();
const stack = [root];

while (stack.length) {
  const directory = stack.pop();
  let entries = [];
  try { entries = readdirSync(directory, { withFileTypes: true }); } catch { continue; }
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) { stack.push(absolute); continue; }
    if (!entry.isFile()) continue;
    let size = 0;
    try { size = lstatSync(absolute).size; } catch { continue; }
    const relative = path.relative(root, absolute).split(path.sep).join("/");
    for (const monitoredPath of monitoredPaths) {
      if (relative === monitoredPath || relative.startsWith(`${monitoredPath}/`)) {
        const metric = folderMetrics.get(monitoredPath);
        metric.bytes += size;
        metric.files += 1;
      }
    }
    if (size >= 100 * 1024 * 1024) largeLocalFiles.push({ file: relative, size });
  }
}

function formatSize(bytes) {
  return bytes >= 1024 ** 3
    ? `${(bytes / 1024 ** 3).toFixed(2)} GB`
    : `${(bytes / 1024 ** 2).toFixed(0)} MB`;
}

console.log("Auditoria de manutenção do Kivai\n");
console.log(residues.length ? `Resíduos versionados: ${residues.join(", ")}` : "Resíduos versionados conhecidos: nenhum");
console.log(largeFiles.length ? `Arquivos versionados acima de 5 MB: ${largeFiles.map((item) => `${item.file} (${item.megabytes} MB)`).join(", ")}` : "Arquivos versionados acima de 5 MB: nenhum");
console.log("\nPastas locais monitoradas:");
for (const [folder, metric] of folderMetrics) console.log(`- ${folder}: ${metric.files ? `${formatSize(metric.bytes)} em ${metric.files} arquivo(s)` : "não encontrada"}`);
console.log(largeLocalFiles.length ? `\nArquivos locais acima de 100 MB:\n${largeLocalFiles.sort((left, right) => right.size - left.size).map((item) => `- ${item.file} (${formatSize(item.size)})`).join("\n")}` : "\nArquivos locais acima de 100 MB: nenhum");
console.log(worktree ? "\nHá alterações locais no Git. Revise com: git status --short" : "\nÁrvore de trabalho limpa.");
console.log("\nPowerShell para localizar arquivos grandes:");
console.log("Get-ChildItem -LiteralPath . -File -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { $_.Length -ge 100MB } | Sort-Object Length -Descending | Select-Object FullName, @{Name='TamanhoMB'; Expression={[math]::Round($_.Length / 1MB, 1)}}");
console.log("\nEsta rotina não exclui arquivos.");
