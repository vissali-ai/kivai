import "server-only";
import { randomUUID } from "node:crypto";
import { assertAdminApi } from "@/lib/blog/auth";
import { blogConfig } from "@/lib/blog/config";
import { supabaseRest, supabaseStorage } from "@/lib/blog/supabase";
import { plainText } from "@/lib/blog/sanitize";
import { slugify } from "@/lib/blog/slug";
import { getSiteHubBySlug } from "@/lib/site-cms/repository";
import type { MusicAlbum, MusicArtist, MusicCatalog, MusicTrack } from "@/lib/music/types";

type ArtistRow = { id:string;slug:string;name:string;bio:string;photo_url:string;cover_url:string;status:MusicArtist["status"];indexable:boolean;include_in_sitemap:boolean;updated_at:string };
type AlbumRow = { id:string;artist_id:string;artist_name?:string;artist_slug?:string;slug:string;title:string;description:string;cover_url:string;release_date:string|null;status:MusicAlbum["status"];indexable:boolean;include_in_sitemap:boolean;updated_at:string };
type TrackRow = { id:string;album_id:string;title:string;track_number:number;duration_seconds:number|null;audio_url:string;status:MusicTrack["status"] };
const mapArtist=(r:ArtistRow):MusicArtist=>({id:r.id,slug:r.slug,name:r.name,bio:r.bio,photoUrl:r.photo_url,coverUrl:r.cover_url,status:r.status,indexable:r.indexable,includeInSitemap:r.include_in_sitemap,updatedAt:r.updated_at});
const mapAlbum=(r:AlbumRow):MusicAlbum=>({id:r.id,artistId:r.artist_id,artistName:r.artist_name,artistSlug:r.artist_slug,slug:r.slug,title:r.title,description:r.description,coverUrl:r.cover_url,releaseDate:r.release_date,status:r.status,indexable:r.indexable,includeInSitemap:r.include_in_sitemap,updatedAt:r.updated_at});
const mapTrack=(r:TrackRow):MusicTrack=>({id:r.id,albumId:r.album_id,title:r.title,trackNumber:r.track_number,durationSeconds:r.duration_seconds,audioUrl:r.audio_url,status:r.status});
const enc=encodeURIComponent;

