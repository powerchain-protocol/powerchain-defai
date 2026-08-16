import Image from "next/image";
import Link from "next/link";

export function BrandLogo({ inverse = false, compact = false, showText = false }: { inverse?: boolean; compact?: boolean; showText?: boolean }) {
  const src = inverse ? "/brand/logo-white.png" : "/brand/logo-dark.png";
  return (
    <Link href="/chat" className="inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a]" aria-label="PowerChain DeFAI home">
      <Image src={src} alt="" width={compact ? 34 : 42} height={compact ? 34 : 42} className="h-auto w-auto object-contain" priority />
      {showText ? <span className="leading-tight"><span className={`block text-sm font-semibold ${inverse ? "text-white" : "text-slate-950 dark:text-white"}`}>PowerChain</span><span className={`block text-[9px] font-semibold uppercase tracking-[0.28em] ${inverse ? "text-slate-300" : "text-slate-500"}`}>DeFAI</span></span> : <span className="sr-only">PowerChain DeFAI</span>}
    </Link>
  );
}
