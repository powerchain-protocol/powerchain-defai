import Link from "next/link";
import { HamburgerMenuIcon, HomeIcon } from "@radix-ui/react-icons";
import { Logo } from "@/website/shared/ui/logo";
import { ThemeToggle } from "@/website/shared/ui/theme-toggle";
import { WalletEntryControls } from "./wallet-entry-controls";

const links = [["Home", "/"], ["About", "/pages/about"], ["Products", "/#products"], ["Features", "/#features"], ["Ecosystem", "/#partners"], ["FAQ", "/#faq"]] as const;

export function Header() {
  return (
    <header className="web-header">
      <div className="web-container flex min-h-16 items-center gap-4">
        <Link href="/" aria-label="PowerChain home" className="shrink-0"><Logo /></Link>
        <nav className="ml-auto hidden items-center gap-6 text-sm font-semibold text-slate-600 dark:text-slate-300 md:flex" aria-label="Marketing navigation">
          {links.map(([label, href], index) => (
            <Link key={href} href={href} className="web-nav-link">
              {index === 0 ? <HomeIcon aria-hidden="true" /> : null}{label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 md:ml-3">
          <ThemeToggle />
          <details className="relative md:hidden">
            <summary className="web-icon-button cursor-pointer list-none marker:hidden" aria-label="Open navigation"><HamburgerMenuIcon /></summary>
            <nav className="web-mobile-menu" aria-label="Mobile marketing navigation">
              {links.map(([label, href], index) => (
                <Link key={href} href={href} className="web-mobile-link">{index === 0 ? <HomeIcon aria-hidden="true" /> : null}{label}</Link>
              ))}
            </nav>
          </details>
          <WalletEntryControls />
        </div>
      </div>
    </header>
  );
}
