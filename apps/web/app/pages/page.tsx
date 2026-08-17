import Link from "next/link";
import { ArrowRightIcon } from "@radix-ui/react-icons";

const pages = [
  ["about", "About", "PowerChain's operating model, product principles and execution boundaries."],
  ["security", "Security", "Wallet authority, runtime verification and server-side trust boundaries."],
  ["ecosystem", "Ecosystem", "The networks and infrastructure providers PowerChain integrates with."],
  ["developers", "Developers", "API, SDK, runtime and integration surfaces for builders and operators."],
] as const;

export default function PagesIndex() {
  return (
    <section className="web-section py-24 sm:py-28">
      <div className="web-container">
        <div className="mx-auto max-w-3xl text-center">
          <p className="web-eyebrow">PowerChain</p>
          <h1 className="web-section-title mt-4">Explore the platform.</h1>
          <p className="web-section-copy mx-auto mt-5 max-w-2xl">Product, security, ecosystem and developer context for the PowerChain DeFAI platform.</p>
        </div>
        <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2">
          {pages.map(([slug, title, body]) => (
            <Link key={slug} href={`/pages/${slug}`} className="web-card group rounded-[26px] p-6 sm:p-7">
              <h2 className="text-xl font-semibold text-[#102b21] dark:text-white">{title}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">{body}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#294a3b] dark:text-[#bfd1c7]">Read more <ArrowRightIcon className="transition group-hover:translate-x-0.5" /></span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
