import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest){
  const url = req.nextUrl.searchParams.get("url");
  const id = req.nextUrl.searchParams.get("id") || "video";
  if(!url) return NextResponse.json({error:"Missing url"},{status:400});
  try{
    const decoded = decodeURIComponent(url);
    // Validate it's http(s)
    if(!/^https?:\/\//.test(decoded)) throw new Error("Invalid URL");
    const upstream = await fetch(decoded, {
      headers:{
        "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer":"https://www.tiktok.com/",
        "Accept":"*/*",
      }
    });
    if(!upstream.ok || !upstream.body){
      // fallback: return redirect to original if fetch blocked
      console.error("[tiktok download] upstream failed", decoded, upstream.status);
      return NextResponse.json({error:"Upstream fetch failed", status: upstream.status},{status:502});
    }
    const contentType = upstream.headers.get("content-type") || "video/mp4";
    const headers = new Headers();
    headers.set("Content-Type", contentType.includes("video")? contentType : "video/mp4");
    headers.set("Content-Disposition", `attachment; filename="tiktok-${id}.mp4"`);
    headers.set("Cache-Control","no-store");
    // Stream body
    return new NextResponse(upstream.body, { headers });
  }catch(e:any){
    console.error("[tiktok download] error", e);
    return NextResponse.json({error:"Download failed"},{status:500});
  }
}
