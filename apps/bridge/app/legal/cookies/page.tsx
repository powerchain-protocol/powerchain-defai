import { LegalPage, LegalSection } from "@/components/legal/legal-page";
export const metadata = { title: "Cookie policy" };
export default function CookiesPage() { return <LegalPage eyebrow="Legal" title="Cookie and local-storage policy" intro="PowerChain DeFAI remembers your cookie choice so the consent banner does not appear on every visit.">
  <LegalSection title="Essential storage"><p>Theme, transaction preferences, saved prompts, operation-recovery state and your cookie-consent choice may be stored locally when required for product functionality and safety.</p></LegalSection>
  <LegalSection title="Consent memory"><p>The consent choice is mirrored to a SameSite=Lax first-party cookie and local storage for up to 180 days. You can reopen Cookie choices from the footer at any time.</p></LegalSection>
  <LegalSection title="Optional storage"><p>Optional analytics or marketing storage must remain disabled unless explicitly enabled by the deployment and accepted by the user. The source release does not treat optional consent as permission to expose wallet secrets.</p></LegalSection>
</LegalPage>; }
