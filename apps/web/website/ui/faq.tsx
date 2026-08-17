const rows=[
  ["Can the AI move funds?","No. AI is advisory. Executable Swap, Bridge and Staking transactions are rebuilt in validated application flows and require wallet approval."],
  ["Which networks are supported?","The application is organized around Solana and Sui, with cross-chain PWRC/wPWRC movement through the configured Wormhole NTT deployment."],
  ["Can I use my own RPC or API provider?","Yes. User settings support validated custom endpoints. Sensitive credentials remain transient or server-side depending on the integration."],
  ["How is bridge completion determined?","Persisted finality and reconciliation evidence—not explorer UI state or an AI response—determines completion."],
];
export function FAQ(){return <section id="faq" className="py-24"><div className="web-container grid gap-10 lg:grid-cols-[.65fr_1.35fr]"><div><p className="text-xs font-extrabold uppercase tracking-[.2em] text-[#294a3b]">FAQ</p><h2 className="mt-3 text-4xl font-semibold tracking-tight">Clear boundaries by design.</h2></div><div className="divide-y divide-slate-200 rounded-3xl border border-slate-200 bg-white px-5 sm:px-7">{rows.map(([q,a])=><details key={q} className="group py-5"><summary className="cursor-pointer list-none pr-8 text-base font-semibold marker:hidden">{q}</summary><p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{a}</p></details>)}</div></div></section>}
