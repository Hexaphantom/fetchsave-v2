export default function About(){
  return (
    <div className="max-w-[720px] mx-auto px-6 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">About FetchSave</h1>
      <p className="mt-4 text-zinc-600 leading-relaxed">FetchSave is a free utility for viewing and downloading content that is already public on TikTok and Pinterest. It does not hack, bypass, or circumvent any privacy settings.</p>
      <h2 className="mt-8 font-bold text-lg">What it is</h2>
      <ul className="mt-2 list-disc pl-5 text-sm text-zinc-600 space-y-1 leading-relaxed">
        <li><b>TikTok module:</b> Reads the public profile page for a username and, if that user has enabled “Public Liked videos” in TikTok&apos;s Privacy settings, displays those videos. This is a real TikTok feature — separate from Favorites/Saved, which can never be public.</li>
        <li><b>Pinterest module:</b> Reads a public profile&apos;s boards and pins via the JSON Pinterest embeds in its public HTML, then resolves each pin&apos;s original full-resolution asset.</li>
        <li>Every download is proxied through our server with <code>Content-Disposition: attachment</code> so the file saves correctly and hotlink protection / expiring URLs are handled at download time.</li>
      </ul>
      <h2 className="mt-8 font-bold text-lg">What it isn&apos;t</h2>
      <ul className="mt-2 list-disc pl-5 text-sm text-zinc-600 space-y-1">
        <li>Not affiliated with, endorsed by, or connected to TikTok, ByteDance, or Pinterest, Inc.</li>
        <li>Does not request or store TikTok or Pinterest passwords, tokens, or OAuth connections — ever.</li>
        <li>Does not access private, friends-only, or logged-in-only content.</li>
        <li>Does not claim ownership of any media — all content belongs to its original creators. Users are responsible for respecting copyright and platform terms.</li>
      </ul>
      <h2 className="mt-8 font-bold text-lg">How it works technically</h2>
      <p className="mt-2 text-sm text-zinc-600 leading-relaxed">We fetch the public HTML of the requested profile/board, locate the embedded JSON blob (TikTok&apos;s <code>SIGI_STATE</code> / <code>UNIVERSAL_DATA</code> and Pinterest&apos;s <code>initialReduxState</code> / <code>__PWS_DATA__</code>), parse it server-side (with caching for 10–15 minutes), and return structured results. Media URLs are re-resolved fresh at download time because they expire. All fetches are wrapped in error handling with clear UI states and server logging, since upstream HTML changes can break parsing at any time.</p>
      <p className="mt-4 text-sm text-zinc-500">Questions? <a href="/contact" className="underline">Contact us</a>.</p>
    </div>
  );
}
