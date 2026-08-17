"use client";

import { useMemo, useState } from "react";
import { DEFAI_PROMPTS, DefaiSuggestions, useSavedPrompts, type DefaiMessage, type DefaiPrompt } from "@powerchain/chat";
import { apiFetch } from "@/lib/api/browser-api";
import { ChatBubbleIcon, LightningBoltIcon, LockClosedIcon, PaperPlaneIcon } from "@/components/icons";
import { MessageAvatar } from "./message-avatar";

export function ChatInterface() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<DefaiMessage[]>([]);
  const [pending, setPending] = useState(false);
  const { savedPrompts, savePrompt } = useSavedPrompts();
  const prompts = useMemo(() => [...savedPrompts, ...DEFAI_PROMPTS.filter((item: DefaiPrompt) => !savedPrompts.some((saved: DefaiPrompt) => saved.id === item.id))].slice(0, 6), [savedPrompts]);

  async function submit(value: string) {
    const trimmed = value.trim();
    if (!trimmed || pending) return;
    const userMessage: DefaiMessage = { id: `user-${Date.now()}`, role: "user", content: trimmed, createdAt: new Date().toISOString() };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setPending(true);
    try {
      const response = await apiFetch("/api/v1/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: trimmed }) });
      const payload: unknown = await response.json();
      const content = response.ok && payload && typeof payload === "object" && "content" in payload && typeof payload.content === "string" ? payload.content : "The DeFAI assistant is temporarily unavailable. No transaction was created or submitted.";
      setMessages((current) => [...current, { id: `assistant-${Date.now()}`, role: "assistant", content, createdAt: new Date().toISOString(), status: response.ok ? "ready" : "error" }]);
    } catch {
      setMessages((current) => [...current, { id: `assistant-${Date.now()}`, role: "assistant", content: "The DeFAI assistant is temporarily unavailable. No transaction was created or submitted.", createdAt: new Date().toISOString(), status: "error" }]);
    } finally { setPending(false); }
  }

  function choose(prompt: DefaiPrompt) { savePrompt(prompt); setInput(prompt.prompt); }

  return <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_18px_60px_rgba(15,23,42,.06)] dark:border-white/10 dark:bg-[#07100d]">
    <div className="grid border-b border-slate-200/80 bg-[#07100d] text-white dark:border-white/10 lg:grid-cols-[1fr_auto]">
      <div className="px-5 py-5 sm:px-6"><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b8c8c0]"><span className="grid size-8 place-items-center rounded-xl border border-white/10 bg-white/[0.05]"><ChatBubbleIcon /></span>PowerChain AI Assistant</p><h2 className="mt-3 text-xl font-semibold tracking-tight">DeFi context before execution</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">Ask about routes, positions, liquidity, bridge state, staking readiness and operational risk. AI cannot sign or submit wallet transactions.</p></div>
      <div className="hidden items-center border-l border-white/10 px-6 lg:flex"><div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"><p className="flex items-center gap-2 text-xs font-semibold text-[#d0dcd6]"><LockClosedIcon />Advisory boundary</p><p className="mt-1 text-[11px] text-slate-500">No signing authority</p></div></div>
    </div>
    <div className="space-y-4 p-4 sm:p-6">
      <DefaiSuggestions prompts={prompts} onSelect={choose} />
      <div className="no-scrollbar min-h-[300px] max-h-[54vh] space-y-4 overflow-y-auto rounded-2xl border border-slate-200 bg-[#f7f9f8] p-4 dark:border-white/10 dark:bg-black/20" aria-live="polite">
        {messages.length ? messages.map((message) => { const user = message.role === "user"; return <div key={message.id} className={`flex items-end gap-2.5 ${user ? "justify-end" : "justify-start"}`}>{!user ? <MessageAvatar role="assistant" /> : null}<div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${user ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950" : "border border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200"}`}><p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] opacity-55">{user ? "You" : "PowerChain AI"}</p>{message.content}</div>{user ? <MessageAvatar role="user" /> : null}</div>; }) : <div className="flex min-h-64 flex-col items-center justify-center text-center"><span className="grid size-12 place-items-center rounded-2xl bg-[#173b2d] text-white shadow-lg shadow-[#173b2d]/10"><LightningBoltIcon /></span><p className="mt-4 text-base font-semibold text-slate-800 dark:text-slate-100">What would you like to inspect?</p><p className="mt-1 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-400">Choose a suggestion above or ask a question about PowerChain, Solana, Sui, swaps, bridge finality, staking or portfolio state.</p></div>}
        {pending ? <div className="flex items-center gap-2.5"><MessageAvatar role="assistant" /><div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-medium text-slate-500 dark:border-white/10 dark:bg-white/[0.05]">Reviewing current context…</div></div> : null}
      </div>
      <form onSubmit={(event) => { event.preventDefault(); void submit(input); }} className="flex items-end gap-2"><div className="min-w-0 flex-1"><label className="sr-only" htmlFor="defai-message">Ask PowerChain DeFAI</label><textarea id="defai-message" rows={1} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void submit(input); } }} placeholder="Ask PowerChain about DeFi…" className="no-scrollbar max-h-32 min-h-12 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-[#35584a] focus:ring-2 focus:ring-[#35584a]/10 dark:border-white/10 dark:bg-black/20 dark:text-white" /></div><button type="submit" disabled={pending || !input.trim()} className="pc-button-primary grid size-12 shrink-0 place-items-center rounded-2xl disabled:cursor-not-allowed disabled:opacity-50" aria-label={pending ? "AI is responding" : "Send message"}>{pending ? <span className="text-xs">•••</span> : <PaperPlaneIcon />}</button></form>
      <p className="text-[11px] leading-5 text-slate-500">Enter sends · Shift+Enter adds a line. AI output is informational; executable actions are rebuilt in validated application flows and require wallet approval.</p>
    </div>
  </section>;
}
