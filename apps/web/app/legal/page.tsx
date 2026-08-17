import Link from "next/link";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { MiniHero } from "@/website/ui/mini-hero";

const pages = [
  ["privacy", "Privacy Policy", "Browser preferences, wallet metadata and standard service request information."],
  ["terms", "Terms of Use", "Conditions for using the public site and non-custodial application gateway."],
  ["cookies", "Cookie & Storage Policy", "Essential cookies and browser storage used for product preferences."],
  ["disclaimer", "Risk Disclaimer", "Blockchain, market, bridge, provider, smart-contract and AI limitations."],
] as const;

export default function LegalIndex() {
  return (
    <>
      <MiniHero eyebrow="Legal" title="Policies and risk disclosures." description="Public policies for the PowerChain website and non-custodial application gateway." backHref="/" backLabel="Home" />
      <section className="web-section py-14 sm:py-18">
        <div className="web-container">
          <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
            {pages.map(([slug, title, body]) => (
              <Link key={slug} href={`/legal/${slug}`} className="web-card group rounded-[24px] p-6">
                <h2 className="web-display text-xl font-semibold text-brand-950 dark:text-brand-100">{title}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">{body}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 dark:text-brand-200">Read policy <ArrowRightIcon className="transition group-hover:translate-x-0.5" /></span>
              </Link>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-6 text-slate-500 dark:text-slate-400">These pages are product templates and should be reviewed by qualified counsel before a regulated or jurisdiction-specific production launch.</p>
        </div>
      </section>
    </>
  );
}
