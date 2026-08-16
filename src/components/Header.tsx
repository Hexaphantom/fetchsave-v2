"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, Clock, LogOut, User } from "lucide-react";

export default function Header(){
  const [user, setUser] = useState<{name:string,email:string,avatar?:string}|null>(null);
  const [showRecents, setShowRecents] = useState(false);
  useEffect(()=>{
    const s = localStorage.getItem("fs_user");
    if(s) setUser(JSON.parse(s));
    const handler = ()=>{ const v=localStorage.getItem("fs_user"); setUser(v?JSON.parse(v):null); };
    window.addEventListener("fs_auth", handler);
    return ()=>window.removeEventListener("fs_auth",handler);
  },[]);
  const signIn = ()=>{
    const mock = {name:"Alex Rivera", email:"alex.rivera@gmail.com", avatar:"AR"};
    localStorage.setItem("fs_user", JSON.stringify(mock));
    setUser(mock);
    window.dispatchEvent(new Event("fs_auth"));
  };
  const signOut = ()=>{
    localStorage.removeItem("fs_user");
    setUser(null);
    window.dispatchEvent(new Event("fs_auth"));
  };
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-zinc-200">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 h-[64px] flex items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white font-bold text-[14px]">◐</div>
            <span className="font-bold text-[17px] tracking-tight">FetchSave</span>
            <span className="hidden sm:inline text-[11px] font-medium tracking-widest text-zinc-400 border border-zinc-200 rounded-full px-2 py-0.5 ml-1">BETA</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1 text-sm">
            <Link href="/tiktok" className="px-3 py-1.5 rounded-full hover:bg-zinc-100 font-medium">TikTok</Link>
            <Link href="/pinterest" className="px-3 py-1.5 rounded-full hover:bg-zinc-100 font-medium">Pinterest</Link>
            <Link href="/about" className="px-3 py-1.5 rounded-full hover:bg-zinc-100 text-zinc-600">About</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              <button onClick={()=>setShowRecents(!showRecents)} className="hidden sm:flex items-center gap-1.5 text-sm border border-zinc-200 rounded-full px-3 py-1.5 hover:bg-zinc-50"><Clock size={14}/> Recent</button>
              <div className="flex items-center gap-2 pl-2">
                <div className="w-7 h-7 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-semibold">{user.avatar}</div>
                <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">{user.name}</span>
                <button onClick={signOut} className="p-1.5 hover:bg-zinc-100 rounded-full"><LogOut size={14}/></button>
              </div>
            </div>
          ):(
            <button onClick={signIn} className="flex items-center gap-2 border border-zinc-200 rounded-full px-4 py-2 text-sm font-medium hover:bg-zinc-50 bg-white">
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="G" className="w-4 h-4"/> Sign in with Google
            </button>
          )}
        </div>
      </div>
      {showRecents && user && <RecentPanel onClose={()=>setShowRecents(false)}/>}
    </header>
  );
}

function RecentPanel({onClose}:{onClose:()=>void}){
  const [recents,setRecents] = useState<any[]>([]);
  useEffect(()=>{
    const v = localStorage.getItem("fs_history");
    if(v) setRecents(JSON.parse(v));
  },[]);
  if(recents.length===0) return (
    <div className="max-w-[1120px] mx-auto px-6 pb-4">
      <div className="ml-auto max-w-sm border border-zinc-200 rounded-2xl bg-white p-4 shadow-lg">
        <p className="text-sm font-medium">No recent searches</p><p className="text-xs text-zinc-500">Your TikTok and Pinterest lookups will appear here.</p>
        <button onClick={onClose} className="mt-3 text-xs underline">Close</button>
      </div>
    </div>
  );
  return (
    <div className="max-w-[1120px] mx-auto px-6 pb-4">
      <div className="ml-auto max-w-sm border border-zinc-200 rounded-2xl bg-white p-3 shadow-lg">
        <p className="text-xs font-semibold tracking-widest text-zinc-400 px-2 py-1">RECENT SEARCHES</p>
        {recents.slice(0,8).map((r,i)=>(
          <Link key={i} href={r.href} className="flex items-center gap-2 px-2 py-2 hover:bg-zinc-50 rounded-xl">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${r.platform==='tiktok'?'bg-black text-white':'bg-red-600 text-white'}`}>{r.platform==='tiktok'?'T':'P'}</span>
            <span className="text-sm font-medium">@{r.username}</span><span className="text-xs text-zinc-500 ml-auto">{r.platform}</span>
          </Link>
        ))}
        <button onClick={()=>{localStorage.removeItem("fs_history"); setRecents([]);}} className="text-xs text-zinc-500 underline px-2 mt-2">Clear</button>
      </div>
    </div>
  );
}