export async function listMusicArtists(includeDrafts=false) { const q=includeDrafts?"music_artists?select=*&order=name.asc":"music_artists?select=*&status=eq.published&order=name.asc"; return (await supabaseRest<ArtistRow[]>(q,{allowMissingConfig:true})).map(mapArtist); }
export async function listMusicCatalog():Promise<MusicCatalog[]> {
 const hub=await getSiteHubBySlug("musica",true);if(!hub)return [];
 const artists=await listMusicArtists(); if(!artists.length)return [];
 const albums=(await supabaseRest<AlbumRow[]>(`music_albums?select=*,artist:music_artists(name,slug)&artist_id=in.(${artists.map(a=>a.id).join(",")})&status=eq.published&order=release_date.desc.nullslast,title.asc`,{allowMissingConfig:true})).map(r=>{const artist=(r as AlbumRow & {artist?:{name:string;slug:string}}).artist;return mapAlbum({...r,artist_name:artist?.name,artist_slug:artist?.slug});});
 const tracks=albums.length?(await supabaseRest<TrackRow[]>(`music_tracks?select=*&album_id=in.(${albums.map(a=>a.id).join(",")})&status=eq.published&order=track_number.asc`,{allowMissingConfig:true})).map(mapTrack):[];
 return artists.map(artist=>({artist,albums:albums.filter(a=>a.artistId===artist.id).map(album=>({...album,tracks:tracks.filter(t=>t.albumId===album.id)}))}));
}
export async function getMusicCatalogByArtist(slug:string) { return (await listMusicCatalog()).find(c=>c.artist.slug===slug)??null; }
export async function getMusicAlbum(artistSlug:string,albumSlug:string) { const catalog=await getMusicCatalogByArtist(artistSlug); if(!catalog)return null; const album=catalog.albums.find(a=>a.slug===albumSlug); return album?{artist:catalog.artist,album}:null; }
export async function listAdminMusicCatalog() {
 const [artists,albums,tracks]=await Promise.all([supabaseRest<ArtistRow[]>("music_artists?select=*&order=created_at.desc"),supabaseRest<AlbumRow[]>("music_albums?select=*&order=created_at.desc"),supabaseRest<TrackRow[]>("music_tracks?select=*&order=track_number.asc")]);
 return {artists:artists.map(mapArtist),albums:albums.map(mapAlbum),tracks:tracks.map(mapTrack)};
}
function clean(value:unknown,max:number){return plainText(String(value??"")).trim().slice(0,max);}
function cleanStatus(value:unknown):MusicArtist["status"]{return ["draft","published","archived"].includes(String(value))?value as MusicArtist["status"]:"draft";}
export async function saveMusicArtist(input:Record<string,unknown>) {
 const id=clean(input.id,64);const name=clean(input.name,120);const slug=slugify(clean(input.slug||name,120));if(name.length<2||!slug)throw new Error("Informe nome e slug válidos.");
 const status=cleanStatus(input.status);const indexable=status==="published"&&Boolean(input.indexable);const include=status==="published"&&indexable&&Boolean(input.includeInSitemap);
 const body={slug,name,bio:String(input.bio??"").slice(0,12000),photo_url:clean(input.photoUrl,1000),cover_url:clean(input.coverUrl,1000),status,indexable,include_in_sitemap:include,published_at:status==="published"?new Date().toISOString():null};
 const rows=await supabaseRest<ArtistRow[]>(id?`music_artists?id=eq.${enc(id)}`:"music_artists",{method:id?"PATCH":"POST",body:JSON.stringify(body)});return mapArtist(rows[0]);
}
export async function saveMusicAlbum(input:Record<string,unknown>) {
 const id=clean(input.id,64),artistId=clean(input.artistId,64),title=clean(input.title,160),slug=slugify(clean(input.slug||title,160));if(!artistId||title.length<2||!slug)throw new Error("Informe artista, título e slug válidos.");
 const status=cleanStatus(input.status),indexable=status==="published"&&Boolean(input.indexable),include=status==="published"&&indexable&&Boolean(input.includeInSitemap);
 const body={artist_id:artistId,slug,title,description:String(input.description??"").slice(0,8000),cover_url:clean(input.coverUrl,1000),release_date:clean(input.releaseDate,10)||null,status,indexable,include_in_sitemap:include,published_at:status==="published"?new Date().toISOString():null};
 const rows=await supabaseRest<AlbumRow[]>(id?`music_albums?id=eq.${enc(id)}`:"music_albums",{method:id?"PATCH":"POST",body:JSON.stringify(body)});return mapAlbum(rows[0]);
}
export async function saveMusicTrack(input:Record<string,unknown>) {
 const id=clean(input.id,64),albumId=clean(input.albumId,64),title=clean(input.title,160),trackNumber=Math.max(1,Math.floor(Number(input.trackNumber)||1)),audioUrl=clean(input.audioUrl,1200);if(!albumId||title.length<1||!audioUrl)throw new Error("Informe álbum, título e arquivo de áudio.");
 const status=cleanStatus(input.status);const body={album_id:albumId,title,track_number:trackNumber,duration_seconds:Math.max(0,Math.floor(Number(input.durationSeconds)||0))||null,audio_url:audioUrl,status};
 const rows=await supabaseRest<TrackRow[]>(id?`music_tracks?id=eq.${enc(id)}`:"music_tracks",{method:id?"PATCH":"POST",body:JSON.stringify(body)});return mapTrack(rows[0]);
}
export async function createMusicUploadUrl(kind:string,mime:string,size:number) {
 await assertAdminApi();const isAudio=kind==="audio";const allowed=isAudio?["audio/mpeg","audio/mp3"]:["image/jpeg","image/png","image/webp"];
 const max=isAudio?100*1024*1024:8*1024*1024;if(!allowed.includes(mime))throw new Error(isAudio?"Envie um arquivo MP3.":"Envie JPG, PNG ou WebP.");if(!Number.isFinite(size)||size<1||size>max)throw new Error(`O arquivo deve ter até ${Math.round(max/1024/1024)} MB.`);
 const ext=isAudio?"mp3":mime.split("/")[1].replace("jpeg","jpg"),path=`${isAudio?"tracks":"artwork"}/${new Date().getUTCFullYear()}/${randomUUID()}.${ext}`;
 const response=await supabaseStorage(`object/upload/sign/music-media/${path}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({upsert:false})});const data=await response.json() as {token?:string};if(!data.token)throw new Error("Não foi possível preparar o upload.");
 return {uploadUrl:`${blogConfig.supabaseUrl}/storage/v1/object/upload/sign/music-media/${path}?token=${encodeURIComponent(data.token)}`,publicUrl:`${blogConfig.supabaseUrl}/storage/v1/object/public/music-media/${path}`};
}
