import type { Metadata } from "next";
import Link from "next/link";
import { FeeTransparencyCard } from "@/components/bridge/fee-transparency-card";
import { ServiceFeeEstimator } from "@/components/bridge/service-fee-estimator";
import { buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { APP_ROUTES } from "@/config/app-routes";

export const metadata: Metadata = {
  title: "Bridge Fees",
  description: "Inspect governed PowerChain Bridge service-fee policies and calculate exact source-chain debit without changing the 1:1 bridge principal.",
};

export default function FeesPage() {
  return (
    <main className="mx-auto w-full max-w-6xl py-2 sm:py-4">
      <PageHeader
        eyebrow="PowerChain Bridge"
        title="Transparent service fees"
        description="Preview the exact governed fee before signing. Your PWRC↔wPWRC bridge principal remains 1:1; the service fee and source-chain gas are separate."
        actions={<Link href={APP_ROUTES.bridge} className={buttonClassName({ variant: "secondary", size: "sm" })}>Back to bridge</Link>}
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
  return <Card className="p-4"><h2 className="text-sm font-semibold text-slate-950 dark:text-white">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{text}</p></Card>;
}
