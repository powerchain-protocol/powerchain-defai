import Link from "next/link";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { MiniHero } from "@/website/ui/mini-hero";

const pages = [
  ["about", "About", "PowerChain's operating model, product principles and execution boundaries."],
  ["security", "Security", "Wallet authority, runtime verification and server-side trust boundaries."],
  ["ecosystem", "Ecosystem", "The networks and infrastructure providers PowerChain integrates with."],
  ["developers", "Developers", "API, SDK, runtime and integration surfaces for builders and operators."],
] as const;

export default function PagesIndex() {
  return (
    <>
      <MiniHero eyebrow="PowerChain" title="Explore the platform." description="Product, security, ecosystem and developer context for the PowerChain DeFAI platform." backHref="/" backLabel="Home" />
      <section className="web-section py-14 sm:py-18">
        <div className="web-container">
          <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
            {pages.map(([slug, title, body]) => (
              <Link key={slug} href={`/pages/${slug}`} className="web-card group rounded-[24px] p-6 sm:p-7">
                <h2 className="web-display text-xl font-semibold text-brand-950 dark:text-brand-100">{title}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">{body}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 dark:text-brand-200">Read more <ArrowRightIcon className="transition group-hover:translate-x-0.5" /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
