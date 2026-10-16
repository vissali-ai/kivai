"use client";
import { createContext, useContext } from "react";
import type { AssistantCopy } from "@/lib/ai/content-assistant-copy";
const Context = createContext<AssistantCopy>({title:"Assistente de IA",description:"Revise as sugestões antes de usar.",tutorialUrl:""});
export function ToolAiProvider({copy, children}:{copy:AssistantCopy;children:React.ReactNode}) {return <Context.Provider value={copy}>{children}</Context.Provider>;}
export const useToolAiCopy = () => useContext(Context);
