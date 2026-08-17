import type { SVGProps } from "react";
import { AILogo } from "./ai-logo";

export type ProductIconName = "assistant" | "agent" | "chat" | "swap" | "bridge" | "staking" | "wallet" | "status";

export function ProductIcon({ name, size = 48 }: { name: ProductIconName; size?: number }) {
  if (name === "assistant" || name === "agent") return <span className="web-product-icon" style={{ width: size, height: size }}><AILogo size={Math.round(size * .72)}/></span>;
  return <span className="web-product-icon" style={{ width: size, height: size }}><Glyph name={name} className="size-[52%]"/></span>;
}

function Glyph({ name, ...props }: { name: Exclude<ProductIconName, "assistant" | "agent"> } & SVGProps<SVGSVGElement>) {
  const base = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (name === "chat") return <svg {...base} {...props}><path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-4 4v-4H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/><path d="M8 9h8M8 13h5" opacity=".65"/></svg>;
  if (name === "swap") return <svg {...base} {...props}><path d="M5 7.5h12.5m-3-3 3 3-3 3M19 16.5H6.5m3 3-3-3 3-3"/><path d="M7 9.7c2.8 2.1 7.2 2.1 10 0M17 14.3c-2.8-2.1-7.2-2.1-10 0" opacity=".35"/></svg>;
  if (name === "bridge") return <svg {...base} {...props}><path d="M4 17.5h16M6 17.5v-4a6 6 0 0 1 12 0v4M8.5 17.5v-4a3.5 3.5 0 0 1 7 0v4"/><path d="M4 7h5m-2.5-2.5L9 7 6.5 9.5M20 7h-5m2.5-2.5L15 7l2.5 2.5" opacity=".72"/></svg>;
  if (name === "staking") return <svg {...base} {...props}><path d="M12 3 5 7v5c0 4.5 2.8 7.3 7 9 4.2-1.7 7-4.5 7-9V7z"/><path d="M12 7v10m-3-6.5c0-1 1.2-1.8 3-1.8s3 .8 3 1.8-1.2 1.7-3 1.7-3 .8-3 1.8 1.2 1.8 3 1.8 3-.8 3-1.8" opacity=".72"/></svg>;
  if (name === "wallet") return <svg {...base} {...props}><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H19a1 1 0 0 1 1 1v13H6.5A2.5 2.5 0 0 1 4 16.5z"/><path d="M4 8h15m-4 4h5v4h-5a2 2 0 0 1 0-4Z" opacity=".72"/></svg>;
  return <svg {...base} {...props}><path d="M4 18V6m4 12v-5m4 5V9m4 9v-8m4 8V4"/><path d="M3 20h18" opacity=".45"/></svg>;
}
