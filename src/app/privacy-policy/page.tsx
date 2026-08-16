export default function Privacy(){
  return (
    <div className="max-w-[720px] mx-auto px-6 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">Privacy Policy</h1>
      <p className="text-sm text-zinc-500 mt-1">Last updated: August 16, 2026</p>
      <div className="mt-6 space-y-5 text-sm text-zinc-600 leading-relaxed">
        <p>FetchSave (“we”, “us”) operates fetchsave.example.com. We collect the minimum data needed to run the service.</p>
        <h2 className="font-bold text-zinc-900">What we collect</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><b>Search history (optional):</b> If you sign in with Google, we store your email, name, and the usernames you look up so we can show “Recent searches.” This is stored only for signed-in users and only on our site — it has no connection to your TikTok or Pinterest accounts.</li>
          <li><b>Anonymous usage:</b> Standard analytics (pages viewed, fetch success/failure, download counts) without personal identifiers.</li>
          <li><b>We never collect</b> TikTok or Pinterest passwords, OAuth tokens, or private account data — our tool has no login to those platforms.</li>
        </ul>
        <h2 className="font-bold text-zinc-900">Caching</h2>
        <p>Fetched profile/board results are cached for 10–15 minutes to avoid hammering TikTok/Pinterest on repeated lookups. Download URLs are not cached — they are resolved fresh at download time.</p>
        <h2 className="font-bold text-zinc-900">Cookies & third parties</h2>
        <p>We use only essential cookies for session and analytics. No ad-trackers or third-party data brokers. Google Sign-In uses Google’s OAuth 2.0 flow and is subject to Google’s privacy policy.</p>
        <h2 className="font-bold text-zinc-900">Your rights</h2>
        <p>Contact us at privacy@fetchsave.example.com to request deletion of your account/history data. EU/California rights apply where applicable.</p>
      </div>
    </div>
  );
}
