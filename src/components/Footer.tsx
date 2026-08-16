import Link from "next/link";
export default function Footer(){
  return (
    <footer className="border-t border-zinc-200 bg-white mt-12">
      <div className="max-w-[1120px] mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div className="max-w-md">
            <div className="flex items-center gap-2 font-bold"><div className="w-7 h-7 rounded-lg bg-zinc-900 flex items-center justify-center text-white text-xs">◐</div> FetchSave</div>
            <p className="text-sm text-zinc-500 mt-2 leading-relaxed">FetchSave only displays and downloads content that the account owner has already made publicly visible on TikTok or Pinterest. All content belongs to its original creators.</p>
            <p className="text-xs text-zinc-400 mt-3">Not affiliated with, endorsed by, or connected to TikTok, ByteDance, or Pinterest, Inc. Users are responsible for how they use downloaded content.</p>
          </div>
          <div className="flex gap-10 text-sm">
            <div className="flex flex-col gap-2">
              <span className="font-semibold text-xs tracking-widest text-zinc-400">PRODUCT</span>
              <Link href="/tiktok" className="hover:underline">TikTok</Link>
              <Link href="/pinterest" className="hover:underline">Pinterest</Link>
              <Link href="/about" className="hover:underline">How it works</Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-semibold text-xs tracking-widest text-zinc-400">LEGAL</span>
              <Link href="/about" className="hover:underline">About</Link>
              <Link href="/privacy-policy" className="hover:underline">Privacy</Link>
              <Link href="/terms" className="hover:underline">Terms</Link>
              <Link href="/contact" className="hover:underline">Contact</Link>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-zinc-100 flex flex-col sm:flex-row justify-between gap-2 text-xs text-zinc-400">
          <span>© 2026 FetchSave. All rights reserved.</span><span>Built for public content only — no login to TikTok or Pinterest ever.</span>
        </div>
      </div>
    </footer>
  );
}
