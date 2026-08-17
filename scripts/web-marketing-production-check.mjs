import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "apps/web/package.json",
  "apps/web/app/layout.tsx",
  "apps/web/app/page.tsx",
  "apps/web/app/not-found.tsx",
  "apps/web/app/globals.css",
  "apps/web/website/ui/shell.tsx",
  "apps/web/website/ui/header.tsx",
  "apps/web/website/ui/footer.tsx",
  "apps/web/website/ui/cta.tsx",
  "apps/web/website/ui/hero.tsx",
  "apps/web/website/ui/faq.tsx",
  "apps/web/website/ui/partnerships.tsx",
  "apps/web/website/ui/products.tsx",
  "apps/web/website/ui/features.tsx",
  "apps/web/website/ui/logo.tsx",
  "apps/web/website/ui/mini-hero.tsx",
  "apps/web/website/ui/cookies.tsx",
  "apps/web/website/ui/legal-page.tsx",
  "apps/web/app/pages/about/page.tsx",
  "apps/web/app/pages/loading.tsx",
  "apps/web/app/legal/page.tsx",
  "apps/web/app/legal/[slug]/page.tsx",
  "apps/web/app/legal/loading.tsx",
];
const failures = [];
for (const file of required) if (!fs.existsSync(path.join(root, file))) failures.push(`missing ${file}`);
const pkg = JSON.parse(fs.readFileSync(path.join(root, "apps/web/package.json"), "utf8"));
if (pkg.name !== "@powerchain/web") failures.push("apps/web must be named @powerchain/web");
if (!String(pkg.scripts?.dev ?? "").includes("3001")) failures.push("apps/web dev script must use port 3001");
const page = fs.readFileSync(path.join(root, "apps/web/app/page.tsx"), "utf8");
for (const name of ["Hero", "Products", "Features", "Partnerships", "FAQ", "CTA", "MarketingShell"]) if (!page.includes(name)) failures.push(`marketing page missing ${name}`);
const layout = fs.readFileSync(path.join(root, "apps/web/app/layout.tsx"), "utf8");
if (!layout.includes('data-scroll-behavior="smooth"')) failures.push("marketing html must declare smooth-scroll transition ownership");
const css = fs.readFileSync(path.join(root, "apps/web/app/globals.css"), "utf8");
for (const marker of ["@custom-variant dark", "@theme inline", "--font-display", ".web-mini-hero", ".web-cookie-card", ".web-wallet-modal"]) if (!css.includes(marker)) failures.push(`marketing theme missing ${marker}`);
if (!css.includes("place-items:center") && !css.includes("place-items: center")) failures.push("wallet modal backdrop must center the popup card");
const provider = fs.readFileSync(path.join(root, "apps/web/website/providers/wallet-provider.tsx"), "utf8");
if (!provider.includes("autoConnect={false}")) failures.push("marketing Solana wallet provider must not auto-connect");
if (!provider.includes("onError={handleSolanaWalletError}")) failures.push("marketing wallet provider must own provider error handling");
const modal = fs.readFileSync(path.join(root, "apps/web/website/wallet/wallet-connect-modal.tsx"), "utf8");
if (modal.includes("setError(cause instanceof Error ? cause.message")) failures.push("wallet modal must not reflect raw adapter error messages");
if (!modal.includes("Connection cancelled. No wallet permissions were changed.")) failures.push("wallet rejection must be represented as a neutral cancellation state");
const header = fs.readFileSync(path.join(root, "apps/web/website/ui/header.tsx"), "utf8");
if (!header.includes('["Home", "/"]')) failures.push("marketing header must expose Home navigation");
const legal = fs.readFileSync(path.join(root, "apps/web/app/legal/[slug]/page.tsx"), "utf8");
for (const slug of ["privacy", "terms", "cookies", "disclaimer"]) if (!legal.includes(`${slug}:`)) failures.push(`missing marketing legal page: ${slug}`);
const routes = fs.readFileSync(path.join(root, "apps/bridge/config/app-routes.ts"), "utf8");
if (!routes.includes('home: "/"') || !routes.includes('dashboard: "/"')) failures.push("application home/dashboard must resolve to /");
const shell = fs.readFileSync(path.join(root, "apps/bridge/components/navigation/shell.tsx"), "utf8");
if (!shell.includes("h-dvh") || !shell.includes("overflow-y-auto") || !shell.includes("no-scrollbar")) failures.push("application shell must own viewport scrolling with hidden page scrollbar");
const footer = fs.readFileSync(path.join(root, "apps/bridge/components/dashboard/dashboard-footer.tsx"), "utf8");
if (footer.includes("<Link") || footer.includes("href=")) failures.push("dashboard footer must remain navigation-free");
if (failures.length) { console.error("Web/dashboard production check failed:\n" + failures.map((f) => `- ${f}`).join("\n")); process.exit(1); }
console.log("✓ Marketing web app, dashboard entry route, scroll ownership, and navigation-free dashboard footer verified.");
