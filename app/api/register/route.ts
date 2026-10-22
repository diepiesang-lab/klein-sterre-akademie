import { db, databaseConfigured } from "@/lib/db";
export const dynamic="force-dynamic";
const clean=(v:unknown)=>String(v??"").trim();
export async function POST(request:Request){
 if(!databaseConfigured())return Response.json({error:"Die databasis is nog nie gekoppel nie."},{status:503});
 try{
  const body=await request.json();
  const firstName=clean(body.parent?.firstName),lastName=clean(body.parent?.lastName),email=clean(body.parent?.email).toLowerCase(),contactNumber=clean(body.parent?.contactNumber);
  const children=Array.isArray(body.children)?body.children:[];
  if(!firstName||!lastName||!contactNumber)return Response.json({error:"Vul die ouer/voog se naam, van en kontaknommer in."},{status:400});
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return Response.json({error:"Vul asseblief ’n geldige e-posadres in."},{status:400});
  if(children.length<1||children.length>6)return Response.json({error:"Kies tussen 1 en 6 kinders."},{status:400});
  const normalized=children.map((c:{firstName?:unknown;lastName?:unknown;age?:unknown})=>({first_name:clean(c.firstName),last_name:clean(c.lastName),age:Number(c.age)}));
  if(normalized.some(c=>!c.first_name||!c.last_name||!Number.isInteger(c.age)||c.age<3||c.age>18))return Response.json({error:"Elke kind moet ’n naam, van en ouderdom tussen 3 en 18 hê."},{status:400});
  const data=await db.rpc("create_parent_registration",{p_parent:{first_name:firstName,last_name:lastName,email,contact_number:contactNumber},p_children:normalized}) as {parentId?:string};
  return Response.json({ok:true,parentId:data?.parentId});
 }catch(error){
  const message=error instanceof Error?error.message:"";
  if(message.includes("email_already_registered"))return Response.json({error:"Hierdie e-posadres is reeds geregistreer. Kontak asseblief die akademie."},{status:409});
  if(message.includes("invalid_registration"))return Response.json({error:"Kontroleer asseblief die registrasiebesonderhede."},{status:400});
  console.error(error);return Response.json({error:"Ons kon nie die registrasie stoor nie. Probeer asseblief weer."},{status:500});
 }
}