import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/blog/auth";
import { apiError } from "@/lib/blog/api";
import { listAdminMusicCatalog, saveMusicAlbum, saveMusicArtist, saveMusicTrack, uploadMusicFile } from "@/lib/music/repository";
export async function GET(){try{await assertAdminApi();return NextResponse.json(await listAdminMusicCatalog());}catch(e){return apiError(e);}}
export async function POST(request:Request){try{await assertAdminApi();const form=await request.formData();if(form.has("file")){const file=form.get("file");if(!(file instanceof File))throw new Error("Arquivo inválido.");return NextResponse.json({url:await uploadMusicFile(file,String(form.get("kind")??"image"))},{status:201});}
 const data=await request.json() as Record<string,unknown>;const kind=String(data.kind);delete data.kind;const saved=kind==="artist"?await saveMusicArtist(data):kind==="album"?await saveMusicAlbum(data):kind==="track"?await saveMusicTrack(data):null;if(!saved)throw new Error("Tipo de cadastro inválido.");return NextResponse.json(saved,{status:201});}catch(e){return apiError(e);}}
export async function PUT(request:Request){try{await assertAdminApi();const data=await request.json() as Record<string,unknown>;const kind=String(data.kind);delete data.kind;const saved=kind==="artist"?await saveMusicArtist(data):kind==="album"?await saveMusicAlbum(data):kind==="track"?await saveMusicTrack(data):null;if(!saved)throw new Error("Tipo de cadastro inválido.");return NextResponse.json(saved);}catch(e){return apiError(e);}}
