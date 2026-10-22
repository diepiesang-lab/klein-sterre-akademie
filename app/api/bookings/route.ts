import { db, databaseConfigured } from "@/lib/db";
export const dynamic="force-dynamic";
export async function POST(request:Request){
 if(!databaseConfigured())return Response.json({error:"Die databasis is nog nie gekoppel nie."},{status:503});
 try{
  const body=await request.json();
  const parentId=String(body.parentId||"").trim(),slotId=String(body.slotId||"").trim();
  if(!parentId||!slotId)return Response.json({error:"Kies asseblief ’n sessieslot."},{status:400});
  const data=await db.rpc("create_booking",{p_parent_id:parentId,p_slot_id:slotId}) as {bookingId?:string};
  return Response.json({ok:true,bookingId:data?.bookingId});
 }catch(error){
  const message=error instanceof Error?error.message:"";
  if(message.includes("slot_not_found"))return Response.json({error:"Die gekose sessie bestaan nie meer nie."},{status:404});
  if(message.includes("parent_not_found"))return Response.json({error:"Registrasie nie gevind nie. Registreer asseblief weer."},{status:404});
  if(message.includes("capacity_exceeded"))return Response.json({error:"Daar is nie genoeg plekke oor in daardie sessie nie."},{status:409});
  console.error(error);return Response.json({error:"Ons kon nie die bespreekversoek stoor nie. Probeer asseblief weer."},{status:500});
 }
}