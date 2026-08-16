import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap, Image as ImageIcon, Video, Search, Download } from "lucide-react";

export default function Home(){
  return (
    <div>
      {/* Hero */}
      <section className="max-w-[1120px] mx-auto px-6 pt-12 sm:pt-16 pb-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 text-xs font-medium border border-zinc-200 rounded-full px-3 py-1.5 bg-white">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> No login to TikTok or Pinterest required — public content only
          </div>
          <h1 className="mt-5 text-[36px] sm:text-[48px] font-extrabold tracking-tight leading-[0.95]">Download public<br/>TikTok & Pinterest<br/><span className="text-zinc-400">at original quality.</span></h1>
          <p className="mt-4 text-[16px] sm:text-[18px] text-zinc-600 leading-relaxed max-w-xl">FetchSave reads what&apos;s already public. Paste a username, browse the gallery, and download clean, watermark-free files at full resolution. Free forever.</p>
        </div>

        {/* Two cards */}
        <div className="grid md:grid-cols-2 gap-4 mt-8">
          <Link href="/tiktok" className="group bg-white border border-zinc-200 rounded-[20px] p-6 sm:p-7 hover:shadow-lg hover:border-zinc-300 transition-all">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center"><Video size={18}/></div>
              <span className="text-xs font-semibold tracking-widest text-zinc-400 border border-zinc-200 rounded-full px-2.5 py-1">TIKTOK</span>
            </div>
            <h3 className="mt-4 text-xl font-bold">TikTok Liked Videos</h3>
            <p className="text-sm text-zinc-500 mt-1 leading-relaxed">Enter any username. If their Liked videos are set to public, see them in a gallery and download watermark-free.</p>
            <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold">Open TikTok module <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform"/></div>
          </Link>
          <Link href="/pinterest" className="group bg-white border border-zinc-200 rounded-[20px] p-6 sm:p-7 hover:shadow-lg hover:border-zinc-300 transition-all">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center"><ImageIcon size={18}/></div>
              <span className="text-xs font-semibold tracking-widest text-zinc-400 border border-zinc-200 rounded-full px-2.5 py-1">PINTEREST</span>
            </div>
            <h3 className="mt-4 text-xl font-bold">Pinterest Boards & Pins</h3>
            <p className="text-sm text-zinc-500 mt-1 leading-relaxed">Paste a profile URL or username. Browse public boards and download any pin&apos;s original full-resolution file.</p>
            <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold">Open Pinterest module <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform"/></div>
          </Link>
        </div>

        {/* How it works */}
        <div className="mt-10 bg-zinc-900 rounded-[20px] p-6 sm:p-8 text-white">
          <p className="text-xs tracking-widest font-semibold text-zinc-400">HOW IT WORKS</p>
          <div className="grid sm:grid-cols-3 gap-6 mt-4">
            {[
              {n:"01", t:"Paste a username", d:"No password, no OAuth. Only public profiles that anyone can view without logging in.", i:Search},
              {n:"02", t:"Browse the gallery", d:"We parse the page's embedded data to build a clean gallery with thumbnails and metadata.", i:ImageIcon},
              {n:"03", t:"Download for real", d:"Every button streams the original file with correct headers — playable .mp4s and full-res images.", i:Download},
            ].map(s=>(
              <div key={s.n} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-1"><s.i size={14}/></div>
                <div><p className="font-semibold text-sm">{s.n} — {s.t}</p><p className="text-sm text-zinc-400 mt-1 leading-relaxed">{s.d}</p></div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5"><ShieldCheck size={12}/> Public content only</span>
            <span className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5"><Zap size={12}/> Original resolution</span>
            <span className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5">No watermarks</span>
          </div>
        </div>
      </section>
    </div>
  );
}
