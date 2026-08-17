export function DashboardFooter() {
  return (
    <footer className="border-t border-slate-200/80 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-[#050807]/95">
      <div className="flex min-h-12 items-center justify-between gap-4 px-4 text-[11px] text-slate-500 sm:px-6 lg:px-8 xl:px-9 dark:text-slate-400">
        <p>PowerChain DeFAI · Command Center</p>
        <p className="hidden sm:block">Wallets sign · runtime verifies · AI advises</p>
      </div>
    </footer>
  );
}
