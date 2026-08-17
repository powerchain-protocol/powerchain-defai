"use client";

import { useMemo, useRef, useState } from "react";
import { DEFAI_PROMPTS, DefaiSuggestions, useSavedPrompts, type DefaiMessage, type DefaiPrompt } from "@powerchain/chat";
import { apiFetch } from "@/lib/api/browser-api";
import { ChatBubbleIcon, ImageIcon, LightningBoltIcon, Link2Icon, LockClosedIcon, PaperPlaneIcon } from "@/components/icons";
import { MessageAvatar } from "./message-avatar";
import { Textarea } from "@/components/ui/textarea";
import { CHAT_MESSAGE_MAX_LENGTH } from "@/types/chat";

const MAX_MESSAGE_LENGTH = CHAT_MESSAGE_MAX_LENGTH;

export function ChatInterface() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<DefaiMessage[]>([]);
  const [pending, setPending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { savedPrompts, savePrompt } = useSavedPrompts();
  const prompts = useMemo(
    () => [...savedPrompts, ...DEFAI_PROMPTS.filter((item: DefaiPrompt) => !savedPrompts.some((saved: DefaiPrompt) => saved.id === item.id))].slice(0, 6),
    [savedPrompts],
  );

  function insertTemplate(template: string, selectionStart: number, selectionEnd: number) {
    const current = input;
    const next = `${current.slice(0, selectionStart)}${template}${current.slice(selectionEnd)}`.slice(0, MAX_MESSAGE_LENGTH);
    setInput(next);
    requestAnimationFrame(() => {
      const node = textareaRef.current;
      if (!node) return;
      const cursor = Math.min(selectionStart + template.length, next.length);
      node.focus();
      node.setSelectionRange(cursor, cursor);
    });
  }

  function addLink() {
    const node = textareaRef.current;
    const start = node?.selectionStart ?? input.length;
    const end = node?.selectionEnd ?? input.length;
    insertTemplate("[link](https://)", start, end);
  }

  function addImage() {
    const node = textareaRef.current;
    const start = node?.selectionStart ?? input.length;
    const end = node?.selectionEnd ?? input.length;
    insertTemplate("![image](https://)", start, end);
  }

  async function submit(value: string) {
    const trimmed = value.trim();
    if (!trimmed || pending || trimmed.length > MAX_MESSAGE_LENGTH) return;

    const userMessage: DefaiMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setPending(true);

    try {
      const response = await apiFetch("/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const payload: unknown = await response.json();
      const content = response.ok && payload && typeof payload === "object" && "content" in payload && typeof payload.content === "string"
        ? payload.content
        : "The DeFAI assistant is temporarily unavailable. No transaction was created or submitted.";
      setMessages((current) => [...current, {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content,
        createdAt: new Date().toISOString(),
        status: response.ok ? "ready" : "error",
      }]);
    } catch {
      setMessages((current) => [...current, {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "The DeFAI assistant is temporarily unavailable. No transaction was created or submitted.",
        createdAt: new Date().toISOString(),
        status: "error",
      }]);
    } finally {
      setPending(false);
    }
  }

  function choose(prompt: DefaiPrompt) {
    savePrompt(prompt);
    setInput(prompt.prompt.slice(0, MAX_MESSAGE_LENGTH));
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_12px_40px_rgba(15,23,42,.055)] dark:border-white/10 dark:bg-[#07100d]">
      <div className="grid border-b border-slate-200 bg-[#f7f9f8] text-slate-950 dark:border-white/10 dark:bg-[#07100d] dark:text-white lg:grid-cols-[1fr_auto]">
        <div className="px-5 py-5 sm:px-6">
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#557568] dark:text-[#b8c8c0]"><span className="grid size-8 place-items-center rounded-xl border border-[#d8e1dc] bg-white text-[#294a3b] dark:border-white/10 dark:bg-white/[0.05] dark:text-[#d0dcd6]"><ChatBubbleIcon /></span>PowerChain AI Assistant</p>
          <h2 className="mt-3 text-xl font-semibold tracking-tight">DeFi context before execution</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">Ask about routes, positions, liquidity, bridge state, staking readiness and operational risk. AI cannot sign or submit wallet transactions.</p>
        </div>
        <div className="hidden items-center border-l border-slate-200 px-6 dark:border-white/10 lg:flex">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
            <p className="flex items-center gap-2 text-xs font-semibold text-[#294a3b] dark:text-[#d0dcd6]"><LockClosedIcon />Advisory boundary</p>
            <p className="mt-1 text-[11px] text-slate-500">No signing authority</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-6">
        <DefaiSuggestions prompts={prompts} onSelect={choose} />

        <div className="no-scrollbar min-h-[300px] max-h-[54vh] space-y-4 overflow-y-auto rounded-2xl border border-slate-200 bg-[#f7f9f8] p-4 dark:border-white/10 dark:bg-black/20" aria-live="polite">
          {messages.length ? messages.map((message) => {
            const user = message.role === "user";
            return (
              <div key={message.id} className={`flex items-end gap-2.5 ${user ? "justify-end" : "justify-start"}`}>
                {!user ? <MessageAvatar role="assistant" /> : null}
                <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${user ? "bg-[#173b2d] text-white" : "border border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200"}`}>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] opacity-55">{user ? "You" : "PowerChain AI"}</p>
                  {message.content}
                </div>
                {user ? <MessageAvatar role="user" /> : null}
              </div>
            );
          }) : (
            <div className="flex min-h-64 flex-col items-center justify-center text-center">
              <span className="grid size-12 place-items-center rounded-2xl border border-[#cdd9d2] bg-white text-[#173b2d] shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-[#d0dcd6]"><LightningBoltIcon /></span>
              <p className="mt-4 text-base font-semibold text-slate-800 dark:text-slate-100">What would you like to inspect?</p>
              <p className="mt-1 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-400">Choose a suggestion above or ask a question about PowerChain, Solana, Sui, swaps, bridge finality, staking or portfolio state.</p>
            </div>
          )}
          {pending ? <div className="flex items-center gap-2.5"><MessageAvatar role="assistant" /><div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-medium text-slate-500 dark:border-white/10 dark:bg-white/[0.05]">Reviewing current context…</div></div> : null}
        </div>

        <form onSubmit={(event) => { event.preventDefault(); void submit(input); }} className="pc-chat-composer overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_8px_24px_rgba(7,16,13,.055)] transition focus-within:border-[#8fa79c] focus-within:shadow-[0_0_0_3px_rgba(85,117,104,.10),0_12px_30px_rgba(7,16,13,.07)] dark:border-white/10 dark:bg-white/[.035] dark:focus-within:border-[#718c7f]">
          <label className="sr-only" htmlFor="defai-message">Ask PowerChain DeFAI</label>
          <Textarea
            ref={textareaRef}
            id="defai-message"
            rows={2}
            maxLength={MAX_MESSAGE_LENGTH}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void submit(input);
              }
            }}
            placeholder="Message PowerChain AI…"
            className="no-scrollbar max-h-36 min-h-[72px] resize-none rounded-none px-4 pb-2 pt-3.5"
          />
          <div className="flex items-center gap-1.5 border-t border-slate-100 px-2.5 py-2 dark:border-white/8">
            <button type="button" onClick={addImage} className="grid size-9 place-items-center rounded-xl text-[#294a3b] transition hover:bg-[#eef3f0] dark:text-[#d0dcd6] dark:hover:bg-white/[.06]" aria-label="Insert image URL"><ImageIcon /></button>
            <button type="button" onClick={addLink} className="grid size-9 place-items-center rounded-xl text-[#294a3b] transition hover:bg-[#eef3f0] dark:text-[#d0dcd6] dark:hover:bg-white/[.06]" aria-label="Insert link"><Link2Icon /></button>
            <span className="ml-auto text-[10px] font-semibold tabular-nums text-slate-400" aria-live="polite">{input.length}/{MAX_MESSAGE_LENGTH}</span>
            <button type="submit" disabled={pending || !input.trim()} className="pc-button-primary ml-1 grid size-9 shrink-0 place-items-center rounded-xl disabled:cursor-not-allowed disabled:opacity-45" aria-label={pending ? "AI is responding" : "Send message"}>{pending ? <span className="text-[10px]">•••</span> : <PaperPlaneIcon />}</button>
          </div>
        </form>
        <p className="text-[11px] leading-5 text-slate-500">Enter sends · Shift+Enter adds a line · Image and link buttons insert URL references. AI output is informational; executable actions are rebuilt in validated application flows and require wallet approval.</p>
      </div>
    </section>
  );
}
