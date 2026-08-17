import {
  ChatBubbleIcon,
  GearIcon,
  GlobeIcon,
  LightningBoltIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";
import type { ComponentType } from "react";
import type { DefaiPrompt, DefaiPromptCategory } from "./types/prompts";

const ICONS: Record<DefaiPromptCategory, ComponentType<{ className?: string }>> = {
  portfolio: MagnifyingGlassIcon,
  swap: LightningBoltIcon,
  bridge: GlobeIcon,
  liquidity: GearIcon,
  staking: LockClosedIcon,
  risk: ChatBubbleIcon,
};

export function DefaiSuggestions({ prompts, onSelect }: { prompts: readonly DefaiPrompt[]; onSelect: (prompt: DefaiPrompt) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3" aria-label="DeFi assistant suggestions">
      {prompts.map((prompt) => {
        const Icon = ICONS[prompt.category];
        return (
          <button key={prompt.id} type="button" onClick={() => onSelect(prompt)} className="group rounded-2xl border border-slate-200/80 bg-white/80 p-3.5 text-left transition hover:-translate-y-0.5 hover:border-[#9eafa7] hover:bg-white hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-[#557568]/50 dark:hover:bg-white/[0.07]">
            <span className="grid size-8 place-items-center rounded-xl border border-slate-200 bg-[#f4f6f5] text-[#294a3b] transition group-hover:border-[#9eafa7] dark:border-white/10 dark:bg-white/[0.04] dark:text-[#d0dcd6]"><Icon className="size-4" /></span>
            <span className="mt-3 block text-sm font-semibold text-slate-950 dark:text-white">{prompt.title}</span>
            <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">{prompt.prompt}</span>
          </button>
        );
      })}
    </div>
  );
}
