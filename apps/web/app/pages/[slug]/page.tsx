import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircledIcon } from "@radix-ui/react-icons";
import { MiniHero } from "@/website/ui/mini-hero";

const content = {
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
    <>
      <MiniHero eyebrow={page.eyebrow} title={page.title} description={page.intro} backHref="/pages" backLabel="All pages" />
      <section className="web-section py-14 sm:py-18">
        <div className="web-container">
          <div className="web-card mx-auto max-w-3xl rounded-[26px] p-6 sm:p-8">
            <div className="space-y-4">
              {page.points.map((point) => (
                <div key={point} className="flex items-start gap-3">
                  <CheckCircledIcon className="mt-1 shrink-0 text-brand-700 dark:text-brand-200" />
                  <p className="text-sm leading-7 text-slate-700 dark:text-slate-300">{point}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
