import { statSync } from "node:fs";
import { spawnSync } from "node:child_process";

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

console.log("Auditoria de manutenção do Kivai\n");
console.log(residues.length ? `Resíduos versionados: ${residues.join(", ")}` : "Resíduos versionados conhecidos: nenhum");
console.log(largeFiles.length ? `Arquivos versionados acima de 5 MB: ${largeFiles.map((item) => `${item.file} (${item.megabytes} MB)`).join(", ")}` : "Arquivos versionados acima de 5 MB: nenhum");
console.log(worktree ? "\nHá alterações locais no Git. Revise com: git status --short" : "\nÁrvore de trabalho limpa.");
console.log("\nEsta rotina não exclui arquivos.");
