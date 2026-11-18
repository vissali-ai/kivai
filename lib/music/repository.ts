import "server-only";
import { randomUUID } from "node:crypto";
import { assertAdminApi } from "@/lib/blog/auth";
import { blogConfig } from "@/lib/blog/config";
import { supabaseRest, supabaseStorage } from "@/lib/blog/supabase";
import { plainText } from "@/lib/blog/sanitize";
import { slugify } from "@/lib/blog/slug";
import { getSiteHubBySlug } from "@/lib/site-cms/repository";
import type { MusicAlbum, MusicArtist, MusicCatalog, MusicGenre, MusicTrack } from "@/lib/music/types";
import { createR2UploadUrl, deleteR2Object, getR2PublicUrl, r2ObjectKeyFromPublicUrl } from "@/lib/music/r2";

type ArtistRow = { id:string;slug:string;name:string;bio:string;photo_url:string;cover_url:string;contact_whatsapp:string;contact_message:string;status:MusicArtist["status"];indexable:boolean;include_in_sitemap:boolean;updated_at:string };
type AlbumRow = { id:string;artist_id:string;artist_name?:string;artist_slug?:string;slug:string;title:string;description:string;cover_url:string;release_date:string|null;published_at?:string|null;created_at?:string;status:MusicAlbum["status"];indexable:boolean;include_in_sitemap:boolean;updated_at:string };
type TrackRow = { id:string;slug:string;album_id:string;title:string;track_number:number;duration_seconds:number|null;audio_url:string;play_count:number;status:MusicTrack["status"] };
type GenreRow = { id:string;name:string;slug:string;description:string;image_url:string;status:MusicGenre["status"];created_at:string;updated_at:string };
const mapArtist=(r:ArtistRow & {genre_id?:string|null}):MusicArtist=>({id:r.id,slug:r.slug,name:r.name,bio:r.bio,photoUrl:r.photo_url,coverUrl:r.cover_url,genreId:r.genre_id??null,contactWhatsapp:r.contact_whatsapp,contactMessage:r.contact_message,status:r.status,indexable:r.indexable,includeInSitemap:r.include_in_sitemap,updatedAt:r.updated_at});
const mapGenre=(r:GenreRow):MusicGenre=>({id:r.id,name:r.name,slug:r.slug,description:r.description,imageUrl:r.image_url,status:r.status,createdAt:r.created_at,updatedAt:r.updated_at});
const mapAlbum=(r:AlbumRow):MusicAlbum=>({id:r.id,artistId:r.artist_id,artistName:r.artist_name,artistSlug:r.artist_slug,slug:r.slug,title:r.title,description:r.description,coverUrl:r.cover_url,releaseDate:r.release_date,publishedAt:r.published_at??r.created_at??null,status:r.status,indexable:r.indexable,includeInSitemap:r.include_in_sitemap,updatedAt:r.updated_at});
const mapTrack=(r:TrackRow):MusicTrack=>({id:r.id,slug:r.slug,albumId:r.album_id,title:r.title,trackNumber:r.track_number,durationSeconds:r.duration_seconds,audioUrl:r.audio_url,playCount:Number(r.play_count??0),status:r.status});
const enc=encodeURIComponent;

