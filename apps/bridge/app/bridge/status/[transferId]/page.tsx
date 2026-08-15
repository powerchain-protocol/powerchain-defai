import { LiveTransferCard } from "@/components/bridge/live-transfer-card";
import { PageHeader } from "@/components/ui/page-header";
export const dynamic = "force-dynamic";
export default async function TransferStatusPage({ params }: { params: Promise<{ transferId: string }> }) {
  const { transferId } = await params;
  return <main className="mx-auto max-w-4xl space-y-5"><PageHeader eyebrow="PowerChain Bridge" title="Transfer status" description="Live tracking prefers realtime transport and safely falls back to persisted status polling." /><LiveTransferCard transferId={transferId} /></main>;
}
