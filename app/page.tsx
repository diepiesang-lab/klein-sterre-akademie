"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Slot = { id:string; date:string; time:string; bookings:string[] };

const seed:Slot[] = [
  {id:"1",date:"2026-09-19",time:"09:00",bookings:["Liam"]},
  {id:"2",date:"2026-09-19",time:"10:00",bookings:[]},
  {id:"3",date:"2026-09-22",time:"15:00",bookings:["Mia","Noah"]},
  {id:"4",date:"2026-09-24",time:"15:00",bookings:[]},
  {id:"5",date:"2026-09-26",time:"09:00",bookings:[]},
];

function monthDays(year:number,month:number){
  const first=new Date(year,month,1), total=new Date(year,month+1,0).getDate();
  const start=(first.getDay()+6)%7; return {start,total};
}

export default function Home(){
  const today=new Date();
  const [month,setMonth]=useState(new Date(today.getFullYear(),today.getMonth(),1));
  const [slots,setSlots]=useState<Slot[]>(seed);
  const [selected,setSelected]=useState<Slot|null>(null);
  const [child,setChild]=useState("");
  const [grade,setGrade]=useState("");
  const [parent,setParent]=useState("");
  const [tab,setTab]=useState<"book"|"admin">("book");
  const [admin,setAdmin]=useState(false);
  const [notice,setNotice]=useState("");
  const [newDate,setNewDate]=useState("");
  const [newTime,setNewTime]=useState("15:00");

  useEffect(()=>{const raw=localStorage.getItem("ksa-slots");if(raw) setSlots(JSON.parse(raw));},[]);
  useEffect(()=>localStorage.setItem("ksa-slots",JSON.stringify(slots)),[slots]);

  const {start,total}=monthDays(month.getFullYear(),month.getMonth());
  const cells=useMemo(()=>Array.from({length:start+total},(_,i)=>i<start?null:i-start+1),[start,total]);
  const visible=slots.filter(s=>{const d=new Date(s.date+"T00:00:00");return d.getFullYear()===month.getFullYear()&&d.getMonth()===month.getMonth()});
  const monthName=month.toLocaleDateString("af-ZA",{month:"long",year:"numeric"});

  function book(e:FormEvent){
    e.preventDefault(); if(!selected||selected.bookings.length>=3)return;
    if(!child.trim()||!parent.trim())return setNotice("Vul asseblief die kind se naam en ouer/voog se kontakbesonderhede in.");
    setSlots(prev=>prev.map(s=>s.id===selected.id?{...s,bookings:[...s.bookings,child.trim()]}:s));
    setNotice(`Bespreking bevestig vir ${child.trim()} op ${selected.date} om ${selected.time}. Sessiegeld: R150.`);
    setSelected(null);setChild("");setGrade("");
  }
  function addSlot(e:FormEvent){
    e.preventDefault(); if(!newDate)return;
    setSlots(prev=>[...prev,{id:crypto.randomUUID(),date:newDate,time:newTime,bookings:[]}].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)));
    setNotice("Nuwe sessieslot geskep.");setNewDate("");
  }
  function deleteSlot(id:string){setSlots(prev=>prev.filter(s=>s.id!==id));setNotice("Slot verwyder.");}
  function adminLogin(){const pin=prompt("Admin PIN:");if(pin==="0430"){setAdmin(true);setTab("admin")}else setNotice("Verkeerde PIN.")}

  return <div className="page">
    <header className="top"><nav className="nav"><div className="brand"><div className="ball">🏏</div><div><strong>Klein Sterre Akademie</strong><span>Krieketontwikkeling vir jong sterre</span></div></div><button className="adminBtn" onClick={admin?()=>setTab(tab==="admin"?"book":"admin"):adminLogin}>{admin?(tab==="admin"?"Oueraansig":"Admin"):"Admin"}</button></nav>
      <div className="hero"><div className="eyebrow">Krieket Akademie</div><h1>Elke Ster Begin Iewers.</h1><p>Bespreek ’n individuele krieketsessie vir jou kind. Kies ’n beskikbare tyd en ons sien jou op die veld.</p></div>
    </header>
    <main className="content">
      <div className="tabs"><button className={`tab ${tab==="book"?"active":""}`} onClick={()=>setTab("book")}>📅 Bespreek ’n sessie</button>{admin&&<button className={`tab ${tab==="admin"?"active":""}`} onClick={()=>setTab("admin")}>⚙️ Admin</button>}</div>
      {notice&&<div className="notice" style={{marginBottom:18}}>{notice}</div>}
      {tab==="book"?<div className="grid"><section className="card"><div className="adminHeader"><div><h2>Sessiekalender</h2><div className="muted">Maksimum 3 kinders per sessie • R150 per sessie</div></div><div><button className="secondary" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))}>‹</button> <button className="secondary" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))}>›</button></div></div><h3 style={{textTransform:"capitalize"}}>{monthName}</h3><div className="calendar">{["Ma","Di","Wo","Do","Vr","Sa","So"].map(d=><div className="dayHead" key={d}>{d}</div>)}{cells.map((day,i)=>{if(!day)return <div key={i}/>;const iso=`${month.getFullYear()}-${String(month.getMonth()+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;const ds=visible.filter(s=>s.date===iso);return <div className="day" key={iso}><div className="date">{day}</div>{ds.map(s=><button key={s.id} className={`slot ${s.bookings.length>=3?"full":""} ${selected?.id===s.id?"selected":""}`} disabled={s.bookings.length>=3} onClick={()=>setSelected(s)}><strong>{s.time}</strong><br/>{s.bookings.length>=3?"Vol":`${3-s.bookings.length} plek${3-s.bookings.length===1?"":"ke"} oor`}</button>)}</div>})}</div></section>
      <aside className="card">{selected?<><h2>Bespreek sessie</h2><p className="muted">{selected.date} • {selected.time} • {selected.bookings.length}/3 bespreek</p><form className="form" onSubmit={book}><label>Kind se naam<input value={child} onChange={e=>setChild(e.target.value)} placeholder="Volle naam" required/></label><label>Graad<select value={grade} onChange={e=>setGrade(e.target.value)} required><option value="">Kies graad</option>{["R","1","2","3","4","5","6","7"].map(g=><option key={g}>{g}</option>)}</select></label><label>Ouer / voog kontak<input value={parent} onChange={e=>setParent(e.target.value)} placeholder="WhatsApp / selfoonnommer" required/></label><button className="primary">Bevestig bespreking • R150</button><button type="button" className="secondary" onClick={()=>setSelected(null)}>Kanselleer</button></form></>:<><h2>Kies ’n slot</h2><p className="muted">Klik op enige groen slot in die kalender om ’n sessie te bespreek.</p><div className="slotRow"><span>🟢 Beskikbaar</span><span className="badge">Plekke beskikbaar</span></div><div className="slotRow"><span>🟠 Byna vol</span><span className="badge warn">1 plek oor</span></div><div className="slotRow"><span>⚪ Vol</span><span className="badge full">Geen plek</span></div></>}</aside></div>
      :<div className="admin"><section className="card"><div className="adminHeader"><div><h2>Admin — Bestuur sessies</h2><div className="muted">Skep en bestuur jou krieketsessies.</div></div></div><form className="form" onSubmit={addSlot}><label>Datum<input type="date" value={newDate} onChange={e=>setNewDate(e.target.value)} required/></label><label>Tyd<input type="time" value={newTime} onChange={e=>setNewTime(e.target.value)} required/></label><button className="primary">+ Skep sessieslot</button></form></section><section className="card"><h2>Komende slots</h2>{slots.length===0&&<p className="muted">Geen slots geskep nie.</p>}{slots.map(s=><div className="slotRow" key={s.id}><div><strong>{s.date}</strong> • {s.time}<div className="muted">{s.bookings.length}/3 bespreek {s.bookings.length?`— ${s.bookings.join(", ")}`:""}</div></div><button className="secondary" onClick={()=>deleteSlot(s.id)}>Verwyder</button></div>)}</section></div>}
    </main><footer className="footer">Klein Sterre Akademie • Elke Ster Begin Iewers • Gebou vir maklike WhatsApp-besprekings</footer>
  </div>
}