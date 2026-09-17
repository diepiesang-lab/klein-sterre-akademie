"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Slot = { id:string; date:string; time:string; capacity:number; booked:number; available:number };
type Child = { firstName:string; lastName:string; age:string };
type AdminData = {
  parents:Array<{id:string;first_name:string;last_name:string;contact_number:string;child_count:number;created_at:string}>;
  children:Array<{id:string;parent_id:string;first_name:string;last_name:string;age:number}>;
  slots:Array<{id:string;session_date:string;session_time:string;capacity:number}>;
  bookings:Array<{id:string;parent_id:string;slot_id:string;status:string;created_at:string;confirmed_at?:string}>;
};

const emptyChild=():Child=>({firstName:"",lastName:"",age:""});
function monthDays(year:number,month:number){const first=new Date(year,month,1),total=new Date(year,month+1,0).getDate();return{start:(first.getDay()+6)%7,total};}

export default function Home(){
  const now=new Date();
  const [month,setMonth]=useState(new Date(now.getFullYear(),now.getMonth(),1));
  const [slots,setSlots]=useState<Slot[]>([]);
  const [selected,setSelected]=useState<Slot|null>(null);
  const [children,setChildren]=useState<Child[]>([emptyChild()]);
  const [parent,setParent]=useState({firstName:"",lastName:"",contactNumber:""});
  const [tab,setTab]=useState<"book"|"register"|"admin">("book");
  const [adminPin,setAdminPin]=useState("");
  const [admin,setAdmin]=useState<AdminData|null>(null);
  const [adminTab,setAdminTab]=useState<"pending"|"confirmed"|"parents"|"sessions">("pending");
  const [notice,setNotice]=useState("");
  const [loading,setLoading]=useState(false);
  const [newDate,setNewDate]=useState("");
  const [newTime,setNewTime]=useState("15:00");

  async function loadSlots(){try{const r=await fetch("/api/slots");const d=await r.json();if(d.slots)setSlots(d.slots);else if(d.error)setNotice(d.error)}catch{setNotice("Kon nie sessies laai nie.")}}
  useEffect(()=>{loadSlots();const saved=sessionStorage.getItem("ksa-admin-pin");if(saved){setAdminPin(saved);loadAdmin(saved)}},[]);

  async function loadAdmin(pin=adminPin){if(!pin)return;setLoading(true);try{const r=await fetch("/api/admin",{headers:{"x-admin-pin":pin}});const d=await r.json();if(!r.ok)throw new Error(d.error);setAdmin(d);sessionStorage.setItem("ksa-admin-pin",pin);setTab("admin")}catch{sessionStorage.removeItem("ksa-admin-pin");setAdmin(null);setNotice("Admin PIN is verkeerd of die databasis is nie gereed nie.")}finally{setLoading(false)}}
  function login(){const pin=prompt("Admin PIN:");if(pin)loadAdmin(pin)}

  const {start,total}=monthDays(month.getFullYear(),month.getMonth());
  const cells=useMemo(()=>Array.from({length:start+total},(_,i)=>i<start?null:i-start+1),[start,total]);
  const visible=slots.filter(s=>{const d=new Date(s.date+"T00:00:00");return d.getFullYear()===month.getFullYear()&&d.getMonth()===month.getMonth()});
  const monthName=month.toLocaleDateString("af-ZA",{month:"long",year:"numeric"});

  function changeChildren(value:number){setChildren(Array.from({length:value},(_,i)=>children[i]||emptyChild()));}
  function updateChild(index:number,key:keyof Child,value:string){setChildren(prev=>prev.map((c,i)=>i===index?{...c,[key]:value}:c));}

  async function register(e:FormEvent){e.preventDefault();if(!selected)return;setLoading(true);setNotice("");try{const r=await fetch("/api/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({parent,children,slotId:selected.id})});const d=await r.json();if(!r.ok)throw new Error(d.error);setNotice("✅ Jou registrasie en bespreekversoek is ontvang. Dit verskyn nou onder Pending Confirmations vir die akademie.");setSelected(null);setParent({firstName:"",lastName:"",contactNumber:""});setChildren([emptyChild()]);await loadSlots();setTab("book")}catch(error){setNotice(error instanceof Error?error.message:"Registrasie kon nie voltooi word nie.")}finally{setLoading(false)}}

  async function adminAction(body:Record<string,unknown>){setLoading(true);try{const r=await fetch("/api/admin",{method:"POST",headers:{"Content-Type":"application/json","x-admin-pin":adminPin},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw new Error(d.error);await loadAdmin();await loadSlots();setNotice("Wysiging gestoor.")}catch(error){setNotice(error instanceof Error?error.message:"Admin-aksie kon nie voltooi word nie.")}finally{setLoading(false)}}

  const parentMap=new Map((admin?.parents||[]).map(p=>[p.id,p]));
  const childMap=new Map((admin?.children||[]).map(c=>[c.parent_id,c]));
  const slotMap=new Map((admin?.slots||[]).map(s=>[s.id,s]));
  const pending=admin?.bookings.filter(b=>b.status==="pending")||[];
  const confirmed=admin?.bookings.filter(b=>b.status==="confirmed")||[];

  return <div className="page">
    <header className="top"><nav className="nav"><div className="brand"><div className="ball">🏏</div><div><strong>Klein Sterre Akademie</strong><span>Krieketontwikkeling vir jong sterre</span></div></div><button className="adminBtn" onClick={admin?()=>setTab(tab==="admin"?"book":"admin"):login}>{admin?(tab==="admin"?"Oueraansig":"Admin"):"Admin"}</button></nav><div className="hero"><div className="eyebrow">Krieket Akademie</div><h1>Elke Ster Begin Iewers.</h1><p>Registreer as ’n ouer/voog, voeg jou kinders by en stuur ’n krieketsessie-versoek. Die akademie bevestig elke bespreking.</p></div></header>
    <main className="content">
      <div className="tabs"><button className={`tab ${tab==="book"?"active":""}`} onClick={()=>setTab("book")}>📅 Kies sessie</button><button className={`tab ${tab==="register"?"active":""}`} onClick={()=>setTab("register")}>👨‍👩‍👧 Registreer</button>{admin&&<button className={`tab ${tab==="admin"?"active":""}`} onClick={()=>setTab("admin")}>⚙️ Admin {pending.length>0&&<span className="count">{pending.length}</span>}</button>}</div>
      {notice&&<div className="notice">{notice}</div>}

      {tab==="book"&&<div className="grid"><section className="card"><div className="adminHeader"><div><h2>Sessiekalender</h2><div className="muted">Maksimum 3 kinders per sessie • R150 per sessie</div></div><div><button className="secondary" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))}>‹</button> <button className="secondary" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))}>›</button></div></div><h3 className="capitalize">{monthName}</h3><div className="calendar">{["Ma","Di","Wo","Do","Vr","Sa","So"].map(d=><div className="dayHead" key={d}>{d}</div>)}{cells.map((day,i)=>{if(!day)return <div key={i}/>;const iso=`${month.getFullYear()}-${String(month.getMonth()+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;const ds=visible.filter(s=>s.date===iso);return <div className="day" key={iso}><div className="date">{day}</div>{ds.map(s=><button key={s.id} className={`slot ${s.available===0?"full":s.available===1?"warn":""} ${selected?.id===s.id?"selected":""}`} disabled={s.available===0} onClick={()=>{setSelected(s);setTab("register")}}><strong>{s.time}</strong><br/>{s.available===0?"Vol":`${s.available} plek${s.available===1?"":"ke"} oor`}</button>)}</div>})}</div></section><aside className="card"><h2>Hoe dit werk</h2><div className="steps"><div><b>1</b><span>Kies ’n beskikbare sessie.</span></div><div><b>2</b><span>Registreer jou naam, van en kontaknommer.</span></div><div><b>3</b><span>Kies hoeveel kinders jy registreer en vul elke kind se naam, van en ouderdom in.</span></div><div><b>4</b><span>Stuur die versoek. Dit bly <strong>Pending</strong> totdat die akademie dit bevestig.</span></div></div><button className="primary wide" onClick={()=>setTab("register")}>Registreer ’n ouer/voog</button></aside></div>}

      {tab==="register"&&<section className="card formCard"><div className="adminHeader"><div><h2>Ouer / voog registrasie</h2><div className="muted">Alle besprekings word eers as pending confirmation gestuur.</div></div>{selected&&<span className="selectedSession">{selected.date} • {selected.time}</span>}</div><form className="form" onSubmit={register}><div className="formGrid"><label>Naam<input value={parent.firstName} onChange={e=>setParent({...parent,firstName:e.target.value})} required placeholder="Ouer se naam"/></label><label>Van<input value={parent.lastName} onChange={e=>setParent({...parent,lastName:e.target.value})} required placeholder="Ouer se van"/></label></div><label>Kontaknommer<input value={parent.contactNumber} onChange={e=>setParent({...parent,contactNumber:e.target.value})} required placeholder="WhatsApp / selfoonnommer"/></label><label>Hoeveel kinders wil jy registreer?<select value={children.length} onChange={e=>changeChildren(Number(e.target.value))}>{[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n} {n===1?"kind":"kinders"}</option>)}</select></label><div className="childrenGrid">{children.map((child,index)=><div className="childBox" key={index}><h3>Kind {index+1}</h3><div className="formGrid"><label>Naam<input value={child.firstName} onChange={e=>updateChild(index,"firstName",e.target.value)} required/></label><label>Van<input value={child.lastName} onChange={e=>updateChild(index,"lastName",e.target.value)} required/></label></div><label>Ouderdom<input type="number" min="3" max="18" value={child.age} onChange={e=>updateChild(index,"age",e.target.value)} required/></label></div>)}</div><label>Kies sessie<select value={selected?.id||""} onChange={e=>setSelected(slots.find(s=>s.id===e.target.value)||null)} required><option value="">Kies ’n beskikbare sessie</option>{slots.filter(s=>s.available>0).map(s=><option key={s.id} value={s.id}>{s.date} • {s.time} • {s.available} plekke oor</option>)}</select></label><button className="primary" disabled={loading}>{loading?"Stuur...":"Stuur bespreekversoek • R150 per sessie"}</button></form></section>}

      {tab==="admin"&&admin&&<div className="admin"><section className="card"><div className="adminHeader"><div><h2>Admin-beheer</h2><div className="muted">Bevestig bespreekversoeke voordat hulle finaal aanvaar word.</div></div><button className="secondary" onClick={()=>loadAdmin()}>{loading?"Laai...":"Verfris"}</button></div><div className="adminTabs"><button className={adminTab==="pending"?"active":""} onClick={()=>setAdminTab("pending")}>Pending Confirmations {pending.length>0&&<span className="count">{pending.length}</span>}</button><button className={adminTab==="confirmed"?"active":""} onClick={()=>setAdminTab("confirmed")}>Bevestig {confirmed.length}</button><button className={adminTab==="parents"?"active":""} onClick={()=>setAdminTab("parents")}>Geregistreerde ouers</button><button className={adminTab==="sessions"?"active":""} onClick={()=>setAdminTab("sessions")}>Sessies</button></div></section>

        {adminTab==="pending"&&<section className="card"><h2>Pending Confirmations</h2>{pending.length===0?<p className="muted">Geen wagende besprekings nie.</p>:pending.map(b=>{const p=parentMap.get(b.parent_id);const s=slotMap.get(b.slot_id);const kids=admin?.children.filter(c=>c.parent_id===b.parent_id)||[];return <div className="bookingRow" key={b.id}><div><strong>{p?.first_name} {p?.last_name}</strong><div className="muted">{p?.contact_number} • {s?.session_date} • {String(s?.session_time||"").slice(0,5)}</div><div className="kids">{kids.map(k=><span key={k.id}>{k.first_name} {k.last_name} ({k.age})</span>)}</div></div><div className="actions"><button className="primary" onClick={()=>adminAction({action:"booking_status",bookingId:b.id,status:"confirmed"})}>✓ Bevestig</button><button className="danger" onClick={()=>adminAction({action:"booking_status",bookingId:b.id,status:"rejected"})}>Verwerp</button></div></div>})}</section>}
        {adminTab==="confirmed"&&<section className="card"><h2>Bevestigde besprekings</h2>{confirmed.length===0?<p className="muted">Geen bevestigde besprekings nie.</p>:confirmed.map(b=>{const p=parentMap.get(b.parent_id);const s=slotMap.get(b.slot_id);return <div className="slotRow" key={b.id}><div><strong>{p?.first_name} {p?.last_name}</strong><div className="muted">{s?.session_date} • {String(s?.session_time||"").slice(0,5)} • {p?.contact_number}</div></div><button className="secondary" onClick={()=>adminAction({action:"booking_status",bookingId:b.id,status:"cancelled"})}>Kanselleer</button></div>})}</section>}
        {adminTab==="parents"&&<section className="card"><h2>Geregistreerde ouers</h2>{!admin?.parents.length?<p className="muted">Geen ouers geregistreer nie.</p>:admin.parents.map(p=><div className="slotRow" key={p.id}><div><strong>{p.first_name} {p.last_name}</strong><div className="muted">{p.contact_number} • {p.child_count} {p.child_count===1?"kind":"kinders"}</div></div><div className="kids">{admin.children.filter(c=>c.parent_id===p.id).map(c=><span key={c.id}>{c.first_name} {c.last_name} ({c.age})</span>)}</div></div>)}</section>}
        {adminTab==="sessions"&&<section className="card"><h2>Bestuur sessies</h2><form className="form formGrid" onSubmit={e=>{e.preventDefault();adminAction({action:"create_slot",date:newDate,time:newTime,capacity:3});setNewDate("")}}><label>Datum<input type="date" value={newDate} onChange={e=>setNewDate(e.target.value)} required/></label><label>Tyd<input type="time" value={newTime} onChange={e=>setNewTime(e.target.value)} required/></label><button className="primary">+ Skep 3-kind sessie</button></form>{admin.slots.map(s=>{const count=admin.bookings.filter(b=>b.slot_id===s.id&&["pending","confirmed"].includes(b.status)).length;return <div className="slotRow" key={s.id}><div><strong>{s.session_date}</strong> • {String(s.session_time).slice(0,5)}<div className="muted">{count}/{s.capacity} aktiewe versoeke</div></div><button className="danger" onClick={()=>adminAction({action:"delete_slot",slotId:s.id})}>Verwyder</button></div>})}</section>}
      </div>}
    </main><footer className="footer">Klein Sterre Akademie • Elke Ster Begin Iewers • R150 per sessie</footer>
  </div>;
}
