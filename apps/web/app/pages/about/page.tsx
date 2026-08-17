import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, CheckCircledIcon, LockClosedIcon, ReaderIcon } from "@radix-ui/react-icons";
import { MiniHero } from "@/website/ui/mini-hero";

export const metadata: Metadata = {
  title: "About",
  description: "How PowerChain combines wallet-controlled execution, runtime evidence and advisory AI across Solana and Sui.",
};

const principles = [
  [LockClosedIcon, "Wallet authority", "Executable actions remain wallet-approved. The website and AI surfaces never become a custodial signer."],
  [ReaderIcon, "Observable operations", "Provider readiness, finality, reconciliation and recovery are visible product states rather than hidden infrastructure details."],
  [CheckCircledIcon, "Evidence before narrative", "Balances, deployment state and settlement are verified from authoritative runtime evidence instead of inferred from AI text or explorer UI."],
] as const;

const operatingModel = [
  ["01", "Understand", "AI and diagnostics organize context, provider health and route constraints."],
  ["02", "Review", "The application rebuilds actions inside typed, validated transaction flows."],
  ["03", "Approve", "The connected wallet remains the signing authority for executable operations."],
  ["04", "Verify", "Finality and persisted reconciliation determine completion and recovery state."],
] as const;

export default function AboutPage() {
  return (
    <>
      <MiniHero
        eyebrow="About PowerChain"
        title="Financial infrastructure with human control at the center."
        description="PowerChain combines advisory AI, cross-chain operations and wallet intelligence in one disciplined operating environment built around explicit execution boundaries."
        backHref="/pages"
        backLabel="All pages"
        actions={<><Link href="/open/dashboard" className="web-button web-button-primary gap-2">Open workspace <ArrowRightIcon /></Link><Link href="/pages/security" className="web-button web-button-secondary">Security model</Link></>}
      />

      <section className="web-section py-16 sm:py-20">
        <div className="web-container">
          <div className="grid gap-4 md:grid-cols-3">
            {principles.map(([Icon, title, body]) => (
              <article key={title} className="web-card rounded-[24px] p-6 sm:p-7">
                <span className="web-icon-tile"><Icon /></span>
                <h2 className="web-display mt-5 text-xl font-semibold text-brand-950 dark:text-brand-100">{title}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">{body}</p>
              </article>
            ))}
          </div>

          <div className="mt-14 grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
            <div>
              <p className="web-eyebrow">Operating model</p>
              <h2 className="web-display mt-4 text-3xl font-semibold tracking-[-.035em] text-brand-950 dark:text-brand-100 sm:text-4xl">Context first. Wallet approval always.</h2>
              <p className="web-section-copy mt-5">The platform is organized so intelligence can improve decision quality without silently expanding execution authority.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {operatingModel.map(([number, title, body]) => (
                <article key={number} className="web-card rounded-[22px] p-5">
                  <span className="text-xs font-extrabold tracking-[.16em] text-brand-600 dark:text-brand-200">{number}</span>
                  <h3 className="web-display mt-3 text-lg font-semibold text-brand-950 dark:text-brand-100">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
