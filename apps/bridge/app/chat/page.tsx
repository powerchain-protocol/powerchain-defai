import { ChatInterface } from "@/components/chat/chat-interface";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = { title: "AI Assistant", description: "Use PowerChain AI for DeFi guidance, protocol context and operational diagnostics without granting transaction authority." };
export default function ChatPage() {
  return <div className="space-y-5"><PageHeader eyebrow="Intelligence" title="AI Assistant" description="DeFi guidance across PowerChain Swap, Bridge, liquidity, staking and portfolio workflows without surrendering wallet control." /><ChatInterface /></div>;
}
