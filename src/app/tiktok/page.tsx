"use client";
import { useState, useEffect, useMemo } from "react";
import { Search, Download, Loader2, AlertCircle, EyeOff, UserX, Check, Lock, X, Image as ImageIcon, Film, ChevronLeft, ChevronRight } from "lucide-react";
import { saveHistory } from "@/lib/utils";

type Item = {
  id:string;
  type:'video'|'photo';
  desc:string;
  thumbnail:string;
  downloadUrl?:string;
  images?:string[];
  imageThumbs?:string[];
  author:string;
  authorDisplayName:string;
};

export default function TikTokPage(){
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Item[]|null>(null);
  const [error, setError] = useState<{type:string,message:string}|null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [photoIndexes, setPhotoIndexes] = useState<Record<string,number>>({});

  useEffect(()=>{
    const params = new URLSearchParams(window.location.search);
    const u = params.get("u");
    if(u){ setUsername(u); fetchLiked(u); }
  },[]);

  async function fetchLiked(u?:string){
    const name = (u ?? username).trim().replace(/^@/,"");
    if(!name) return;
    setLoading(true); setError(null); setItems(null); setSelected(new Set()); setBulkProgress(""); setSearchQuery("");
    try{
      const res = await fetch(`/api/tiktok/liked?username=${encodeURIComponent(name)}`);
      const data = await res.json();
      if(!res.ok){
        setError({type:data.errorType||"error", message:data.message||"Failed to fetch"});
        return;
      }
      if(data.status==="private"){
        setError({type:"private", message:data.message});
        return;
      }
      const list: Item[] = data.items || data.videos || [];
      setItems(list);
      saveHistory("tiktok", name);
      if(list.length===0) setError({type:"empty", message:"This user has no liked content or none were found."});
    }catch(e:any){
      setError({type:"fetch_failed", message:"Couldn't load this right now. TikTok may have changed its page structure or is rate-limiting."});
    }finally{ setLoading(false); }
  }

  // Client-side filtering
  const filtered = useMemo(()=>{
    if(!items) return null;
    const q = searchQuery.trim().toLowerCase();
    if(!q) return items;
    return items.filter(it=>{
      const hay = `${it.desc} ${it.author} ${it.authorDisplayName}`.toLowerCase();
      return hay.includes(q);
    });
  },[items, searchQuery]);

  async function downloadOne(item:Item){
    if(item.type==='video' && item.downloadUrl){
      const url = `/api/tiktok/download?url=${encodeURIComponent(item.downloadUrl)}&id=${encodeURIComponent(item.id)}`;
      const a = document.createElement("a"); a.href=url; a.download=`tiktok-${item.id}.mp4`; document.body.appendChild(a); a.click(); a.remove();
    } else if(item.type==='photo' && item.images){
      // Download all images in this carousel as zip if >1, else single
      if(item.images.length===1){
        const url = `/api/pinterest/download?url=${encodeURIComponent(item.images[0])}&id=${encodeURIComponent(item.id)}&ext=jpg`;
        const a=document.createElement("a"); a.href=url; a.download=`tiktok-photo-${item.id}.jpg`; document.body.appendChild(a); a.click(); a.remove();
      } else {
        setBulkProgress(`Zipping ${item.images.length} photos…`);
        try{
          const res = await fetch("/api/bulk-zip",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({files: item.images.map((img,i)=>({url: img, name:`tiktok-${item.id}-${i+1}.jpg`}))})});
          if(res.ok && res.headers.get("content-type")?.includes("zip")){
            const blob=await res.blob(); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`tiktok-photo-${item.id}.zip`; a.click(); URL.revokeObjectURL(url);
            setBulkProgress("Done."); setTimeout(()=>setBulkProgress(""),2000); return;
          }
          throw new Error();
        }catch{
          // fallback sequential
          for(let i=0;i<item.images.length;i++){
            const url=`/api/pinterest/download?url=${encodeURIComponent(item.images[i])}&id=${encodeURIComponent(item.id)}-${i+1}&ext=jpg`;
            const a=document.createElement("a"); a.href=url; a.download=`tiktok-photo-${item.id}-${i+1}.jpg`; document.body.appendChild(a); a.click(); a.remove();
            await new Promise(r=>setTimeout(r,600));
          }
          setBulkProgress(""); 
        }
      }
    }
  }

  async function bulkDownload(){
    if(selected.size===0 || !items) return;
    const chosen = items.filter(v=>selected.has(v.id));
    // Build flat file list: videos -> 1 file, photos -> N files
    const files: {url:string,name:string}[] = [];
    for(const c of chosen){
      if(c.type==='video' && c.downloadUrl) files.push({url: c.downloadUrl, name:`tiktok-${c.id}.mp4`});
      else if(c.type==='photo' && c.images) c.images.forEach((img,i)=> files.push({url: img, name:`tiktok-${c.id}-${i+1}.jpg`}));
    }
    if(files.length===0) return;
    setBulkProgress(`Preparing ${files.length} files from ${chosen.length} posts…`);
    try{
      const res = await fetch("/api/bulk-zip",{method:"POST",headers:{"Content-Type":"application/json"},body: JSON.stringify({files})});
      if(res.ok && res.headers.get("content-type")?.includes("zip")){
        const blob = await res.blob(); const url = URL.createObjectURL(blob);
        const a=document.createElement("a"); a.href=url; a.download=`tiktok-${username.replace(/^@/,"")}-${Date.now()}.zip`; a.click(); URL.revokeObjectURL(url);
        setBulkProgress("Done — check your downloads."); setTimeout(()=>setBulkProgress(""),3000); return;
      }
      throw new Error("zip failed");
    }catch{
      setBulkProgress(`Downloading ${chosen.length} posts sequentially…`);
      for(let i=0;i<chosen.length;i++){
        setBulkProgress(`Downloading ${i+1}/${chosen.length}…`);
        await downloadOne(chosen[i]);
        await new Promise(r=>setTimeout(r, 900));
      }
      setBulkProgress("All downloads triggered."); setTimeout(()=>setBulkProgress(""),4000);
    }
  }

  const toggle = (id:string)=>{
    const n = new Set(selected);
    if(n.has(id)) n.delete(id); else n.add(id);
    setSelected(n);
    if(n.size>0) setSelectMode(true);
  };

  return (
    <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-8">
      <div className="max-w-3xl">
        <h1 className="text-[28px] sm:text-[34px] font-extrabold tracking-tight">TikTok Liked Content</h1>
        <p className="text-sm text-zinc-600 mt-1">Paste a username to load their public Liked videos <span className="font-medium">and photo posts</span>. Works only if the user enabled <span className="font-medium text-zinc-900">Public Liked videos</span> in TikTok Privacy settings.</p>
        <div className="mt-2 inline-flex items-center gap-1.5 text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-full px-3 py-1"><Lock size={12}/> Favorites/Saved can never be public — this tool doesn&apos;t access them.</div>
      </div>

      <div className="mt-6 bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">@</span>
            <input value={username} onChange={e=>setUsername(e.target.value)} onKeyDown={e=>e.key==='Enter'&&fetchLiked()} placeholder="username" className="w-full pl-7 pr-3 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900"/>
          </div>
          <button onClick={()=>fetchLiked()} disabled={loading} className="px-6 py-3 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-black disabled:opacity-50 flex items-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin"/> : <Search size={16}/>} {loading ? "Loading…":"Search"}
          </button>
        </div>
        <p className="text-xs text-zinc-500 mt-2">We only read what&apos;s already public without logging in. No password or OAuth to TikTok, ever.</p>
      </div>

      {loading && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({length:8}).map((_,i)=>(
            <div key={i} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-[9/12] bg-zinc-100"/><div className="p-3 space-y-2"><div className="h-3 bg-zinc-100 rounded"/><div className="h-3 bg-zinc-100 rounded w-2/3"/></div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-6">
          {error.type==="private" ? (
            <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center max-w-xl mx-auto">
              <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto"><EyeOff size={20}/></div>
              <h3 className="font-semibold mt-3">This user&apos;s Liked videos aren&apos;t public</h3>
              <p className="text-sm text-zinc-500 mt-1 leading-relaxed">This account exists, but Liked content is private (the default for most users). The owner can make them public in TikTok → Settings → Privacy → Liked videos.</p>
            </div>
          ): error.type==="not_found" ? (
            <div className="bg-white border border-red-200 rounded-2xl p-8 text-center max-w-xl mx-auto">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto text-red-600"><UserX size={20}/></div>
              <h3 className="font-semibold mt-3">Account not found</h3>
              <p className="text-sm text-zinc-500 mt-1">No TikTok account matches “@{username.replace(/^@/,"")}”.</p>
            </div>
          ): error.type==="empty" ? (
            <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center max-w-xl mx-auto">
              <p className="font-medium">No liked content found</p><p className="text-sm text-zinc-500 mt-1">This user has no public liked posts to display.</p>
            </div>
          ):(
            <div className="bg-white border border-amber-200 rounded-2xl p-6 flex gap-3">
              <AlertCircle className="text-amber-600 shrink-0" size={18}/>
              <div><p className="text-sm font-medium">Couldn&apos;t load this right now</p><p className="text-sm text-zinc-600 mt-1">{error.message}</p></div>
            </div>
          )}
        </div>
      )}

      {items && items.length>0 && (
        <>
          {/* In-gallery search + controls */}
          <div className="mt-6 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
              <p className="text-sm text-zinc-600"><span className="font-semibold text-zinc-900">{items.length}</span> liked posts • @{username.replace(/^@/,"")} <span className="text-zinc-400">· {items.filter(i=>i.type==='video').length} videos · {items.filter(i=>i.type==='photo').length} photo sets</span></p>
              <div className="flex items-center gap-2">
                <button onClick={()=>setSelectMode(!selectMode)} className={`text-sm px-3 py-1.5 rounded-full border shrink-0 ${selectMode?'bg-zinc-900 text-white border-zinc-900':'bg-white border-zinc-200'}`}>{selectMode?'Done':'Select multiple'}</button>
                {selected.size>0 && <button onClick={bulkDownload} className="text-sm px-4 py-1.5 rounded-full bg-zinc-900 text-white font-medium flex items-center gap-1.5 shrink-0"><Download size={14}/> Download selected ({selected.size})</button>}
              </div>
            </div>

            {/* Search bar — appears only after loaded, client-side filter */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-3 flex flex-col gap-2">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"/>
                <input
                  value={searchQuery}
                  onChange={e=>setSearchQuery(e.target.value)}
                  placeholder="Filter by creator or caption — e.g. @username, #travel, ramen"
                  className="w-full pl-9 pr-9 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900"
                />
                {searchQuery && (
                  <button onClick={()=>setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-zinc-100 rounded-full"><X size={14}/></button>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-zinc-500">
                  {searchQuery ? (
                    <>Showing <span className="font-semibold text-zinc-900">{filtered?.length}</span> of {items.length} — instant filter on loaded results</>
                  ) : (
                    <>Tip: search matches creator username, display name &amp; caption</>
                  )}
                </p>
                <p className="text-xs text-zinc-400">Searching loaded results — scroll to load more if paginated</p>
              </div>
            </div>
          </div>

          {bulkProgress && <p className="mt-3 text-xs font-medium text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-full inline-block px-3 py-1">{bulkProgress}</p>}

          {filtered && filtered.length===0 ? (
            <div className="mt-6 bg-white border border-zinc-200 rounded-2xl p-8 text-center max-w-xl mx-auto">
              <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mx-auto"><Search size={16} className="text-zinc-500"/></div>
              <h3 className="font-semibold mt-3">No results for &quot;{searchQuery}&quot;</h3>
              <p className="text-sm text-zinc-500 mt-1">Try a different creator name or keyword.</p>
              <button onClick={()=>setSearchQuery("")} className="mt-3 text-sm px-4 py-1.5 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50">Clear search</button>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered!.map(item=>(
                <div key={item.id} className="group bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:shadow-md transition-all flex flex-col">
                  <div className="relative aspect-[9/12] bg-zinc-100 overflow-hidden">
                    {/* Badge */}
                    <div className="absolute top-2 left-2 z-10 flex gap-1.5">
                      <span className={`text-[10px] font-bold tracking-widest px-2 py-1 rounded-full flex items-center gap-1 ${item.type==='photo'?'bg-violet-600 text-white':'bg-black text-white'}`}>
                        {item.type==='photo'?<><ImageIcon size={10}/> PHOTO ×{item.images?.length||1}</>:<><Film size={10}/> VIDEO</>}
                      </span>
                    </div>
                    {selectMode && (
                      <button onClick={()=>toggle(item.id)} className={`absolute top-2 right-2 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center ${selected.has(item.id)?'bg-zinc-900 border-zinc-900 text-white':'bg-white/90 border-white'}`}>
                        {selected.has(item.id)&&<Check size={12}/>}
                      </button>
                    )}

                    {item.type==='video' ? (
                      <img src={item.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"/>
                    ) : (
                      <>
                        <img src={item.imageThumbs?.[photoIndexes[item.id]||0] || item.thumbnail} alt="" className="w-full h-full object-cover"/>
                        {/* mini carousel controls */}
                        {(item.images?.length||0) > 1 && (
                          <>
                            <button onClick={(e)=>{e.stopPropagation(); setPhotoIndexes(p=>({...p, [item.id]: Math.max(0,(p[item.id]||0)-1)}))}} className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 disabled:opacity-30" disabled={(photoIndexes[item.id]||0)===0}><ChevronLeft size={14}/></button>
                            <button onClick={(e)=>{e.stopPropagation(); setPhotoIndexes(p=>({...p, [item.id]: Math.min((item.images!.length-1),(p[item.id]||0)+1)}))}} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 disabled:opacity-30" disabled={(photoIndexes[item.id]||0)>= (item.images!.length-1)}><ChevronRight size={14}/></button>
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                              {item.images!.map((_,idx)=>(
                                <span key={idx} className={`w-1.5 h-1.5 rounded-full ${idx===(photoIndexes[item.id]||0)?'bg-white':'bg-white/50'}`}/>
                              ))}
                            </div>
                            {/* thumbnail strip */}
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent pt-6 pb-1.5 px-1.5 flex gap-1 overflow-hidden">
                              {item.imageThumbs!.slice(0,5).map((t,i)=>(
                                <img key={i} src={t} alt="" className={`w-8 h-8 rounded-md object-cover border ${i===(photoIndexes[item.id]||0)?'border-white':'border-white/30 opacity-70'}`}/>
                              ))}
                              {item.imageThumbs!.length>5 && <span className="text-[10px] text-white self-center ml-1">+{item.imageThumbs!.length-5}</span>}
                            </div>
                          </>
                        )}
                      </>
                    )}

                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-3 pointer-events-none">
                      <p className="text-white text-xs line-clamp-2 leading-snug">{item.desc||"Untitled"}</p>
                      <p className="text-white/70 text-[11px] mt-0.5 truncate">@{item.author} · {item.authorDisplayName}</p>
                    </div>
                  </div>
                  <div className="p-3 mt-auto">
                    <p className="text-xs text-zinc-500 truncate">ID: {item.id} · {item.type==='photo'? `${item.images?.length} photos` : 'video'}</p>
                    <button onClick={()=>downloadOne(item)} className="mt-2 w-full py-2 rounded-xl bg-zinc-900 text-white text-sm font-medium hover:bg-black flex items-center justify-center gap-1.5">
                      <Download size={14}/> {item.type==='photo' ? ( (item.images?.length||1)>1 ? `Download ${item.images?.length} images` : 'Download image') : 'Download'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!loading && !items && !error && (
        <div className="mt-6 bg-white border border-dashed border-zinc-300 rounded-2xl p-10 text-center">
          <p className="text-sm text-zinc-500">Enter a username above to get started — we&apos;ll show the gallery here.</p>
        </div>
      )}
    </div>
  );
}
