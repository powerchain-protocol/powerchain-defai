import { ChatBubbleIcon, PersonIcon } from "@/components/icons";
import { Avatar } from "@/components/ui/avatar";

export function MessageAvatar({ role }: { role: "assistant" | "user" }) {
  return role === "assistant"
    ? <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-[#173b2d] text-white shadow-[0_6px_18px_rgba(23,59,45,.18)]" aria-label="PowerChain AI Assistant"><ChatBubbleIcon /></span>
    : <span className="relative" aria-label="You"><Avatar fallback="You" size={36} className="rounded-2xl" /><span className="pointer-events-none absolute inset-0 grid place-items-center text-slate-500 dark:text-slate-300"><PersonIcon /></span></span>;
}
