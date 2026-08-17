import { ChatBubbleIcon, PersonIcon } from "@/components/icons";

export function MessageAvatar({ role }: { role: "assistant" | "user" }) {
  return role === "assistant"
    ? <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#173b2d] text-white shadow-sm" aria-label="PowerChain AI Assistant"><ChatBubbleIcon /></span>
    : <span className="grid size-8 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300" aria-label="You"><PersonIcon /></span>;
}
