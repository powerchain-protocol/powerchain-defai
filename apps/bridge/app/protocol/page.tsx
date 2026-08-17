import type { Metadata } from "next";
import { ProtocolDashboard } from "@/components/protocol/protocol-dashboard";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Protocol", description: "Runtime-verified PowerChain Solana programs and Sui contracts." };
export default function ProtocolPage() { return <main className="mx-auto max-w-6xl space-y-6"><PageHeader eyebrow="Protocol" title="Programs & contracts" description="Source-controlled program inventory with fail-closed runtime deployment evidence."/><ProtocolDashboard/></main>; }
