"use client";
import { useState } from "react";
import { ToolAiPanel } from "./tool-ai-panel";
import { Button } from "@/components/ui/button";
export function RenameAi({names,onApply}:{names:string[];onApply:(names:string[])=>void}){
 const [instruction,setInstruction]=useState('Padronize os nomes de forma descritiva, preservando as informações existentes.');
 return <ToolAiPanel fingerprint={JSON.stringify({names,instruction})} cost={1} disabled={!names.length||names.length>30||!instruction.trim()} prepare={async()=>({kind:'rename',names,instruction,consent:true})} render={result=>result.kind==='rename'&&<>
 <div className="max-h-80 overflow-auto text-sm">{result.names.map((name,i)=><p key={i} className="break-all border-b py-2">{names[i]} → <strong>{name}</strong></p>)}</div><Button onClick={()=>onApply(result.names)}>Aplicar nomes à prévia</Button>
 </>}><label className="block text-sm">Como organizar os nomes<textarea maxLength={600} value={instruction} onChange={e=>setInstruction(e.target.value)} className="mt-1 block w-full border bg-background p-2"/></label><p className="text-xs">Até 30 arquivos por geração. Somente os nomes são enviados, nunca o conteúdo. A IA usa as informações presentes nos nomes; extensões e sequência são preservadas pelo sistema.</p></ToolAiPanel>;
}
