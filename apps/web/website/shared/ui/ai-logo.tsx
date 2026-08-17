import Image from "next/image";

export function AILogo({ size = 36, label = "PowerChain AI" }: { size?: number; label?: string }) {
  return (
    <span
      className="inline-grid shrink-0 place-items-center overflow-hidden rounded-2xl border border-[#cfd9d4] bg-white shadow-[0_6px_18px_rgba(23,59,45,.08)] dark:border-white/10 dark:bg-[#111a16]"
      style={{ width: size, height: size }}
      aria-label={label}
      role="img"
    >
      <Image src="/brand/logo-green.png" alt="" width={size} height={size} className="h-[72%] w-[72%] object-contain" />
    </span>
  );
}
