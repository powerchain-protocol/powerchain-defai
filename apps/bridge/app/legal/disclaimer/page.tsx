import { LegalPage, LegalSection } from "@/components/legal/legal-page";
export const metadata = { title: "Risk disclaimer" };
export default function DisclaimerPage() { return <LegalPage eyebrow="Risk" title="DeFi and AI disclaimer" intro="PowerChain DeFAI combines software automation, public-chain data and optional AI assistance. It does not remove financial or protocol risk.">
  <LegalSection title="Not financial advice"><p>AI responses, charts, rates, prices, route information and suggestions are informational software outputs and are not individualized financial, legal, tax or investment advice.</p></LegalSection>
  <LegalSection title="Signing boundary"><p>Only the connected wallet can approve supported user transactions. Never provide a seed phrase or private key to the assistant or any website form.</p></LegalSection>
  <LegalSection title="Data freshness"><p>Market data, pool observations and explorer/indexer data can be delayed or unavailable. They are not authoritative for Bridge accounting or finality.</p></LegalSection>
</LegalPage>; }
