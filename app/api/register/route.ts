import { db, databaseConfigured } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export const dynamic="force-dynamic";
const clean=(v:unknown)=>String(v??"").trim();
type NormalizedChild={first_name:string;last_name:string;age:number};

async function getVerifiedUser() {
 const supabase=await createSupabaseServerClient();
 const {data,error}=await supabase.auth.getUser();
 if(error||!data.user?.email)return null;
 return data.user;
}

export async function GET() {
 if(!databaseConfigured())return Response.json({error:"Die databasis is nog nie gekoppel nie."},{status:503});
 const user=await getVerifiedUser();
 if(!user)return Response.json({error:"Meld asseblief aan met jou e-posskakel."},{status:401});
 try {
  const parents=await db.get("parents","select=id,first_name,last_name,email,contact_number,child_count&auth_user_id=eq."+encodeURIComponent(user.id)) as Array<{id:string;first_name:string;last_name:string;email:string;contact_number:string;child_count:number}>;
  if(!parents.length)return Response.json({registered:false,email:user.email});
  const children=await db.get("children","select=id,first_name,last_name,age&parent_id=eq."+encodeURIComponent(parents[0].id));
  return Response.json({registered:true,parent:parents[0],children});
 }catch(error){console.error(error);return Response.json({error:"Registrasiebesonderhede kon nie laai nie."},{status:500});}
}

export async function POST(request:Request) {
 if(!databaseConfigured())return Response.json({error:"Die databasis is nog nie gekoppel nie."},{status:503});
 const user=await getVerifiedUser();
 if(!user)return Response.json({error:"Meld asseblief aan met jou e-posskakel."},{status:401});
 try {
  const body=await request.json();
  const firstName=clean(body.parent?.firstName),lastName=clean(body.parent?.lastName),contactNumber=clean(body.parent?.contactNumber);
  const children=Array.isArray(body.children)?body.children:[];
  if(!firstName||!lastName||!contactNumber)return Response.json({error:"Vul die ouer/voog se naam, van en kontaknommer in."},{status:400});
  if(children.length<1||children.length>6)return Response.json({error:"Kies tussen 1 en 6 kinders."},{status:400});
  const normalized:NormalizedChild[]=children.map((c:{firstName?:unknown;lastName?:unknown;age?:unknown}):NormalizedChild=>({first_name:clean(c.firstName),last_name:clean(c.lastName),age:Number(c.age)}));
  if(normalized.some((c:NormalizedChild)=>!c.first_name||!c.last_name||!Number.isInteger(c.age)||c.age<3||c.age>18))return Response.json({error:"Elke kind moet ’n naam, van en ouderdom tussen 3 en 18 hê."},{status:400});
  const data=await db.rpc("create_parent_registration",{p_auth_user_id:user.id,p_parent:{first_name:firstName,last_name:lastName,email:user.email,contact_number:contactNumber},p_children:normalized}) as {parentId?:string};
  return Response.json({ok:true,parentId:data?.parentId});
 }catch(error) {
  const message=error instanceof Error?error.message:"";
  if(message.includes("email_already_registered"))return Response.json({error:"Hierdie e-posadres is reeds aan ’n ander rekening gekoppel."},{status:409});
  if(message.includes("invalid_registration"))return Response.json({error:"Kontroleer asseblief die registrasiebesonderhede."},{status:400});
  console.error(error);return Response.json({error:"Ons kon nie die registrasie stoor nie. Probeer asseblief weer."},{status:500});
 }
}