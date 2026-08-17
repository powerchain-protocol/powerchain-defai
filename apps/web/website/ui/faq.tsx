import { PlusIcon } from "@radix-ui/react-icons";

const rows = [
  [
    "Can the AI move funds or sign transactions?",
    "No. PowerChain AI is advisory. Swap, Bridge and Staking actions are rebuilt inside validated application flows and require explicit approval from the connected wallet.",
  ],
  [
    "Which networks does PowerChain support?",
    "The current workspace is designed around Solana and Sui. Cross-chain PWRC/wPWRC workflows use the configured bridge deployment and verify route state at runtime.",
  ],
  [
    "How does PowerChain determine whether a bridge is complete?",
    "Completion is based on persisted finality and reconciliation evidence. Explorer UI state, provider text or an AI response is never treated as finality evidence by itself.",
  ],
  [
    "Can I use my own RPC or infrastructure provider?",
    "Yes. PowerChain supports validated provider preferences and fallback topology. Sensitive provider credentials stay transient or server-side according to the integration boundary.",
  ],
  [
    "Does connecting a wallet authenticate my account?",
    "No. A wallet connection only exposes the selected public address to the client. Authentication requires a separate signed challenge or configured identity flow.",
  ],
  [
    "What happens when a provider is degraded or unavailable?",
    "Readiness, timeout, retry and fallback states are surfaced explicitly. PowerChain is designed to fail closed instead of fabricating quotes, balances, rewards or chain confirmation.",
  ],
] as const;

export function FAQ() {
  return (
    <section id="faq" className="web-section py-24 sm:py-28">
      <div className="web-container">
        <div className="mx-auto max-w-3xl text-center">
          <p className="web-eyebrow">FAQ</p>
          <h2 className="web-section-title mt-4">Clear answers before you connect.</h2>
          <p className="web-section-copy mx-auto mt-5 max-w-2xl">
            The product is designed around explicit execution, identity and provider boundaries. These are the questions we expect users and operators to ask first.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-[28px] border border-slate-200 bg-white px-5 shadow-[0_18px_60px_rgba(11,27,20,.055)] dark:border-white/10 dark:bg-[#101714] sm:px-7">
          {rows.map(([question, answer], index) => (
            <details key={question} className="web-faq group border-b border-slate-200 py-1 last:border-b-0 dark:border-white/10">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5 text-left marker:hidden sm:py-6">
                <span className="flex min-w-0 items-start gap-4">
                  <span className="mt-0.5 hidden text-[10px] font-extrabold tabular-nums tracking-[.14em] text-slate-400 sm:block">{String(index + 1).padStart(2, "0")}</span>
                  <span className="web-display text-base font-semibold leading-6 text-brand-950 dark:text-brand-100 sm:text-[17px]">{question}</span>
                </span>
                <span className="grid size-8 shrink-0 place-items-center rounded-full border border-slate-200 bg-[#f6f8f7] text-brand-700 transition duration-200 group-open:rotate-45 dark:border-white/10 dark:bg-white/[.05] dark:text-brand-100">
                  <PlusIcon />
                </span>
              </summary>
              <p className="max-w-3xl pb-6 pl-0 pr-10 text-sm leading-7 text-slate-600 dark:text-slate-400 sm:pl-10">{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
