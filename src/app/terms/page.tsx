export default function Terms(){
  return (
    <div className="max-w-[720px] mx-auto px-6 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">Terms of Use</h1>
      <p className="text-sm text-zinc-500 mt-1">Last updated: August 16, 2026</p>
      <div className="mt-6 space-y-4 text-sm text-zinc-600 leading-relaxed">
        <p>By using FetchSave you agree to these terms. If you don&apos;t agree, don&apos;t use the site.</p>
        <h2 className="font-bold text-zinc-900">1. Public content only</h2>
        <p>This tool only displays and downloads content the account owner has already made publicly visible on TikTok or Pinterest. All content belongs to its original creators. We are not affiliated with, endorsed by, or connected to TikTok, ByteDance, or Pinterest, Inc.</p>
        <h2 className="font-bold text-zinc-900">2. Your responsibility</h2>
        <p>You are responsible for how you use downloaded content. Respect copyright, rights of publicity, and the source platform’s Terms of Service. Do not use FetchSave to infringe, harass, or redistribute content without permission where required.</p>
        <h2 className="font-bold text-zinc-900">3. No warranty</h2>
        <p>FetchSave scrapes public pages; TikTok or Pinterest may change their HTML/JSON structure at any time, breaking fetches. The service is provided “as is” without warranty. We log failed parses to diagnose issues but don&apos;t guarantee uninterrupted availability.</p>
        <h2 className="font-bold text-zinc-900">4. Acceptable use</h2>
        <p>Don&apos;t attempt to use the tool to access private content, bypass logins, or hammer our or third-party servers. We rate-limit and may block abusive IPs.</p>
      </div>
    </div>
  );
}
