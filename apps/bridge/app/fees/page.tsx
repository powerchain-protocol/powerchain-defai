import type { Metadata } from "next";
import Link from "next/link";
import { FeeTransparencyCard } from "@/components/bridge/fee-transparency-card";
import { ServiceFeeEstimator } from "@/components/bridge/service-fee-estimator";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Bridge Fees | PowerChain",
  description: "Inspect governed PowerChain Bridge service-fee policies and calculate exact source-chain debit without changing the 1:1 bridge principal.",
};

export default function FeesPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <PageHeader
        eyebrow="PowerChain Bridge"
        title="Transparent service fees"
        description="Preview the exact governed fee before signing. Your PWRC↔wPWRC bridge principal remains 1:1; the service fee and source-chain gas are separate."
        actions={<Link href="/bridge" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900">Back to bridge</Link>}
      />
      <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <ServiceFeeEstimator />
        <FeeTransparencyCard />
      </div>
      <section className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Fee safeguards">
        <Feature title="Quote-bound" text="The fee amount and recipient are locked into the issued quote." />
        <Feature title="Governed" text="Policy and fee-wallet changes require the production governance workflow." />
        <Feature title="Verified" text="Bridge completion waits for independently verified source-chain fee evidence." />
      </section>
    </main>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><h2 className="text-sm font-semibold text-slate-950 dark:text-white">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{text}</p></div>;
}
