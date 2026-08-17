import Image from "next/image";

export function Logo({ compact = false, inverse = false, showText = true }: { compact?: boolean; inverse?: boolean; showText?: boolean }) {
  const size = compact ? 34 : 42;
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="relative shrink-0" style={{ width: size, height: size }}>
        <Image src={inverse ? "/brand/logo-white.png" : "/brand/logo-dark.png"} alt="" width={size} height={size} className="h-auto w-auto object-contain dark:hidden" priority />
        <Image src="/brand/logo-white.png" alt="" width={size} height={size} className="hidden h-auto w-auto object-contain dark:block" priority />
      </span>
      {showText ? <span className="leading-tight"><span className={`block text-sm font-semibold ${inverse ? "text-white" : "text-slate-950 dark:text-white"}`}>PowerChain</span><span className={`block text-[9px] font-semibold uppercase tracking-[0.28em] ${inverse ? "text-slate-300" : "text-slate-500 dark:text-slate-400"}`}>DeFAI</span></span> : <span className="sr-only">PowerChain DeFAI</span>}
    </span>
  );
}
