import { db, databaseConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

function clean(value: unknown) { return String(value ?? "").trim(); }

export async function POST(request: Request) {
  if (!databaseConfigured()) return Response.json({ error: "Die databasis is nog nie gekoppel nie." }, { status: 503 });
  try {
    const body = await request.json();
    const firstName=clean(body.parent?.firstName), lastName=clean(body.parent?.lastName), contactNumber=clean(body.parent?.contactNumber), slotId=clean(body.slotId);
    const children=Array.isArray(body.children)?body.children:[];
    if(!firstName||!lastName||!contactNumber)return Response.json({error:"Vul die ouer/voog se naam, van en kontaknommer in."},{status:400});
    if(children.length<1||children.length>6)return Response.json({error:"Kies tussen 1 en 6 kinders."},{status:400});
    if(!slotId)return Response.json({error:"Kies asseblief 'n sessieslot."},{status:400});
    const normalizedChildren=children.map((child:{firstName?:unknown;lastName?:unknown;age?:unknown})=>({first_name:clean(child.firstName),last_name:clean(child.lastName),age:Number(child.age)}));
    if(normalizedChildren.some(c=>!c.first_name||!c.last_name||!Number.isInteger(c.age)||c.age<3||c.age>18))return Response.json({error:"Elke kind moet 'n naam, van en ouderdom tussen 3 en 18 hê."},{status:400});
    const slots=await db.get("slots",`select=id,capacity&id=eq.${encodeURIComponent(slotId)}`) as Array<{id:string;capacity:number}>;
    if(!slots.length)return Response.json({error:"Die gekose sessie bestaan nie meer nie."},{status:404});
    const bookings=await db.get("bookings",`select=id,child_count&slot_id=eq.${encodeURIComponent(slotId)}&status=in.(pending,confirmed)`) as Array<{id:string;child_count:number}>;
    const used=bookings.reduce((sum,b)=>sum+Number(b.child_count||0),0);
    if(used+normalizedChildren.length>slots[0].capacity)return Response.json({error:`Daar is net ${Math.max(0,slots[0].capacity-used)} plekke oor in daardie sessie.`},{status:409});
    const parentRows=await db.insert("parents",{first_name:firstName,last_name:lastName,contact_number:contactNumber,child_count:normalizedChildren.length}) as Array<{id:string}>;
    const parentId=parentRows[0]?.id;if(!parentId)throw new Error("Parent could not be created.");
    await db.insert("children",normalizedChildren.map(child=>({...child,parent_id:parentId})));
    const bookingRows=await db.insert("bookings",{parent_id:parentId,slot_id:slotId,child_count:normalizedChildren.length,status:"pending"}) as Array<{id:string}>;
    return Response.json({ok:true,bookingId:bookingRows[0]?.id,message:"Bespreking ontvang. Dit wag nou vir admin-bevestiging."});
  }catch(error){console.error(error);return Response.json({error:"Ons kon die registrasie nie voltooi nie. Probeer asseblief weer."},{status:500});}
}
