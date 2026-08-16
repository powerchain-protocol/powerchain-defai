"use client";

import { useCallback, useEffect, useState } from "react";
import type { DefaiPrompt, SavedDefaiPrompt } from "../types/prompts";

const STORAGE_KEY = "powerchain.defai.saved-prompts.v1";

function readSavedPrompts(): SavedDefaiPrompt[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item: unknown): item is SavedDefaiPrompt => Boolean(item && typeof item === "object" && "id" in item && "prompt" in item)) : [];
  } catch { return []; }
}

export function useSavedPrompts() {
  const [savedPrompts, setSavedPrompts] = useState<SavedDefaiPrompt[]>([]);
  useEffect(() => setSavedPrompts(readSavedPrompts()), []);
  const persist = useCallback((next: SavedDefaiPrompt[]) => { setSavedPrompts(next); window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }, []);
  const savePrompt = useCallback((prompt: DefaiPrompt) => persist([...savedPrompts.filter((item) => item.id !== prompt.id), { ...prompt, savedAt: new Date().toISOString() }]), [persist, savedPrompts]);
  const removePrompt = useCallback((id: string) => persist(savedPrompts.filter((item) => item.id !== id)), [persist, savedPrompts]);
  return { savedPrompts, savePrompt, removePrompt };
}
