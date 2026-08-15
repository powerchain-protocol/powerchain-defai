import Link from "next/link";
import { getClaim } from "@/server/services/claim-service";
import { PageHeader } from "@/components/ui/page-header";
import { baseUnitsToDecimalString } from "@/lib/bridge/base-units";
export const dynamic = "force-dynamic";
export default async function ClaimStatusPage({ params }: { params: Promise<{ claimId: string }> }) {
  const { claimId } = await params; const claim = await getClaim(claimId);
  return <main className="mx-auto max-w-3xl space-y-5"><PageHeader eyebrow="PowerChain Claim" title="Claim status" description="Persisted claim reservation, submission and payout finality state." />
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Claim</p><h2 className="mt-1 font-mono text-sm">{claim.id}</h2></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold dark:bg-slate-900">{claim.status}</span></div><dl className="mt-5 grid gap-4 sm:grid-cols-2"><Item label="Wallet" value={claim.wallet}/><Item label="Amount" value={`${baseUnitsToDecimalString(BigInt(claim.amountBaseUnits.toFixed(0)),9)} PWRC`}/><Item label="Source transaction" value={claim.sourceTx ?? "Pending"}/><Item label="Updated" value={claim.updatedAt.toISOString()}/></dl>{claim.status === "UNKNOWN" ? <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Submission outcome is unknown. Do not create another claim. Keep checking this persisted claim.</div> : null}<div className="mt-5 flex gap-2"><Link href="/claim" className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold dark:border-slate-700">Claim page</Link><Link href="/wallet" className="rounded-xl bg-[#0B1730] px-4 py-2.5 text-sm font-semibold text-white">Wallet</Link></div></section>
  </main>;
}
function Item({label,value}:{label:string;value:string}) { return <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 break-all text-sm font-medium">{value}</dd></div>; }
