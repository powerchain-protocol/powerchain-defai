import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPage } from "@/website/ui/legal-page";

const UPDATED = "August 17, 2026";

const legal = {
  privacy: {
    title: "Privacy Policy",
    description: "How the PowerChain public website handles browser preferences, wallet connection metadata and standard service request information.",
  },
  terms: {
    title: "Terms of Use",
    description: "The operating terms for the PowerChain public website and non-custodial application gateway.",
  },
  cookies: {
    title: "Cookie & Storage Policy",
    description: "How essential cookies and browser storage support theme, wallet and preference functionality on PowerChain.",
  },
  disclaimer: {
    title: "Risk Disclaimer",
    description: "Important information about blockchain, market, provider, bridge, AI and smart-contract risks.",
  },
} as const;

type LegalSlug = keyof typeof legal;
function isLegalSlug(value: string): value is LegalSlug { return value in legal; }

export function generateStaticParams() { return Object.keys(legal).map((slug) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!isLegalSlug(slug)) return {};
  return { title: legal[slug].title, description: legal[slug].description };
}

export default async function LegalRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isLegalSlug(slug)) notFound();
  const page = legal[slug];

  if (slug === "privacy") return (
    <LegalPage eyebrow="Legal" title={page.title} description={page.description} updated={UPDATED}>
      <h2>Overview</h2><p>PowerChain is designed as non-custodial software. The public website does not require a wallet connection to browse content and is not designed to receive private keys or seed phrases.</p>
      <h2>Information processed</h2><p>When you use the site, standard web infrastructure may process request metadata such as IP address, user agent, timestamps and requested routes for security and service delivery. If you choose to connect a wallet, the selected public wallet address may be available to browser-side application code for the duration of that session.</p>
      <h2>Browser preferences</h2><p>The website stores limited preferences such as theme, selected network/cluster and wallet-adapter selection in browser storage. These preferences support product functionality and can be cleared through your browser.</p>
      <h2>Third-party infrastructure</h2><p>Blockchain RPC, wallet, data, hosting and security providers may process information according to their own terms when you interact with those services. PowerChain does not control third-party wallet extensions or blockchain networks.</p>
      <h2>Security</h2><p>Never provide a private key, seed phrase or recovery phrase to the website. Wallet signing requests should be reviewed in your wallet before approval.</p>
      <h2>Changes</h2><p>This policy may be updated as product functionality and deployment infrastructure evolve. Material changes should be reviewed before relying on the service in production.</p>
    </LegalPage>
  );

  if (slug === "terms") return (
    <LegalPage eyebrow="Legal" title={page.title} description={page.description} updated={UPDATED}>
      <h2>Use of the service</h2><p>PowerChain provides software interfaces for information, transaction preparation and non-custodial blockchain workflows. You are responsible for reviewing transaction details and determining whether an action is appropriate before signing it.</p>
      <h2>Wallet authority</h2><p>Connecting a wallet does not transfer custody to PowerChain. Your wallet remains the signing authority. You are responsible for protecting wallet credentials and verifying wallet prompts.</p>
      <h2>Availability</h2><p>Blockchain networks, RPC providers, bridges, data sources and third-party services can be unavailable, delayed or inaccurate. PowerChain may fail closed when authoritative evidence is unavailable.</p>
      <h2>Prohibited use</h2><p>You may not use the service to violate applicable law, compromise systems, evade security controls, interfere with other users, or misrepresent transaction state.</p>
      <h2>No guarantee</h2><p>The software is provided on an as-available basis. No interface, quote, provider response or AI output guarantees transaction execution, profitability, asset value or finality.</p>
    </LegalPage>
  );

  if (slug === "cookies") return (
    <LegalPage eyebrow="Legal" title={page.title} description={page.description} updated={UPDATED}>
      <h2>Essential storage</h2><p>The public website uses essential browser storage to remember interface preferences such as light/dark theme, selected network context and wallet-adapter choices. The cookie notice itself may store an acknowledgement flag.</p>
      <h2>No advertising cookies by this component</h2><p>The built-in PowerChain cookie notice does not enable advertising cookies or behavioral advertising. If optional analytics are introduced in a deployment, they should be separately documented and gated as required by applicable law.</p>
      <h2>Managing storage</h2><p>You can remove local storage and cookies using your browser controls. Clearing wallet-adapter preferences may cause the site to ask you to select a wallet again.</p>
      <h2>Wallet extensions</h2><p>Wallet extensions and third-party providers may use their own storage independently of PowerChain. Review those providers' policies for details.</p>
    </LegalPage>
  );

  return (
    <LegalPage eyebrow="Legal" title={page.title} description={page.description} updated={UPDATED}>
      <h2>Blockchain risk</h2><p>Blockchain transactions can be irreversible. Network congestion, reorgs, smart-contract defects, token-program behavior and provider outages can affect execution or finality.</p>
      <h2>Market risk</h2><p>Digital assets can be volatile and may lose value. Quotes, price feeds, liquidity conditions and fees can change between review and execution.</p>
      <h2>Cross-chain risk</h2><p>Bridging introduces additional messaging, finality and reconciliation dependencies. A submitted source transaction does not by itself prove destination completion.</p>
      <h2>AI limitations</h2><p>AI output is advisory and can be incomplete or incorrect. It must not substitute for authoritative chain evidence, wallet review or professional financial, legal or tax advice.</p>
      <h2>Independent review</h2><p>Before using PowerChain for material transactions, independently assess the applicable smart contracts, assets, network conditions and legal obligations.</p>
    </LegalPage>
  );
}
