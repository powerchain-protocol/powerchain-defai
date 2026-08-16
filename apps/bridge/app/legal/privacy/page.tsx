import { LegalPage, LegalSection } from "@/components/legal/legal-page";
export const metadata = { title: "Privacy" };
export default function PrivacyPage() { return <LegalPage eyebrow="Legal" title="Privacy policy" intro="This page describes the privacy boundaries of the PowerChain DeFAI application. Deployment operators should review and adapt it to their actual production data flows and jurisdiction before launch.">
  <LegalSection title="Wallet and blockchain data"><p>Public wallet addresses, balances, signatures and transaction identifiers are processed only as needed to provide wallet, Swap, Bridge, staking-readiness and portfolio features. Public-chain information is inherently visible on the relevant networks.</p></LegalSection>
  <LegalSection title="IP and abuse protection"><p>Production deployments may derive a short-lived pseudonymous abuse-prevention key from a trusted platform IP signal. Raw IP addresses are not treated as wallet identity or settlement evidence, and generic forwarded headers are not trusted.</p></LegalSection>
  <LegalSection title="AI and market providers"><p>Assistant prompts and market-data requests may be sent to configured providers when those integrations are enabled. Provider secrets remain server-side. Do not include private keys, seed phrases or confidential signing material in prompts.</p></LegalSection>
  <LegalSection title="Storage"><p>Essential browser storage may remember theme, transaction preferences and cookie consent. Optional storage is not enabled until consent is given.</p></LegalSection>
</LegalPage>; }
