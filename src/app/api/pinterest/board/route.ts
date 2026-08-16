import { NextRequest, NextResponse } from "next/server";
import { getRenderedHtml } from "@/lib/renderedFetch";

export async function GET(req: NextRequest){
  const username = req.nextUrl.searchParams.get("username") || "user";
  const boardId = req.nextUrl.searchParams.get("boardId") || "board";
  const boardName = req.nextUrl.searchParams.get("boardName") || boardId;

  const boardSlug = encodeURIComponent(boardName.toLowerCase().replace(/\s+/g,"-"));
  const url = `https://www.pinterest.com/${encodeURIComponent(username)}/${boardSlug}/`;

  try{
    const { html, status, rendered } = await getRenderedHtml(url, {
      waitUntil: 'networkidle',
      timeoutMs: 35000,
      waitSelector: 'script#__PWS_DATA__, script#initial-state',
    });

    if(status===404) return NextResponse.json({errorType:"not_found", message:"Board not found"}, {status:404});
    if(!html || html.length < 500){
      console.error("[pinterest board] empty html", { username, boardName, status, rendered });
      return NextResponse.json({errorType:"fetch_failed", message:`Pinterest returned ${status || 'empty'} — please try again`},{status:502});
    }

    let pins:any[]=[];

    const embeddedMatch = html.match(new RegExp('<script id="initial-state"[^>]*>([\\s\\S]*?)</scr' + 'ipt>')) || html.match(new RegExp('<script id="__PWS_DATA__"[^>]*>([\\s\\S]*?)</scr' + 'ipt>'));
    if(embeddedMatch){
      try{
        const json=JSON.parse(embeddedMatch[1]);
        const rrs = json?.resourceResponses || json?.props?.initialReduxState?.resourceResponses || json?.initialReduxState?.resourceResponses || [];
        for(const rr of rrs){
          const data=rr?.data;
          if(Array.isArray(data)){
            for(const p of data){
              if(p?.images || p?.image_url || p?.pin_id){
                const orig = p?.images?.orig?.url || p?.image_url || p?.images?.["736x"]?.url || "";
                const thumb = p?.images?.["236x"]?.url || p?.images?.["170x"]?.url || orig || "";
                if(!orig && !thumb) continue;
                pins.push({
                  id: p.id || p.pin_id || String(Date.now()),
                  title: p.title || p.description || p.grid_title || "Pin",
                  image: thumb || orig,
                  original: orig || thumb,
                  isVideo: !!p?.videos || !!p?.video_url,
                  videoUrl: p?.videos?.video_list?.V_720P?.url || p?.videos?.video_list?.V_480P?.url || p?.video_url || undefined
                });
              }
            }
          }
          // Single pin case
          if(rr?.data?.pin && rr.data.pin?.images) {
            const p=rr.data.pin; pins.push({ id: p.id, title: p.title||"Pin", image: p.images?.["236x"]?.url||p.images?.orig?.url, original: p.images?.orig?.url, isVideo: !!p.videos, videoUrl: p.videos?.video_list?.V_720P?.url });
          }
        }
      }catch(e){ console.error("[pinterest board] JSON parse failed", e); }
    }

    if(pins.length===0){
      const imgRe = /"images"\s*:\s*\{"orig"\s*:\s*\{"url"\s*:\s*"([^"]+)"/g;
      let m: RegExpExecArray | null;
      let idx=0;
      while((m=imgRe.exec(html))!==null && idx<30){
        const u = m[1].replace(/\\u002F/g, "/");
        pins.push({ id: `pin-${idx}`, title: "Pin", image: u, original: u, isVideo: false });
        idx++;
      }
    }

    return NextResponse.json({pins: pins.slice(0,30), meta:{ rendered }});
  }catch(e:any){
    console.error("[pinterest board] exception", e);
    return NextResponse.json({errorType:"fetch_failed", message:"Network error contacting Pinterest — please try again"},{status:502});
  }
}
