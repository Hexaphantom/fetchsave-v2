import { NextRequest, NextResponse } from "next/server";
import { getRenderedHtml } from "@/lib/renderedFetch";

const CACHE = new Map<string,{data:any,ts:number}>();
const TTL = 12*60*1000;

export type TikTokItem = {
  id:string;
  type:'video'|'photo';
  desc:string;
  author:string;
  authorDisplayName:string;
  thumbnail:string;
  downloadUrl?:string;
  images?:string[];
  imageThumbs?:string[];
};

export async function GET(req: NextRequest){
  const username = req.nextUrl.searchParams.get("username")?.trim().replace(/^@/,"") || "";
  if(!username || !/^[A-Za-z0-9._]{2,24}$/.test(username)){
    return NextResponse.json({errorType:"invalid", message:"Enter a valid TikTok username (2–24 characters)"},{status:400});
  }
  const cached = CACHE.get(username.toLowerCase());
  if(cached && Date.now()-cached.ts < TTL) return NextResponse.json(cached.data);

  const profileUrl=`https://www.tiktok.com/@${encodeURIComponent(username)}`;

  try{
    // Headless browser: TikTok blocks non-browser UAs and hydrates JSON client-side.
    const { html, status, rendered } = await getRenderedHtml(profileUrl, {
      waitUntil: 'networkidle',
      timeoutMs: 35000,
      waitSelector: 'script#SIGI_STATE',
    });

    if(status===404) return NextResponse.json({errorType:"not_found", message:"Account not found"},{status:404});
    if(!html || html.length < 500){
      console.error("[tiktok] empty html", { username, status, rendered });
      return NextResponse.json({errorType:"fetch_failed", message:`TikTok returned ${status || 'empty'} — please try again`},{status:502});
    }

    let data:any=null;
    const m1 = html.match(new RegExp('<script id="SIGI_STATE"[^>]*>([\\s\\S]*?)</scr' + 'ipt>'));
    if(m1) try{ data=JSON.parse(m1[1]); }catch(e){ console.error("[tiktok] SIGI_STATE parse failed", e); }
    if(!data){
      const m2 = html.match(new RegExp('<script id="UNIVERSAL_DATA"[^>]*>([\\s\\S]*?)</scr' + 'ipt>'));
      if(m2) try{ data=JSON.parse(m2[1]); }catch(e){ console.error("[tiktok] UNIVERSAL_DATA parse failed", e); }
    }
    // Pinterest-style fallback: try to pull any JSON with ItemModule inside
    if(!data){
      const m3 = html.match(new RegExp('window\\._ROUTER_DATA[^=]*=\\s*(\\{[\\s\\S]*?\\});'));
      if(m3) try{ data=JSON.parse(m3[1]); }catch{}
    }
    if(!data){
      console.error("[tiktok] no embedded JSON found", { username, rendered, htmlSnippet: html.slice(0, 2000) });
      return NextResponse.json({errorType:"fetch_failed", message:"Couldn't parse TikTok's page data — TikTok may have changed its structure or blocked the render."},{status:502});
    }

    let items:TikTokItem[]=[];
    if(data.ItemModule){
      const entries=Object.values(data.ItemModule) as any[];
      for(const v of entries){
        const isPhoto = !!v.imagePost || v.video?.id === undefined;
        if(isPhoto && v.imagePost?.images){
          const imgs: string[] = v.imagePost.images.map((im:any)=> im.imageURL?.urlList?.[0] || im.imageURL?.urlList?.[1] || "").filter(Boolean);
          const thumbs = v.imagePost.images.map((im:any)=> im.thumbnailURL?.urlList?.[0] || imgs[0] || "").filter(Boolean);
          if(imgs.length===0) continue;
          const author = v.author || username;
          const displayName = v.authorName || v.nickname || author;
          items.push({
            id: v.id || String(Date.now()),
            type:'photo',
            desc: v.desc || "",
            author,
            authorDisplayName: displayName,
            thumbnail: thumbs[0] || imgs[0] || "",
            images: imgs.slice(0,35),
            imageThumbs: thumbs,
          });
        } else if(v.video?.id){
          items.push({
            id: v.video.id,
            type:'video',
            desc: v.desc || "",
            author: v.author || username,
            authorDisplayName: v.nickname || v.author || username,
            thumbnail: v.video?.cover || v.video?.originCover || "",
            downloadUrl: v.video?.downloadAddr || v.video?.playAddr || "",
          });
        }
      }
    } else if (data?.__DEFAULT_SCOPE__?.['webapp.user-detail']) {
      // Alternate structure when rendered via networkidle
      const scope = data.__DEFAULT_SCOPE__['webapp.user-detail'];
      const list = scope?.itemList || scope?.userData?.itemList || [];
      for(const v of list){
        if(v?.video?.id) items.push({ id: String(v.video.id), type:'video', desc: v.desc||"", author: v.author||username, authorDisplayName: v.nickname||v.author||username, thumbnail: v.video?.cover||"", downloadUrl: v.video?.downloadAddr||v.video?.playAddr||""});
      }
    }

    if(items.length===0){
      const payload={status:"private", errorType:"private", message:"This user's Liked videos aren't public or no liked posts were found."};
      CACHE.set(username.toLowerCase(),{data:payload,ts:Date.now()});
      return NextResponse.json(payload);
    }

    items=items.slice(0,50);
    const payload={status:"ok", videos: items, items, meta:{ rendered }};
    CACHE.set(username.toLowerCase(),{data:payload,ts:Date.now()});
    return NextResponse.json(payload);
  }catch(e:any){
    console.error("[tiktok] exception", username, e);
    return NextResponse.json({errorType:"fetch_failed", message:"Network error contacting TikTok — please try again"},{status:502});
  }
}
