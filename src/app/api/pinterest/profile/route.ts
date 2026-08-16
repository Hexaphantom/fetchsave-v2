import { NextRequest, NextResponse } from "next/server";
import { getRenderedHtml } from "@/lib/renderedFetch";

const CACHE = new Map<string,{data:any,ts:number}>();
const TTL=12*60*1000;

export async function GET(req:NextRequest){
  const username = req.nextUrl.searchParams.get("username")?.trim().replace(/^@/,"").toLowerCase() || "";
  if(!username) return NextResponse.json({errorType:"invalid", message:"Enter a valid Pinterest username"},{status:400});
  const cached=CACHE.get(username);
  if(cached && Date.now()-cached.ts<TTL) return NextResponse.json(cached.data);

  const url=`https://www.pinterest.com/${encodeURIComponent(username)}/`;

  try{
    // Headless browser: Pinterest renders boards client-side via JS after load
    const { html, status, rendered } = await getRenderedHtml(url, {
      waitUntil: 'networkidle',
      timeoutMs: 35000,
      waitSelector: 'script#__PWS_DATA__, script#initial-state',
    });

    if(status===404) return NextResponse.json({errorType:"not_found", message:"Pinterest account not found"}, {status:404});
    if(!html || html.length < 500){
      console.error("[pinterest profile] empty html", { username, status, rendered });
      return NextResponse.json({errorType:"fetch_failed", message:`Pinterest returned ${status || 'empty'} — please try again`},{status:502});
    }

    let boards:any[]=[];

    const embeddedMatch = html.match(new RegExp('<script id="initial-state"[^>]*>([\\s\\S]*?)</scr' + 'ipt>')) || html.match(new RegExp('<script id="__PWS_DATA__"[^>]*>([\\s\\S]*?)</scr' + 'ipt>')) || html.match(new RegExp('<script id="__PWS_INITIAL_DATA__"[^>]*>([\\s\\S]*?)</scr' + 'ipt>'));
    if(embeddedMatch){
      try{
        const json=JSON.parse(embeddedMatch[1]);
        const resourceResponses = json?.resourceResponses || json?.props?.initialReduxState?.resourceResponses || json?.initialReduxState?.resourceResponses || [];
        for(const r of resourceResponses){
          const data=r?.data;
          if(Array.isArray(data)){
            for(const b of data){
              if(b?.name && (b?.pin_count!==undefined || b?.pinCount!==undefined)){
                boards.push({id:b.id||b.board_id||b.name, name:b.name, pinCount:b.pin_count||b.pinCount||0, cover: b.image_cover_url || b.cover_images?.[0]?.url || b.cover?.url || ""});
              }
            }
          }
          // Also handle single board objects
          if(r?.data?.board && r?.data?.board?.name) {
            const b=r.data.board; boards.push({id:b.id||b.name, name:b.name, pinCount:b.pin_count||0, cover: b.image_cover_url||""});
          }
        }
        // Alternative path: initialReduxState.boards
        const altBoards = json?.props?.initialReduxState?.boards || json?.initialReduxState?.boards;
        if(boards.length===0 && altBoards){
          for(const b of Object.values(altBoards as any)){
            const bb=b as any; if(bb?.name) boards.push({id:bb.id||bb.name, name:bb.name, pinCount:bb.pin_count||0, cover: bb.image_cover_url||""});
          }
        }
      }catch(e){ console.error("[pinterest profile] JSON parse failed", e); }
    }

    if(boards.length===0){
      const re = /"name"\s*:\s*"([^"]+)"\s*,\s*"pin_count"\s*:\s*(\d+)/g;
      let m: RegExpExecArray | null;
      const matches:any[]=[];
      while((m=re.exec(html))!==null) matches.push(m);
      boards = matches.slice(0,20).map((mm:any,i:number)=>({id:`board-${i}-${mm[1]}`, name: mm[1], pinCount: parseInt(mm[2]), cover: ""}));
    }

    const payload={boards: boards.slice(0,20), meta:{ rendered }};
    CACHE.set(username,{data:payload,ts:Date.now()});
    return NextResponse.json(payload);
  }catch(e:any){
    console.error("[pinterest profile] exception", e);
    return NextResponse.json({errorType:"fetch_failed", message:"Network error contacting Pinterest — please try again"},{status:502});
  }
}
