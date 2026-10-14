import { db, databaseConfigured } from "@/lib/db";
export const dynamic="force-dynamic";
const clean=(v:unknown)=>String(v??"").trim();
export async function POST(request:Request){
 if(!databaseConfigured())return Response.json({error:"Die databasis is nog nie gekoppel nie."},{status:503});
 try{
  const body=await request.json();
  const firstName=clean(body.parent?.firstName),lastName=clean(body.parent?.lastName),contactNumber=clean(body.parent?.contactNumber),slotId=clean(body.slotId);
  const children=Array.isArray(body.children)?body.children:[];
  if(!firstName||!lastName||!contactNumber)return Response.json({error:"Vul die ouer/voog se naam, van en kontaknommer in."},{status:400});
  if(children.length<1||children.length>6)return Response.json({error:"Kies tussen 1 en 6 kinders."},{status:400});
  if(!slotId)return Response.json({error:"Kies asseblief 'n sessieslot."},{status:400});
  const normalized=children.map((c:{firstName?:unknown;lastName?:unknown;age?:unknown})=>({first_name:clean(c.firstName),last_name:clean(c.lastName),age:Number(c.age)}));
  if(normalized.some(c=>!c.first_name||!c.last_name||!Number.isInteger(c.age)||c.age<3||c.age>18))return Response.json({error:"Elke kind moet 'n naam, van en ouderdom tussen 3 en 18 hê."},{status:400});
  try {
   const data=await db.rpc("create_booking",{p_parent:{first_name:firstName,last_name:lastName,contact_number:contactNumber},p_children:normalized,p_slot_id:slotId}) as {bookingId?:string};
   return Response.json({ok:true,bookingId:data?.bookingId,message:"Bespreekversoek ontvang en wag vir admin-bevestiging."});
  }catch(error){
   const message=error instanceof Error?error.message:"";
   if(message.includes("slot_not_found"))return Response.json({error:"Die gekose sessie bestaan nie meer nie."},{status:404});
   if(message.includes("capacity_exceeded"))return Response.json({error:"Daar is nie genoeg plekke oor in daardie sessie nie."},{status:409});
   if(message.includes("invalid_booking"))return Response.json({error:"Kontroleer asseblief die registrasiebesonderhede."},{status:400});
   throw error;
  }
 }catch(error){console.error(error);return Response.json({error:"Ons kon die registrasie nie voltooi nie. Probeer asseblief weer."},{status:500});}
}