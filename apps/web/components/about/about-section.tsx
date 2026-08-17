import { CheckCircledIcon, LockClosedIcon, ReaderIcon } from "@radix-ui/react-icons";
import { AboutLayout } from "./layout";

const principles = [
  {
    title: "Wallet-owned execution",
    body: "PowerChain prepares routes and validates execution context while the connected wallet remains the signing authority.",
    icon: LockClosedIcon,
  },
  {
    title: "Observable infrastructure",
    body: "Provider readiness, finality, reconciliation and failure states are surfaced as product states instead of hidden implementation details.",
    icon: ReaderIcon,
  },
  {
    title: "AI with explicit boundaries",
    body: "AI can explain, compare and prepare actions, but cannot silently move funds or substitute narrative output for chain evidence.",
    icon: CheckCircledIcon,
  },
] as const;

export function AboutSection() {
  return (
    <AboutLayout
      title="Financial infrastructure with human control at the center."
      description="PowerChain brings AI-assisted DeFi, cross-chain operations and wallet intelligence into one disciplined workspace built around transparent execution boundaries."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {principles.map(({ title, body, icon: Icon }) => (
          <article key={title} className="web-card rounded-[26px] p-6 sm:p-7">
            <span className="web-icon-tile"><Icon /></span>
            <h3 className="web-display mt-5 text-lg font-semibold tracking-[-.015em] text-brand-950 dark:text-brand-100">{title}</h3>
            <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">{body}</p>
          </article>
        ))}
      </div>
    </AboutLayout>
  );
}
