"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "powerchain.bridge.form-draft.v1";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_RECIPIENT_LENGTH = 128;
const AMOUNT = /^\d*(?:\.\d{0,9})?$/;

export type BridgeDraft = {
  amount: string;
  sourceChain: "SOLANA" | "SUI";
  destinationChain: "SOLANA" | "SUI";
  recipient: string;
  savedAt: number;
};

const EMPTY: BridgeDraft = { amount: "", sourceChain: "SUI", destinationChain: "SOLANA", recipient: "", savedAt: 0 };

function safeDraft(value: unknown): BridgeDraft | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<BridgeDraft>;
  if (candidate.sourceChain !== "SOLANA" && candidate.sourceChain !== "SUI") return null;
  if (candidate.destinationChain !== "SOLANA" && candidate.destinationChain !== "SUI") return null;
  if (candidate.sourceChain === candidate.destinationChain) return null;
  if (typeof candidate.amount !== "string" || !AMOUNT.test(candidate.amount) || candidate.amount.length > 40) return null;
  if (typeof candidate.recipient !== "string" || candidate.recipient.length > MAX_RECIPIENT_LENGTH) return null;
  if (typeof candidate.savedAt !== "number" || !Number.isFinite(candidate.savedAt) || Date.now() - candidate.savedAt > MAX_AGE_MS) return null;
  return candidate as BridgeDraft;
}

export function useBridgeDraft(initial?: Partial<Omit<BridgeDraft, "savedAt">>) {
  const [draft, setDraft] = useState<BridgeDraft>(() => ({ ...EMPTY, ...initial, savedAt: 0 }));
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) {
        const parsed = safeDraft(JSON.parse(raw));
        if (parsed) setDraft(parsed);
        else sessionStorage.removeItem(KEY);
      }
    } catch { /* invalid browser state is ignored */ }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    const next = { ...draft, savedAt: Date.now() };
    try { sessionStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  }, [draft.amount, draft.sourceChain, draft.destinationChain, draft.recipient, restored]);

  const update = useCallback((patch: Partial<Omit<BridgeDraft, "savedAt">>) => {
    setDraft((current) => {
      const next = { ...current, ...patch };
      if (next.sourceChain === next.destinationChain) next.destinationChain = next.sourceChain === "SOLANA" ? "SUI" : "SOLANA";
      if (!AMOUNT.test(next.amount)) next.amount = current.amount;
      next.amount = next.amount.slice(0, 40);
      next.recipient = next.recipient.slice(0, MAX_RECIPIENT_LENGTH);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setDraft({ ...EMPTY, ...initial, savedAt: 0 });
    try { sessionStorage.removeItem(KEY); } catch {}
  }, [initial]);

  return { draft, restored, update, clear };
}
