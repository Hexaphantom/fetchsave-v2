export function saveHistory(platform:'tiktok'|'pinterest', username:string){
  try{
    const key="fs_history";
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    const entry = {platform, username, href: `/${platform}?u=${encodeURIComponent(username)}`, ts: Date.now()};
    const filtered = existing.filter((e:any)=> !(e.platform===platform && e.username===username));
    filtered.unshift(entry);
    localStorage.setItem(key, JSON.stringify(filtered.slice(0,20)));
  }catch{}
}
