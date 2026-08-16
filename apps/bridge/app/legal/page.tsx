import Link from "next/link";
import { LegalPage } from "@/components/legal/legal-page";
export const metadata = { title: "Legal" };
const links = [
  ["Privacy policy", "/legal/privacy", "Privacy boundaries for wallet, provider and abuse-prevention data."],
  ["Terms of use", "/legal/terms", "Wallet control, protocol risk and transaction-finality terms."],
  ["Cookie policy", "/legal/cookies", "Essential storage and remembered cookie choices."],
  ["DeFi & AI risk disclaimer", "/legal/disclaimer", "Important limitations for AI, market data and DeFi interactions."],
] as const;
export default function LegalIndexPage() { return <LegalPage eyebrow="PowerChain DeFAI" title="Legal and product safety" intro="Review the policies and risk disclosures for this deployment."><div className="grid gap-3 sm:grid-cols-2">{links.map(([title, href, description]) => <Link key={href} href={href} className="pc-button-light rounded-2xl p-4"><span className="font-semibold text-slate-950 dark:text-white">{title}</span><span className="mt-1 block text-xs leading-5 text-slate-600 dark:text-slate-300">{description}</span></Link>)}</div></LegalPage>; }
