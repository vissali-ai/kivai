import { supabaseRest, supabaseStorage } from "@/lib/blog/supabase";
export const runtime="nodejs";
export const maxDuration=240;
type Asset={project_id:string;user_id:string;storage_path:string;expires_at:string};
export async function GET(request:Request){
 const secret=process.env.CRON_SECRET??"";
 if(!secret||request.headers.get("authorization")!==`Bearer ${secret}`)
  return Response.json({error:"Unauthorized"},{status:401});
 try{
  const cutoff=encodeURIComponent(new Date().toISOString());
  const assets=await supabaseRest<Asset[]>(`video_study_audio?select=project_id,user_id,storage_path,expires_at&expires_at=lt.${cutoff}&limit=50`);
  let removed=0;
  for(const asset of assets){
   try{
    await supabaseStorage(`object/video-study-audio/${asset.storage_path}`,{method:"DELETE"});
    await supabaseRest(`video_study_audio?project_id=eq.${asset.project_id}&user_id=eq.${asset.user_id}`,{method:"DELETE"});
    await supabaseRest("video_study_admin_audit",{method:"POST",body:JSON.stringify({action:"cleanup_expired",subject_user_id:asset.user_id,project_id:asset.project_id})});
    removed++;
   }catch{console.warn("[video-study-retention] failed to remove an expired asset");}
  }
  return Response.json({ok:true,removed,hasMore:assets.length===50},{headers:{"Cache-Control":"no-store"}});
 }catch{console.warn("[video-study-retention] job failed");return Response.json({error:"Cleanup failed"},{status:503});}
}
