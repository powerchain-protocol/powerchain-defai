import type { DefaiPrompt } from "./types/prompts";

export function DefaiSuggestions({ prompts, onSelect }: { prompts: readonly DefaiPrompt[]; onSelect: (prompt: DefaiPrompt) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2" aria-label="DeFi assistant suggestions">
      {prompts.map((prompt) => (
        <button key={prompt.id} type="button" onClick={() => onSelect(prompt)} className="rounded-2xl border border-slate-200/80 bg-white/70 p-3 text-left transition hover:border-slate-300 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]">
          <span className="block text-sm font-semibold text-slate-950 dark:text-white">{prompt.title}</span>
          <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">{prompt.prompt}</span>
        </button>
      ))}
    </div>
  );
}
