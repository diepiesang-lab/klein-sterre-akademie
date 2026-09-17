import { adminAllowed, databaseConfigured, db } from "@/lib/db";
export const dynamic="force-dynamic";
const auth=(r:Request)=>adminAllowed(r.headers.get("x-admin-pin"));
export async function GET(request:Request){
 if(!databaseConfigured())return Response.json({configured:false});
 if(!auth(request))return Response.json({error:"Unauthorized"},{status:401});
 try{
  const [parents,children,slots,bookings]=await Promise.all([
   db.get("parents","select=id,first_name,last_name,contact_number,child_count,created_at&order=created_at.desc"),
   db.get("children","select=id,parent_id,first_name,last_name,age"),
   db.get("slots","select=id,session_date,session_time,capacity&order=session_date.asc,session_time.asc"),
   db.get("bookings","select=id,parent_id,slot_id,child_count,status,created_at,confirmed_at&order=created_at.desc")
  ]);return Response.json({configured:true,parents,children,slots,bookings});
 }catch(e){console.error(e);return Response.json({error:"Kon admin-data nie laai nie."},{status:500});}
}
export async function POST(request:Request){
 if(!databaseConfigured())return Response.json({error:"Die databasis is nog nie gekoppel nie."},{status:503});
 if(!auth(request))return Response.json({error:"Unauthorized"},{status:401});
 try{
  const body=await request.json();const action=body.action;
  if(action==="create_slot"){
   const date=String(body.date||"").trim(),time=String(body.time||"").trim(),capacity=Number(body.capacity||3);
   if(!date||!time||!Number.isInteger(capacity)||capacity<1||capacity>20)return Response.json({error:"Ongeldige sessieslot."},{status:400});
   await db.insert("slots",{session_date:date,session_time:time,capacity});return Response.json({ok:true});
  }
  if(action==="delete_slot"){
   const id=String(body.slotId||"").trim();if(!id)return Response.json({error:"Slot ontbreek."},{status:400});
   const b=await db.get("bookings",`select=id&slot_id=eq.${encodeURIComponent(id)}&status=in.(pending,confirmed)`) as Array<{id:string}>;
   if(b.length)return Response.json({error:"Jy kan nie 'n slot met aktiewe besprekings verwyder nie."},{status:409});
   await db.delete("slots",`id=eq.${encodeURIComponent(id)}`);return Response.json({ok:true});
  }
  if(action==="booking_status"){
   const id=String(body.bookingId||"").trim(),status=String(body.status||"").trim();
   if(!id||!["confirmed","rejected","cancelled"].includes(status))return Response.json({error:"Ongeldige status."},{status:400});
   const rows=await db.get("bookings",`select=id,slot_id,child_count,status&id=eq.${encodeURIComponent(id)}`) as Array<{id:string;slot_id:string;child_count:number;status:string}>;
   if(!rows.length)return Response.json({error:"Bespreking nie gevind nie."},{status:404});
   if(status==="confirmed"){
    const slots=await db.get("slots",`select=capacity&id=eq.${encodeURIComponent(rows[0].slot_id)}`) as Array<{capacity:number}>;
    const active=await db.get("bookings",`select=id,child_count&slot_id=eq.${encodeURIComponent(rows[0].slot_id)}&status=eq.confirmed`) as Array<{id:string;child_count:number}>;
    const used=active.reduce((n,b)=>n+Number(b.child_count||0),0);
    if(slots.length&&used+Number(rows[0].child_count)>slots[0].capacity)return Response.json({error:"Daar is nie genoeg plek vir al die kinders in hierdie sessie nie."},{status:409});
    await db.update("bookings",`id=eq.${encodeURIComponent(id)}`,{status,confirmed_at:new Date().toISOString()});
   }else await db.update("bookings",`id=eq.${encodeURIComponent(id)}`,{status});
   return Response.json({ok:true});
  }
  return Response.json({error:"Onbekende admin-aksie."},{status:400});
 }catch(e){console.error(e);return Response.json({error:"Admin-aksie kon nie voltooi word nie."},{status:500});}
}
