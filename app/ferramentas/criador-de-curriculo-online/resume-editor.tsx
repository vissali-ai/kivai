"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ToolAiPanel } from "@/components/tools/tool-ai-panel";

const labels = {
  name: "Nome completo", role: "Cargo desejado", contact: "Contato e cidade",
  summary: "Resumo profissional", experience: "Experiência profissional",
  education: "Formação", projects: "Projetos e atividades", skills: "Habilidades",
} as const;
type Field = keyof typeof labels;
const empty = { name: "", role: "", contact: "", summary: "", experience: "", education: "", projects: "", skills: "" };
const fields = Object.keys(labels) as Field[];
const storage = "kivai.curriculo.v1";
const control = "mt-1 w-full rounded-md border bg-background px-3 py-2";
export default function ResumeEditor() {
  const [values, setValues] = useState(empty);
  const [first, setFirst] = useState(false);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const [target, setTarget] = useState<"summary" | "experience">("summary");
  useEffect(() => {
    try {
      const draft = JSON.parse(localStorage.getItem(storage) || "null");
      if (draft && fields.every(key => typeof draft.values?.[key] === "string")) {
        setValues(draft.values); setFirst(draft.first === true);
      }
    } catch { setNotice("O navegador não conseguiu recuperar o rascunho."); }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) try { localStorage.setItem(storage, JSON.stringify({values, first})); }
    catch { setNotice("O navegador não conseguiu salvar o rascunho neste dispositivo."); }
  }, [values, first, ready]);
  function update(key: Field, value: string) { setValues(previous => ({...previous, [key]: value})); }
  const sections: Field[] = first ? ["summary","education","projects","skills","experience"] : ["summary","experience","education","skills","projects"];
  const order: Field[] = ["name","role","contact", ...sections];
  async function download() {
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF();
      let y = 22;
      function write(line: string, size: number, bold = false) {
        pdf.setFont("helvetica", bold ? "bold" : "normal"); pdf.setFontSize(size);
        for (const part of pdf.splitTextToSize(line, 170) as string[]) {
          if (y > 275) { pdf.addPage(); y = 22; }
          pdf.text(part, 20, y); y += size * 0.48;
        }
      }
      for (const key of order) {
        if (!values[key].trim()) continue;
        if (sections.includes(key)) { y += 4; if (y > 259) { pdf.addPage(); y = 22; } write(labels[key], 13, true); }
        write(values[key].trim(), key === "name" ? 22 : 11, key === "name");
      }
      pdf.save("curriculo.pdf");
    } catch { setNotice("Falha ao gerar o PDF. Tente baixar novamente."); }
  }
  return <div className="grid items-start gap-8 lg:grid-cols-2">
    <section className="space-y-4">
      <label className="block font-medium">Modelo<select className={control} value={first ? "first" : "professional"} onChange={e => setFirst(e.target.value === "first")}>
        <option value="professional">Profissional · experiência em destaque</option><option value="first">Primeiro emprego · formação em destaque</option>
      </select></label>
      {order.map(key => <label className="block text-sm font-medium" key={key}>{labels[key]}
        {sections.includes(key) ? <textarea className={control} rows={3} maxLength={4000} value={values[key]} onChange={e=>update(key,e.target.value)} /> :
          <input className={control} maxLength={250} value={values[key]} onChange={e=>update(key,e.target.value)} />}
      </label>)}
      <p className="text-sm text-muted-foreground">O rascunho fica salvo neste navegador.</p>
      <ToolAiPanel fingerprint={JSON.stringify([target,values[target]])} cost={1} disabled={!values[target].trim()}
        prepare={async()=>({kind:"resume", consent:true, section:labels[target], text:values[target]})}
        render={result=>result.kind === "resume" && <><p className="whitespace-pre-line">{result.suggestion}</p><Button onClick={()=>update(target,result.suggestion)}>Aplicar sugestão</Button></>}>
        <label>Trecho para enviar<select className={control} value={target} onChange={e=>setTarget(e.target.value === "experience" ? "experience" : "summary")}>
          <option value="summary">Resumo profissional</option><option value="experience">Experiência profissional</option></select></label>
      </ToolAiPanel>
    </section>
    <section className="rounded-lg border bg-muted/30 p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">Prévia do currículo</h2>
        <Button disabled={!values.name.trim()} onClick={download}>Baixar PDF</Button></div>
      <article className="min-h-96 space-y-3 break-words bg-white p-6 text-slate-900 shadow-sm">
        <h3 className="text-2xl font-bold">{values.name || "Seu nome"}</h3>
        <p>{values.role}</p><p className="text-sm">{values.contact}</p>
        {sections.filter(key=>values[key].trim()).map(key=><section key={key}><h4 className="border-b pb-1 font-semibold">{labels[key]}</h4><p className="mt-1 whitespace-pre-wrap text-sm">{values[key]}</p></section>)}
      </article>{notice && <p role="alert">{notice}</p>}
    </section>
  </div>;
}
