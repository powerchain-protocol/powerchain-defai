import type { Metadata } from "next";
import { ClaimPageClient } from "@/components/claim/claim-page-client";
import { PageHeader } from "@/components/ui/page-header";
export const metadata: Metadata = {
  title: "Claim",
  description: "Claim eligible PWRC through server-authoritative eligibility, wallet proof, atomic reservation and persisted finality tracking.",
};

export const dynamic = "force-dynamic";
export default function ClaimPage() {
  return <main className="mx-auto max-w-3xl space-y-5">
    <PageHeader eyebrow="PowerChain Claim" title="Claim PWRC" description="Server-authoritative trusted-wallet eligibility, wallet proof, atomic reservation, payout submission and finality tracking." />
    <ClaimPageClient />
  </main>;
}
