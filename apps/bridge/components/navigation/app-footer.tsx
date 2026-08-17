export function AppFooter() {
  return (
    <footer className="border-t border-slate-200/80 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-[#050807]/95">
      <div className="mx-auto flex min-h-12 w-full max-w-[1500px] items-center justify-between gap-4 px-4 text-[11px] text-slate-500 sm:px-6 lg:px-8 dark:text-slate-400">
        <p>PowerChain DeFAI</p>
        <p className="hidden sm:block">Wallet-controlled execution · verified infrastructure</p>
      </div>
    </footer>
  );
}
