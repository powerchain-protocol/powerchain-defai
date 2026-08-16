import { LegalPage, LegalSection } from "@/components/legal/legal-page";
export const metadata = { title: "Terms" };
export default function TermsPage() { return <LegalPage eyebrow="Legal" title="Terms of use" intro="PowerChain DeFAI is software for wallet-controlled DeFi interactions. These template terms must be reviewed by the production operator and legal counsel before public deployment.">
  <LegalSection title="Wallet control"><p>You remain responsible for reviewing transaction details and approving wallet signatures. The assistant, explorer, charts and market-data providers do not sign transactions for you.</p></LegalSection>
  <LegalSection title="Protocol risk"><p>Blockchain transactions, DEX routing, bridges, liquidity pools and staking contracts may involve smart-contract, market, network, oracle and counterparty risks. Quotes can change before execution.</p></LegalSection>
  <LegalSection title="No finality by interface"><p>A submitted transaction, explorer result or AI response is not proof of Bridge completion. PWRC/wPWRC cross-chain principal completion requires the application’s configured Wormhole NTT finality and reconciliation checks.</p></LegalSection>
</LegalPage>; }
