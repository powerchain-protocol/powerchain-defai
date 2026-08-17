import Link from "next/link";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { Logo } from "@/website/shared/ui/logo";
import { ThemeToggle } from "@/website/shared/ui/theme-toggle";
import { WalletEntryControls } from "./wallet-entry-controls";

const links = [["About", "/pages/about"], ["Products", "#products"], ["Features", "#features"], ["Ecosystem", "#partners"], ["FAQ", "#faq"]] as const;

export function Header() {
  return (
    <header className="web-header">
      <div className="web-container flex min-h-16 items-center gap-4">
        <Link href="/" aria-label="PowerChain home"><Logo /></Link>
        <nav className="ml-auto hidden items-center gap-7 text-sm font-semibold text-slate-600 dark:text-slate-300 md:flex" aria-label="Marketing navigation">
          {links.map(([label, href]) => <Link key={href} href={href} className="transition hover:text-[#173b2d] dark:hover:text-white">{label}</Link>)}
        </nav>
        <div className="ml-auto flex items-center gap-2 md:ml-3">
          <ThemeToggle />
          <details className="relative md:hidden">
            <summary className="web-icon-button cursor-pointer list-none marker:hidden" aria-label="Open navigation"><HamburgerMenuIcon /></summary>
            <nav className="absolute right-0 top-12 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_18px_50px_rgba(15,23,42,.14)] dark:border-white/10 dark:bg-[#101714]" aria-label="Mobile marketing navigation">
              {links.map(([label, href]) => <Link key={href} href={href} className="block rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-[#173b2d] dark:text-slate-300 dark:hover:bg-white/[.06] dark:hover:text-white">{label}</Link>)}
            </nav>
          </details>
          <WalletEntryControls />
        </div>
      </div>
    </header>
  );
}
