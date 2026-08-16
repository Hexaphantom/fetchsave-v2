import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";

export async function POST(req: NextRequest){
  try{
    const { files } = await req.json() as { files: {url:string,name:string}[] };
    if(!files || !Array.isArray(files) || files.length===0) return NextResponse.json({error:"No files"},{status:400});
    if(files.length>20) return NextResponse.json({error:"Too many files (max 20)"},{status:400});
    const zip = new JSZip();
    const results = await Promise.all(files.map(async (f, i)=>{
      try{
        const url = decodeURIComponent(f.url);
        const res = await fetch(url, { headers:{ "User-Agent":"Mozilla/5.0" } });
        if(!res.ok) throw new Error(`fetch ${res.status}`);
        const buf = await res.arrayBuffer();
        zip.file(f.name || `file-${i}`, Buffer.from(buf));
        return true;
      }catch(e){
        console.error("[bulk-zip] failed file", f.name, e);
        return false;
      }
    }));
    const successCount = results.filter(Boolean).length;
    if(successCount===0) return NextResponse.json({error:"All downloads failed"},{status:502});
    const blob = await zip.generateAsync({type:"arraybuffer", compression:"STORE"});
    return new NextResponse(blob as any, {
      headers:{
        "Content-Type":"application/zip",
        "Content-Disposition": `attachment; filename="fetchsave-${Date.now()}.zip"`,
        "Cache-Control":"no-store"
      }
    });
  }catch(e:any){
    console.error("[bulk-zip] error", e);
    return NextResponse.json({error:"Zip failed"},{status:500});
  }
}
