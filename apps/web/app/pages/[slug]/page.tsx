import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, CheckCircledIcon } from "@radix-ui/react-icons";

const content = {
  about: {
    eyebrow: "About",
    title: "Financial infrastructure with human control at the center.",
    intro: "PowerChain DeFAI combines wallet-controlled execution, cross-chain operations and advisory AI in one observable operating environment.",
    points: ["Wallet approval remains mandatory for executable actions.", "Provider readiness and finality are verified at runtime.", "AI assists with context and preparation without receiving custody."],
  },
  security: {
    eyebrow: "Security",
    title: "Trust boundaries are part of the product surface.",
    intro: "PowerChain separates browser-safe code, server credentials, wallet authority, provider evidence and worker responsibilities so failures remain explicit and contained.",
    points: ["Client components do not import server-only backend services.", "Secrets stay server-side and out of NEXT_PUBLIC variables.", "Bridge and transaction completion depend on persisted chain evidence."],
  },
  ecosystem: {
    eyebrow: "Ecosystem",
    title: "Built for interoperable Solana and Sui operations.",
    intro: "PowerChain integrates network, liquidity, oracle, cross-chain, data and edge infrastructure through explicit provider boundaries and runtime health checks.",
    points: ["Solana and Sui are treated as distinct execution environments.", "Liquidity and provider integrations fail closed when unavailable.", "Cross-chain state is reconciled instead of inferred from UI state."],
  },
  developers: {
    eyebrow: "Developers",
    title: "Composable APIs with production boundaries already defined.",
    intro: "The monorepo exposes generated API contracts, SDK routes, provider diagnostics, runtime checks and worker-backed reconciliation for integration teams.",
    points: ["Generated OpenAPI and Postman artifacts stay synchronized.", "First-party workspace packages own protocol and runtime contracts.", "Production checks enforce routing, boundary and dependency integrity."],
  },
} as const;

type PageSlug = keyof typeof content;
function isPageSlug(value: string): value is PageSlug { return value in content; }

export function generateStaticParams() { return Object.keys(content).map((slug) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!isPageSlug(slug)) return {};
  return { title: content[slug].eyebrow, description: content[slug].intro };
}

export default async function PublicContentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isPageSlug(slug)) notFound();
  const page = content[slug];
  return (
    <section className="web-section py-24 sm:py-28">
      <div className="web-container">
        <div className="mx-auto max-w-4xl">
          <Link href="/pages" className="inline-flex items-center gap-2 text-sm font-semibold text-[#294a3b] dark:text-[#bfd1c7]"><ArrowLeftIcon /> All pages</Link>
          <div className="mt-10 text-center">
            <p className="web-eyebrow">{page.eyebrow}</p>
            <h1 className="web-section-title mx-auto mt-4 max-w-3xl">{page.title}</h1>
            <p className="web-section-copy mx-auto mt-6 max-w-2xl">{page.intro}</p>
          </div>
          <div className="mx-auto mt-12 max-w-3xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(11,27,20,.055)] dark:border-white/10 dark:bg-[#101714] sm:p-8">
            <div className="space-y-4">{page.points.map((point) => <div key={point} className="flex items-start gap-3"><CheckCircledIcon className="mt-1 shrink-0 text-[#294a3b] dark:text-[#b7c8c0]"/><p className="text-sm leading-7 text-slate-700 dark:text-slate-300">{point}</p></div>)}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
