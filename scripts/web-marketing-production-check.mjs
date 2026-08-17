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
];
const failures = [];
for (const file of required) if (!fs.existsSync(path.join(root, file))) failures.push(`missing ${file}`);
const pkg = JSON.parse(fs.readFileSync(path.join(root, "apps/web/package.json"), "utf8"));
if (pkg.name !== "@powerchain/web") failures.push("apps/web must be named @powerchain/web");
if (!String(pkg.scripts?.dev ?? "").includes("3001")) failures.push("apps/web dev script must use port 3001");
const page = fs.readFileSync(path.join(root, "apps/web/app/page.tsx"), "utf8");
for (const name of ["Hero", "Products", "Features", "Partnerships", "FAQ", "CTA", "MarketingShell"]) if (!page.includes(name)) failures.push(`marketing page missing ${name}`);
const routes = fs.readFileSync(path.join(root, "apps/bridge/config/app-routes.ts"), "utf8");
if (!routes.includes('home: "/dashboard"')) failures.push("application home must resolve to /dashboard");
const shell = fs.readFileSync(path.join(root, "apps/bridge/components/navigation/shell.tsx"), "utf8");
if (!shell.includes("h-dvh") || !shell.includes("overflow-y-auto") || !shell.includes("no-scrollbar")) failures.push("application shell must own viewport scrolling with hidden page scrollbar");
const footer = fs.readFileSync(path.join(root, "apps/bridge/components/dashboard/dashboard-footer.tsx"), "utf8");
if (footer.includes("<Link") || footer.includes("href=")) failures.push("dashboard footer must remain navigation-free");
if (failures.length) { console.error("Web/dashboard production check failed:\n" + failures.map((f) => `- ${f}`).join("\n")); process.exit(1); }
console.log("✓ Marketing web app, dashboard entry route, scroll ownership, and navigation-free dashboard footer verified.");
