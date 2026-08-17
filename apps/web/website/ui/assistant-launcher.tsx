import Link from "next/link";
import { appUrl } from "@/website/lib/urls";
import { AILogo } from "@/website/shared/ui/ai-logo";

export function AssistantLauncher() {
  return (
    <Link href={appUrl("/chat")} className="web-assistant-launcher" aria-label="Open PowerChain AI assistant">
      <AILogo size={34} />
      <span className="hidden sm:block"><b>Ask PowerChain</b><small>Assistant · advisory only</small></span>
    </Link>
  );
}
