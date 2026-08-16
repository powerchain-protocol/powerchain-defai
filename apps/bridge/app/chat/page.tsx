import { DefaiAssistant } from "@/components/defai/defai-assistant";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = { title: "AI Assistant" };
export default function ChatPage() {
  return <div className="space-y-6"><PageHeader eyebrow="DeFAI" title="AI Assistant" description="DeFi guidance across PowerChain Swap, Bridge, liquidity, staking and portfolio workflows without surrendering wallet control." /><DefaiAssistant /></div>;
}
