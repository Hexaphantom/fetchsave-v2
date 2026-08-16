import { NextRequest, NextResponse } from "next/server";
export async function GET(req: NextRequest){
  const url = req.nextUrl.searchParams.get("url");
  const id = req.nextUrl.searchParams.get("id") || "pin";
  const ext = req.nextUrl.searchParams.get("ext") || "jpg";
  if(!url) return NextResponse.json({error:"Missing url"},{status:400});
  try{
    const decoded = decodeURIComponent(url);
    if(!/^https?:\/\//.test(decoded)) throw new Error("Invalid");
    const upstream = await fetch(decoded, { headers:{ "User-Agent":"Mozilla/5.0", "Accept":"*/*" } });
    if(!upstream.ok || !upstream.body) return NextResponse.json({error:"Upstream failed"},{status:502});
    const ct = upstream.headers.get("content-type") || (ext==="mp4"?"video/mp4":"image/jpeg");
    const headers = new Headers();
    headers.set("Content-Type", ct);
    headers.set("Content-Disposition", `attachment; filename="pinterest-${id}.${ext}"`);
    headers.set("Cache-Control","no-store");
    return new NextResponse(upstream.body, {headers});
  }catch(e){
    return NextResponse.json({error:"Download failed"},{status:500});
  }
}
