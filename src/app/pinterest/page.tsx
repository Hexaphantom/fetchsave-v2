"use client";
import { useState, useEffect } from "react";
import { Search, Download, Check, Loader2, AlertCircle, UserX, Image as ImageIcon } from "lucide-react";
import { saveHistory } from "@/lib/utils";

type Board = { id:string, name:string, pinCount:number, cover:string };
type Pin = { id:string, title:string, image:string, original:string, isVideo:boolean, videoUrl?:string };

export default function PinterestPage(){
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [boards, setBoards] = useState<Board[]|null>(null);
  const [pins, setPins] = useState<Pin[]|null>(null);
  const [activeBoard, setActiveBoard] = useState<string|null>(null);
  const [pinsLoading, setPinsLoading] = useState(false);
  const [error, setError] = useState<{type:string,message:string}|null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkProgress, setBulkProgress] = useState("");

  useEffect(()=>{
    const p = new URLSearchParams(window.location.search);
    const u = p.get("u");
    if(u){ setInput(u); fetchProfile(u); }
  },[]);

  async function fetchProfile(u?:string){
    const raw = (u ?? input).trim();
    if(!raw) return;
    const username = raw.replace(/^https?:\/\/(www\.)?pinterest\.com\//,"").replace(/\/$/,"").split("/")[0].replace("@","");
    setLoading(true); setError(null); setBoards(null); setPins(null); setActiveBoard(null);
    try{
      const res = await fetch(`/api/pinterest/profile?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      if(!res.ok){ setError({type:data.errorType||"error", message:data.message}); return; }
      if(data.boards.length===0) setError({type:"empty", message:"This account has no public boards."});
      setBoards(data.boards);
      saveHistory("pinterest", username);
    }catch{
      setError({type:"fetch_failed", message:"Couldn't load this right now. Pinterest may have changed its page structure."});
    }finally{ setLoading(false); }
  }

  async function openBoard(b:Board){
    setActiveBoard(b.id); setPinsLoading(true); setPins(null);
    try{
      const res = await fetch(`/api/pinterest/board?username=${encodeURIComponent(input.replace(/.*pinterest\.com\//,"").split("/")[0].replace("@",""))}&boardId=${encodeURIComponent(b.id)}&boardName=${encodeURIComponent(b.name)}`);
      const data = await res.json();
      if(!res.ok) throw new Error(data.message);
      setPins(data.pins);
      if(data.pins.length===0) setError({type:"empty_pins", message:"This board is empty."});
      else setError(null);
    }catch(e:any){
      setError({type:"fetch_failed", message:e.message||"Failed to load pins"});
    }finally{ setPinsLoading(false); }
  }

  async function downloadOne(p:Pin){
    const url = p.isVideo && p.videoUrl ? p.videoUrl : p.original;
    const ext = p.isVideo ? "mp4" : "jpg";
    const prox = `/api/pinterest/download?url=${encodeURIComponent(url)}&id=${encodeURIComponent(p.id)}&ext=${ext}`;
    const a=document.createElement("a"); a.href=prox; a.download=`pinterest-${p.id}.${ext}`; document.body.appendChild(a); a.click(); a.remove();
  }

  async function bulkDownload(){
    if(!pins || selected.size===0) return;
    const chosen = pins.filter(p=>selected.has(p.id));
    setBulkProgress(`Preparing ${chosen.length} files…`);
    try{
      const res = await fetch("/api/bulk-zip",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({files: chosen.map(p=>({url: p.isVideo && p.videoUrl ? p.videoUrl : p.original, name:`pinterest-${p.id}.${p.isVideo?'mp4':'jpg'}`}))})});
      if(res.ok && res.headers.get("content-type")?.includes("zip")){
        const blob=await res.blob(); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`pinterest-${Date.now()}.zip`; a.click(); URL.revokeObjectURL(url);
        setBulkProgress("Done — check your downloads."); setTimeout(()=>setBulkProgress(""),3000); return;
      }
      throw new Error();
    }catch{
      setBulkProgress(`Downloading ${chosen.length} files…`);
      for(let i=0;i<chosen.length;i++){ setBulkProgress(`Downloading ${i+1}/${chosen.length}…`); downloadOne(chosen[i]); await new Promise(r=>setTimeout(r, 800)); }
      setTimeout(()=>setBulkProgress(""),3000);
    }
  }

  const toggle=(id:string)=>{ const n=new Set(selected); if(n.has(id)) n.delete(id); else n.add(id); setSelected(n); };

  return (
    <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-8">
      <div className="max-w-3xl">
        <h1 className="text-[28px] sm:text-[34px] font-extrabold tracking-tight">Pinterest Boards & Pins</h1>
        <p className="text-sm text-zinc-600 mt-1">Enter a Pinterest username or full profile URL. We display public boards and download each pin at its full original resolution.</p>
      </div>

      <div className="mt-6 bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"/>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&fetchProfile()} placeholder="username or https://pinterest.com/username" className="w-full pl-9 pr-3 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"/>
          </div>
          <button onClick={()=>fetchProfile()} disabled={loading} className="px-6 py-3 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-black disabled:opacity-50 flex items-center gap-2">{loading?<Loader2 size={16} className="animate-spin"/>:<Search size={16}/>} Search</button>
        </div>
        <p className="text-xs text-zinc-500 mt-2">Only public boards and pins visible without logging in. No Pinterest password ever requested.</p>
      </div>

      {loading && <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">{Array.from({length:6}).map((_,i)=><div key={i} className="h-40 bg-white border border-zinc-200 rounded-2xl animate-pulse"/> )}</div>}

      {error && (error.type==="empty"||error.type==="empty_pins" ? <div className="mt-6 bg-white border border-zinc-200 rounded-2xl p-8 text-center max-w-xl mx-auto"><p className="font-medium">{error.message}</p></div> : error.type==="not_found" ? <div className="mt-6 bg-white border border-red-200 rounded-2xl p-8 text-center max-w-xl mx-auto"><div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto text-red-600"><UserX size={20}/></div><h3 className="font-semibold mt-3">Account not found</h3><p className="text-sm text-zinc-500 mt-1">{error.message}</p></div> : <div className="mt-6 bg-white border border-amber-200 rounded-2xl p-6 flex gap-3"><AlertCircle size={18} className="text-amber-600 shrink-0"/><div><p className="text-sm font-medium">Couldn&apos;t load this right now</p><p className="text-sm text-zinc-600 mt-1">{error.message}</p></div></div>)}

      {boards && !pins && boards.length>0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold tracking-widest text-zinc-500">PUBLIC BOARDS — {boards.length}</h2>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {boards.map(b=>(
              <button key={b.id} onClick={()=>openBoard(b)} className={`text-left bg-white border rounded-2xl overflow-hidden hover:shadow-md transition-all ${activeBoard===b.id?'border-zinc-900 ring-1 ring-zinc-900':'border-zinc-200'}`}>
                <div className="aspect-[4/3] bg-zinc-100 overflow-hidden"><img src={b.cover} alt="" className="w-full h-full object-cover"/></div>
                <div className="p-3"><p className="text-sm font-semibold truncate">{b.name}</p><p className="text-xs text-zinc-500">{b.pinCount} pins</p></div>
              </button>
            ))}
          </div>
        </div>
      )}

      {pinsLoading && <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">{Array.from({length:8}).map((_,i)=><div key={i} className="aspect-square bg-white border border-zinc-200 rounded-2xl animate-pulse"/> )}</div>}

      {pins && (
        <>
          <div className="mt-6 flex items-center justify-between gap-3">
            <button onClick={()=>{setPins(null); setActiveBoard(null); setSelected(new Set());}} className="text-sm underline">← Back to boards</button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-600 hidden sm:inline">{pins.length} pins</span>
              {selected.size>0 && <button onClick={bulkDownload} className="text-sm px-4 py-1.5 rounded-full bg-zinc-900 text-white font-medium flex items-center gap-1.5"><Download size={14}/> Download selected ({selected.size})</button>}
            </div>
          </div>
          {bulkProgress && <p className="mt-2 text-xs bg-zinc-50 border border-zinc-200 rounded-full inline-block px-3 py-1">{bulkProgress}</p>}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {pins.map(p=>(
              <div key={p.id} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:shadow-md transition-all">
                <div className="relative aspect-square bg-zinc-100 overflow-hidden">
                  <img src={p.image} alt="" className="w-full h-full object-cover"/>
                  {p.isVideo && <span className="absolute top-2 left-2 bg-black/80 text-white text-[10px] font-bold tracking-widest px-2 py-1 rounded-full">VIDEO</span>}
                  <button onClick={()=>toggle(p.id)} className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center ${selected.has(p.id)?'bg-zinc-900 border-zinc-900 text-white':'bg-white/90 border-white'}`}>{selected.has(p.id)&&<Check size={12}/>}</button>
                </div>
                <div className="p-3"><p className="text-xs line-clamp-2 leading-snug min-h-[32px]">{p.title||"Untitled pin"}</p><button onClick={()=>downloadOne(p)} className="mt-2 w-full py-2 rounded-xl bg-zinc-900 text-white text-sm font-medium hover:bg-black flex items-center justify-center gap-1.5"><Download size={14}/> Download {p.isVideo?'Video':'Image'}</button></div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