export async function listMusicArtists(includeDrafts=false) { const q=includeDrafts?"music_artists?select=*&order=name.asc":"music_artists?select=*&status=eq.published&order=name.asc"; return (await supabaseRest<Array<ArtistRow & {genre_id?:string|null}>>(q,{allowMissingConfig:true})).map(mapArtist); }
export async function listMusicGenres(includeDrafts=false):Promise<MusicGenre[]> { const q=includeDrafts?"music_genres?select=*&order=name.asc":"music_genres?select=*&status=eq.published&order=name.asc"; return (await supabaseRest<GenreRow[]>(q,{allowMissingConfig:true})).map(mapGenre); }
export async function getMusicGenreBySlug(slug:string) { const genres=await listMusicGenres(); const genre=genres.find(item=>item.slug===slug); if(!genre)return null; const catalog=await listMusicCatalog(); return {genre,artists:catalog.filter(item=>item.artist.genreId===genre.id)}; }
export async function listMusicCatalog():Promise<MusicCatalog[]> {
 const hub=await getSiteHubBySlug("musica",true);if(!hub)return [];
 const artists=await listMusicArtists(); if(!artists.length)return [];
 const albums=(await supabaseRest<AlbumRow[]>(`music_albums?select=*,artist:music_artists(name,slug)&artist_id=in.(${artists.map(a=>a.id).join(",")})&status=eq.published&order=created_at.desc,title.asc`,{allowMissingConfig:true})).map(r=>{const artist=(r as AlbumRow & {artist?:{name:string;slug:string}}).artist;return mapAlbum({...r,artist_name:artist?.name,artist_slug:artist?.slug});});
 const tracks=albums.length?(await supabaseRest<TrackRow[]>(`music_tracks?select=*&album_id=in.(${albums.map(a=>a.id).join(",")})&status=eq.published&order=track_number.asc`,{allowMissingConfig:true})).map(mapTrack):[];
 return artists.map(artist=>({artist,albums:albums.filter(a=>a.artistId===artist.id).map(album=>({...album,tracks:tracks.filter(t=>t.albumId===album.id)}))}));
}
export async function getMusicCatalogByArtist(slug:string) { return (await listMusicCatalog()).find(c=>c.artist.slug===slug)??null; }
export async function getMusicAlbum(artistSlug:string,albumSlug:string) { const catalog=await getMusicCatalogByArtist(artistSlug); if(!catalog)return null; const album=catalog.albums.find(a=>a.slug===albumSlug); return album?{artist:catalog.artist,album}:null; }
export async function getMusicTrack(artistSlug:string,albumSlug:string,trackSlug:string) {
 const result=await getMusicAlbum(artistSlug,albumSlug);if(!result)return null;
 const track=result.album.tracks.find(item=>item.slug===trackSlug);return track?{...result,track}:null;
}
export async function listAdminMusicCatalog() {
 const [artists,albums,tracks,genres]=await Promise.all([supabaseRest<Array<ArtistRow & {genre_id?:string|null}>>("music_artists?select=*&order=created_at.desc"),supabaseRest<AlbumRow[]>("music_albums?select=*&order=created_at.desc"),supabaseRest<TrackRow[]>("music_tracks?select=*&order=track_number.asc"),supabaseRest<GenreRow[]>("music_genres?select=*&order=name.asc")]);
 return {artists:artists.map(mapArtist),albums:albums.map(mapAlbum),tracks:tracks.map(mapTrack),genres:genres.map(mapGenre)};
}
function clean(value:unknown,max:number){return plainText(String(value??"")).trim().slice(0,max);}
function cleanStatus(value:unknown):MusicArtist["status"]{return ["draft","published","archived"].includes(String(value))?value as MusicArtist["status"]:"draft";}
export async function saveMusicArtist(input:Record<string,unknown>) {
 const id=clean(input.id,64);const name=clean(input.name,120);const slug=slugify(clean(input.slug||name,120));if(name.length<2||!slug)throw new Error("Informe nome e slug válidos.");
 const status=cleanStatus(input.status);const indexable=status==="published"&&Boolean(input.indexable);const include=status==="published"&&indexable&&Boolean(input.includeInSitemap);
 const genreId=clean(input.genreId,64)||null;
 const body={slug,name,bio:String(input.bio??"").slice(0,12000),photo_url:clean(input.photoUrl,1000),cover_url:clean(input.coverUrl,1000),genre_id:genreId,contact_whatsapp:clean(input.contactWhatsapp,40),contact_message:clean(input.contactMessage,500),status,indexable,include_in_sitemap:include,published_at:status==="published"?new Date().toISOString():null};
 const rows=await supabaseRest<ArtistRow[]>(id?`music_artists?id=eq.${enc(id)}`:"music_artists",{method:id?"PATCH":"POST",body:JSON.stringify(body)});return mapArtist(rows[0]);
}
export async function saveMusicAlbum(input:Record<string,unknown>) {
 const id=clean(input.id,64),artistId=clean(input.artistId,64),title=clean(input.title,160),slug=slugify(clean(input.slug||title,160));if(!artistId||title.length<2||!slug)throw new Error("Informe artista, título e slug válidos.");
 const status=cleanStatus(input.status),indexable=status==="published"&&Boolean(input.indexable),include=status==="published"&&indexable&&Boolean(input.includeInSitemap);
 const existing=id?await supabaseRest<Array<{published_at:string|null}>>(`music_albums?select=published_at&id=eq.${enc(id)}`):[];const publishedAt=status==="published"?(existing[0]?.published_at??new Date().toISOString()):null;const body={artist_id:artistId,slug,title,description:String(input.description??"").slice(0,8000),cover_url:clean(input.coverUrl,1000),release_date:clean(input.releaseDate,10)||null,status,indexable,include_in_sitemap:include,published_at:publishedAt};
 const rows=await supabaseRest<AlbumRow[]>(id?`music_albums?id=eq.${enc(id)}`:"music_albums",{method:id?"PATCH":"POST",body:JSON.stringify(body)});return mapAlbum(rows[0]);
}
export async function saveMusicGenre(input:Record<string,unknown>) {
 const id=clean(input.id,64),name=clean(input.name,80),slug=slugify(clean(input.slug||name,80));
 if(name.length<2||!slug)throw new Error("Informe nome e slug válidos para o estilo.");
 const status=cleanStatus(input.status);
 const body={name,slug,description:String(input.description??"").slice(0,1200),image_url:clean(input.imageUrl,1000),status};
 const path=id ? "music_genres?id=eq."+enc(id) : "music_genres";
 const rows=await supabaseRest<GenreRow[]>(path,{method:id?"PATCH":"POST",body:JSON.stringify(body)});
 return mapGenre(rows[0]);
}
export async function deleteMusicGenre(id:string) {
 if(!musicUuid.test(id))throw new Error("Identificador inválido.");
 await supabaseRest("music_genres?id=eq."+enc(id),{method:"DELETE"});
 return {ok:true};
}
export async function saveMusicTrack(input:Record<string,unknown>) {
 const id=clean(input.id,64),albumId=clean(input.albumId,64),title=clean(input.title,160),trackNumber=Math.max(1,Math.floor(Number(input.trackNumber)||1)),audioUrl=clean(input.audioUrl,1200);if(!albumId||title.length<1||!audioUrl)throw new Error("Informe álbum, título e arquivo de áudio.");
 const status=cleanStatus(input.status);let slug=slugify(clean(input.slug||title,160));if(!slug)throw new Error("Informe um título válido para gerar a URL da música.");
 const conflicts=await supabaseRest<Array<{id:string}>>(`music_tracks?select=id&album_id=eq.${enc(albumId)}&slug=eq.${enc(slug)}${id?`&id=neq.${enc(id)}`:""}`);
 if(conflicts.length){let suffix=2;const base=slug;while((await supabaseRest<Array<{id:string}>>(`music_tracks?select=id&album_id=eq.${enc(albumId)}&slug=eq.${enc(`${base}-${suffix}`)}${id?`&id=neq.${enc(id)}`:""}`)).length)suffix++;slug=`${base}-${suffix}`;}
 const body={album_id:albumId,slug,title,track_number:trackNumber,duration_seconds:Math.max(0,Math.floor(Number(input.durationSeconds)||0))||null,audio_url:audioUrl,status};
 const rows=await supabaseRest<TrackRow[]>(id?`music_tracks?id=eq.${enc(id)}`:"music_tracks",{method:id?"PATCH":"POST",body:JSON.stringify(body)});return mapTrack(rows[0]);
}
const musicUuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function musicObjectPath(value:string) {
 if(!value)return null;
 try {
  const url=new URL(value),base=new URL(blogConfig.supabaseUrl);
  const prefix="/storage/v1/object/public/music-media/";
  if(url.origin!==base.origin||!url.pathname.startsWith(prefix)||url.search||url.hash)return null;
  const path=url.pathname.slice(prefix.length).split("/").map(decodeURIComponent);
  if(!path.length||path.some(part=>!part||part==="."||part===".."||part.includes("\\")))return null;
  return path.join("/");
 } catch { return null; }
}
async function removeMusicObjects(urls:string[]) {
 const paths=[...new Set(urls.map(musicObjectPath).filter((path):path is string=>Boolean(path)))];
 const r2Keys=[...new Set(urls.map(r2ObjectKeyFromPublicUrl).filter((key):key is string=>Boolean(key)))];
 let removedFiles=0,failedFiles=0;
 for(let i=0;i<paths.length;i+=10){
  const results=await Promise.allSettled(paths.slice(i,i+10).map(path=>supabaseStorage(`object/music-media/${path.split("/").map(encodeURIComponent).join("/")}`,{method:"DELETE"})));
  removedFiles+=results.filter(result=>result.status==="fulfilled").length;
  failedFiles+=results.filter(result=>result.status==="rejected").length;
 }
 for(let i=0;i<r2Keys.length;i+=10){
  const results=await Promise.allSettled(r2Keys.slice(i,i+10).map(deleteR2Object));
  removedFiles+=results.filter(result=>result.status==="fulfilled").length;
  failedFiles+=results.filter(result=>result.status==="rejected").length;
 }
 return {removedFiles,failedFiles};
}
export async function deleteMusicRecord(kind:string,id:string) {
 if(!musicUuid.test(id))throw new Error("Identificador inválido.");
 const encodedId=enc(id);let assetUrls:string[]=[];let deletePath="";
 if(kind==="track"){
  const rows=await supabaseRest<Array<{id:string;audio_url:string}>>(`music_tracks?select=id,audio_url&id=eq.${encodedId}`);
  if(!rows.length)throw new Error("Faixa não encontrada.");
  assetUrls=[rows[0].audio_url];deletePath=`music_tracks?id=eq.${encodedId}`;
 }else if(kind==="album"){
  const rows=await supabaseRest<Array<{id:string;cover_url:string}>>(`music_albums?select=id,cover_url&id=eq.${encodedId}`);
  if(!rows.length)throw new Error("Álbum não encontrado.");
  const tracks=await supabaseRest<Array<{audio_url:string}>>(`music_tracks?select=audio_url&album_id=eq.${encodedId}`);
  assetUrls=[rows[0].cover_url,...tracks.map(track=>track.audio_url)];deletePath=`music_albums?id=eq.${encodedId}`;
 }else if(kind==="artist"){
  const rows=await supabaseRest<Array<{id:string;photo_url:string;cover_url:string}>>(`music_artists?select=id,photo_url,cover_url&id=eq.${encodedId}`);
  if(!rows.length)throw new Error("Artista não encontrado.");
  const albums=await supabaseRest<Array<{id:string;cover_url:string}>>(`music_albums?select=id,cover_url&artist_id=eq.${encodedId}`);
  const tracks=albums.length?await supabaseRest<Array<{audio_url:string}>>(`music_tracks?select=audio_url&album_id=in.(${albums.map(album=>album.id).join(",")})`):[];
  assetUrls=[rows[0].photo_url,rows[0].cover_url,...albums.map(album=>album.cover_url),...tracks.map(track=>track.audio_url)];deletePath=`music_artists?id=eq.${encodedId}`;
 }else throw new Error("Tipo de cadastro inválido.");
 await supabaseRest(deletePath,{method:"DELETE"});
 const cleanup=await removeMusicObjects(assetUrls);
 return {ok:true,...cleanup};
}
export async function createMusicUploadUrl(kind:string,mime:string,size:number) {
 await assertAdminApi();const isAudio=kind==="audio";const allowed=isAudio?["audio/mpeg","audio/mp3"]:["image/jpeg","image/png","image/webp"];
 const max=isAudio?100*1024*1024:8*1024*1024;if(!allowed.includes(mime))throw new Error(isAudio?"Envie um arquivo MP3.":"Envie JPG, PNG ou WebP.");if(!Number.isFinite(size)||size<1||size>max)throw new Error(`O arquivo deve ter até ${Math.round(max/1024/1024)} MB.`);
 const ext=isAudio?"mp3":mime.split("/")[1].replace("jpeg","jpg"),path=`${isAudio?"tracks":"artwork"}/${new Date().getUTCFullYear()}/${randomUUID()}.${ext}`;
 if(isAudio) return {uploadUrl:createR2UploadUrl(path,mime),publicUrl:getR2PublicUrl(path)};
 const response=await supabaseStorage(`object/upload/sign/music-media/${path}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({upsert:false})});const data=await response.json() as {token?:string};if(!data.token)throw new Error("Não foi possível preparar o upload.");
 return {uploadUrl:`${blogConfig.supabaseUrl}/storage/v1/object/upload/sign/music-media/${path}?token=${encodeURIComponent(data.token)}`,publicUrl:`${blogConfig.supabaseUrl}/storage/v1/object/public/music-media/${path}`};
}

