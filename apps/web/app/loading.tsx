export default function WebsiteLoading() {
  return (
    <div className="grid min-h-[60dvh] place-items-center bg-[#eef2ef] px-6 dark:bg-[#08100c]" role="status" aria-live="polite">
      <div className="w-full max-w-md rounded-[24px] border border-black/[.06] bg-white p-6 shadow-[0_20px_60px_rgba(13,36,27,.08)] dark:border-white/10 dark:bg-[#101814]">
        <div className="h-2 w-20 animate-pulse rounded-full bg-[#dce6e1] dark:bg-white/10" />
        <div className="mt-5 h-8 w-3/4 animate-pulse rounded-xl bg-[#e8eeeb] dark:bg-white/10" />
        <div className="mt-3 h-4 w-full animate-pulse rounded-lg bg-[#eef2ef] dark:bg-white/[.07]" />
        <div className="mt-2 h-4 w-5/6 animate-pulse rounded-lg bg-[#eef2ef] dark:bg-white/[.07]" />
        <span className="sr-only">Loading PowerChain…</span>
      </div>
    </div>
  );
}
