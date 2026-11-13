"use client";

export type GuestStudy = {
 id:string; title:string; source:string; text:string; mode:"summary"|"transcript";
 partial:boolean; createdAt:string;
};
export type GuestPlaylist = {id:string; name:string; ids:string[]};
const studiesKey="kivai_preview_video_studies_v1";
const listsKey="kivai_preview_video_lists_v1";
export function guestStudies():GuestStudy[]{
 try {const raw=JSON.parse(localStorage.getItem(studiesKey)??"[]");return Array.isArray(raw)?raw.filter(x=>x&&typeof x.id==="string"&&typeof x.text==="string").slice(0,100):[];}
 catch {return [];}
}
export function guestLists():GuestPlaylist[]{
 try {const raw=JSON.parse(localStorage.getItem(listsKey)??"[]");return Array.isArray(raw)?raw.filter(x=>x&&typeof x.id==="string"&&Array.isArray(x.ids)).slice(0,100):[];}
 catch {return [];}
}
export function storeGuestStudies(value:GuestStudy[]){localStorage.setItem(studiesKey,JSON.stringify(value.slice(0,100)));}
export function storeGuestLists(value:GuestPlaylist[]){localStorage.setItem(listsKey,JSON.stringify(value.slice(0,100)));}
const dbName="kivai_preview_study_audio";
function openDb():Promise<IDBDatabase>{
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open(dbName,1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains("audio"))req.result.createObjectStore("audio");};
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error??new Error("Não foi possível abrir o armazenamento de áudio."));
 });
}
export async function putGuestAudio(id:string,bytes:Blob){
 const db=await openDb();
 try {await new Promise<void>((resolve,reject)=>{
  const tr=db.transaction("audio","readwrite");tr.objectStore("audio").put(bytes,id);
  tr.oncomplete=()=>resolve();tr.onerror=()=>reject(tr.error);
 });}finally{db.close();}
}
export async function getGuestAudio(id:string):Promise<Blob|null>{
 const db=await openDb();
 try{return await new Promise<Blob|null>((resolve,reject)=>{
  const tr=db.transaction("audio","readonly");const req=tr.objectStore("audio").get(id);
  req.onsuccess=()=>resolve(req.result instanceof Blob?req.result:null);
  req.onerror=()=>reject(req.error);
 });}finally{db.close();}
}
export async function deleteGuestAudio(id:string){
 const db=await openDb();
 try {await new Promise<void>((resolve,reject)=>{
  const tr=db.transaction("audio","readwrite");tr.objectStore("audio").delete(id);
  tr.oncomplete=()=>resolve();tr.onerror=()=>reject(tr.error);
 });}finally{db.close();}
}
