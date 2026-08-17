import Link from "next/link";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { appUrl } from "@/website/lib/urls";
import { Logo } from "./logo";

const links = [["Products", "#products"], ["Features", "#features"], ["Partners", "#partners"], ["FAQ", "#faq"]] as const;
export function Header() {
  return <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl"><div className="web-container flex min-h-16 items-center gap-4"><Link href="/" aria-label="PowerChain home"><Logo /></Link><nav className="ml-auto hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex" aria-label="Marketing navigation">{links.map(([label, href]) => <Link key={href} href={href} className="transition hover:text-[#173b2d]">{label}</Link>)}</nav><div className="ml-auto flex items-center gap-2 md:ml-3"><details className="relative md:hidden"><summary className="grid size-10 cursor-pointer list-none place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 marker:hidden"><HamburgerMenuIcon /></summary><nav className="absolute right-0 top-12 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl" aria-label="Mobile marketing navigation">{links.map(([label, href]) => <Link key={href} href={href} className="block rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-[#173b2d]">{label}</Link>)}</nav></details><Link href={appUrl("/dashboard")} className="web-button web-button-primary">Open app</Link></div></div></header>;
}
