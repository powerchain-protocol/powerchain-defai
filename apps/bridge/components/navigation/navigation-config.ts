import { APP_ROUTES, type AppRoute } from "@/config/app-routes";
import type { NavigationIconName } from "./navigation-icon";

export type NavigationGroupId = "overview" | "intelligence" | "markets" | "portfolio" | "network" | "account";

export type NavigationItem = Readonly<{
  label: string;
  href: AppRoute;
  icon: NavigationIconName;
  description: string;
  bottom?: boolean;
}>;

export type NavigationSection = Readonly<{
  id: NavigationGroupId;
  label: string;
  description: string;
  items: readonly NavigationItem[];
}>;

export const APPLICATION_NAVIGATION_SECTIONS: readonly NavigationSection[] = Object.freeze([
  {
    id: "overview",
    label: "Overview",
    description: "Workspace summary and shortcuts",
    items: [
      { label: "Dashboard", href: APP_ROUTES.dashboard, icon: "dashboard", description: "Command center and workspace overview", bottom: true },
    ],
  },
  {
    id: "intelligence",
    label: "Intelligence",
    description: "AI-assisted research and guidance",
    items: [
      { label: "AI Assistant", href: APP_ROUTES.chat, icon: "chat", description: "DeFi guidance without signing authority", bottom: true },
    ],
  },
  {
    id: "markets",
    label: "Markets",
    description: "Wallet-controlled DeFi execution",
    items: [
      { label: "Swap", href: APP_ROUTES.swap, icon: "swap", description: "Wallet-signed Solana and Sui trading", bottom: true },
      { label: "Bridge", href: APP_ROUTES.bridge, icon: "bridge", description: "Transfer wPWRC and PWRC", bottom: true },
      { label: "Staking", href: APP_ROUTES.staking, icon: "staking", description: "Verified deployment-gated staking" },
    ],
  },
  {
    id: "portfolio",
    label: "Portfolio",
    description: "Assets, claims and operation history",
    items: [
      { label: "Wallet", href: APP_ROUTES.wallet, icon: "wallet", description: "Balances, positions and activity", bottom: true },
      { label: "Assets", href: APP_ROUTES.assets, icon: "assets", description: "Verify PWRC representations" },
      { label: "Claim", href: APP_ROUTES.claim, icon: "claim", description: "Claim eligible PWRC" },
      { label: "History", href: APP_ROUTES.history, icon: "history", description: "Review operations and recovery state" },
      { label: "Fees", href: APP_ROUTES.fees, icon: "fees", description: "Review service and network fees" },
    ],
  },
  {
    id: "network",
    label: "Network",
    description: "Read-only protocol and provider state",
    items: [
      { label: "Explorer", href: APP_ROUTES.explorer, icon: "explorer", description: "Read-only Solana and Sui explorer" },
      { label: "Protocol", href: APP_ROUTES.protocol, icon: "protocol", description: "Verified programs and contract deployment state" },
      { label: "Integrations", href: APP_ROUTES.integrations, icon: "integrations", description: "Runtime providers and protocols" },
      { label: "Status", href: APP_ROUTES.status, icon: "status", description: "Provider and execution readiness" },
    ],
  },
  {
    id: "account",
    label: "Account",
    description: "Local profile and connectivity preferences",
    items: [
      { label: "Settings", href: APP_ROUTES.settings, icon: "settings", description: "RPC, APIs, swap and bridge preferences" },
    ],
  },
]);

export const APPLICATION_NAVIGATION: readonly NavigationItem[] = Object.freeze(
  APPLICATION_NAVIGATION_SECTIONS.flatMap((section) => section.items),
);

export const MOBILE_BOTTOM_NAVIGATION = APPLICATION_NAVIGATION.filter((item) => item.bottom);

export function isActiveRoute(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
