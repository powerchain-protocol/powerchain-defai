"use client";

import { DEFAI_PROMPTS, DefaiSuggestions, useSavedPrompts, type DefaiMessage, type DefaiPrompt } from "@powerchain/chat";
import { useMemo, useState } from "react";

export function DefaiAssistant() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<DefaiMessage[]>([]);
  const [pending, setPending] = useState(false);
  const { savedPrompts, savePrompt } = useSavedPrompts();
  const prompts = useMemo(() => [...savedPrompts, ...DEFAI_PROMPTS.filter((item: DefaiPrompt) => !savedPrompts.some((saved: DefaiPrompt) => saved.id === item.id))].slice(0, 6), [savedPrompts]);

  async function submit(value: string) {
    const trimmed = value.trim();
    if (!trimmed || pending) return;
    const now = new Date().toISOString();
    const userMessage: DefaiMessage = { id: `user-${Date.now()}`, role: "user", content: trimmed, createdAt: now };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setPending(true);
    try {
      const response = await fetch("/api/v1/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: trimmed }) });
      const payload: unknown = await response.json();
      const content = response.ok && payload && typeof payload === "object" && "content" in payload && typeof payload.content === "string"
        ? payload.content
        : "The DeFAI assistant is temporarily unavailable. No transaction was created or submitted.";
      setMessages((current) => [...current, { id: `assistant-${Date.now()}`, role: "assistant", content, createdAt: new Date().toISOString(), status: response.ok ? "ready" : "error" }]);
    } catch {
      setMessages((current) => [...current, { id: `assistant-${Date.now()}`, role: "assistant", content: "The DeFAI assistant is temporarily unavailable. No transaction was created or submitted.", createdAt: new Date().toISOString(), status: "error" }]);
    } finally { setPending(false); }
  }

  function choose(prompt: DefaiPrompt) { savePrompt(prompt); setInput(prompt.prompt); }

  return (
    <section className="pc-cinematic-panel overflow-hidden rounded-[28px]">
      <div className="border-b border-white/10 px-5 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">PowerChain DeFAI</p><h2 className="mt-1 text-xl font-semibold text-white">DeFi AI assistant</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">Advisory-only portfolio, swap, bridge, liquidity, staking and risk guidance. Wallet signatures stay outside AI.</p></div>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] font-semibold text-slate-300">Read only</span>
        </div>
      </div>
      <div className="space-y-4 bg-white/95 p-4 sm:p-6 dark:bg-[#07100d]/94">
        <DefaiSuggestions prompts={prompts} onSelect={choose} />
        <div className="min-h-44 space-y-3 rounded-2xl border border-slate-200 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-black/20" aria-live="polite">
          {messages.length ? messages.map((message) => <div key={message.id} className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "ml-auto bg-slate-950 text-white dark:bg-white dark:text-slate-950" : "border border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200"}`}>{message.content}</div>) : <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">Ask about a swap route, bridge finality, pool risk, staking readiness, or your DeFi workflow.</p>}
        </div>
        <form onSubmit={(event) => { event.preventDefault(); submit(input); }} className="flex gap-2">
          <label className="sr-only" htmlFor="defai-message">Ask PowerChain DeFAI</label>
          <input id="defai-message" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about DeFi…" className="min-h-12 min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-[#35584a] dark:border-white/10 dark:bg-black/20 dark:text-white" />
          <button type="submit" disabled={pending} className="pc-button-primary min-h-12 rounded-2xl px-5 text-sm font-semibold disabled:opacity-50">{pending ? "Thinking…" : "Send"}</button>
        </form>
        <p className="text-[11px] leading-5 text-slate-500">AI output is informational. Any Swap, Bridge or Staking action must be rebuilt by the validated application flow and signed by the connected wallet.</p>
      </div>
    </section>
  );
}
