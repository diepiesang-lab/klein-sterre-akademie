import { db, databaseConfigured } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export const dynamic="force-dynamic";
export async function POST(request:Request){
 if(!databaseConfigured())return Response.json({error:"Die databasis is nog nie gekoppel nie."},{status:503});
 const supabase=await createSupabaseServerClient();
 const {data,error}=await supabase.auth.getUser();
 const user=data.user;
 if(error||!user?.email)return Response.json({error:"Meld asseblief aan met jou e-posskakel."},{status:401});
 try{
  const body=await request.json(),slotId=String(body.slotId||"").trim();
  if(!slotId)return Response.json({error:"Kies asseblief ’n sessieslot."},{status:400});
  const parents=await db.get("parents","select=id&auth_user_id=eq."+encodeURIComponent(user.id)) as Array<{id:string}>;
  if(!parents.length)return Response.json({error:"Voltooi eers jou ouerregistrasie."},{status:409});
  const result=await db.rpc("create_booking",{p_parent_id:parents[0].id,p_auth_user_id:user.id,p_slot_id:slotId}) as {bookingId?:string};
  return Response.json({ok:true,bookingId:result?.bookingId});
 }catch(error){
  const message=error instanceof Error?error.message:"";
  if(message.includes("slot_not_found"))return Response.json({error:"Die gekose sessie bestaan nie meer nie."},{status:404});
  if(message.includes("parent_not_found"))return Response.json({error:"Voltooi eers jou ouerregistrasie."},{status:409});
  if(message.includes("capacity_exceeded"))return Response.json({error:"Daar is nie genoeg plekke oor in daardie sessie nie."},{status:409});
  console.error(error);return Response.json({error:"Ons kon nie die bespreekversoek stoor nie. Probeer asseblief weer."},{status:500});
 }
}