"use client";
import { useState } from "react";
export default function Contact(){
  const [sent,setSent]=useState(false);
  return (
    <div className="max-w-[720px] mx-auto px-6 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">Contact</h1>
      <p className="mt-2 text-sm text-zinc-600">Have a question, bug report, or takedown request? We reply within 1–2 business days.</p>
      <div className="mt-6 bg-white border border-zinc-200 rounded-2xl p-6">
        <p className="text-sm"><b>Email:</b> <a href="mailto:support@fetchsave.example.com" className="underline">support@fetchsave.example.com</a> — or use the form below.</p>
        {!sent ? (
          <form onSubmit={e=>{e.preventDefault(); setSent(true);}} className="mt-6 space-y-3">
            <input required placeholder="Your email" type="email" className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm"/>
            <input required placeholder="Subject" className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm"/>
            <textarea required placeholder="Message" rows={5} className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm"></textarea>
            <button type="submit" className="px-6 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold">Send message</button>
          </form>
        ):(<div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800">Thanks — your message was sent. We&apos;ll be in touch soon.</div>)}
      </div>
    </div>
  );
}
