import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const appRoot = path.join(root, "apps/bridge/app");
const routeSource = fs.readFileSync(path.join(root, "apps/bridge/config/app-routes.ts"), "utf8");
const navSource = fs.readFileSync(path.join(root, "apps/bridge/components/navigation/navigation-config.ts"), "utf8");
const nextSource = fs.readFileSync(path.join(root, "apps/bridge/next.config.ts"), "utf8");
const shellSource = fs.readFileSync(path.join(root, "apps/bridge/components/navigation/application-shell.tsx"), "utf8");
const dashboardSidebarSource = fs.readFileSync(path.join(root, "apps/bridge/components/dashboard/dashboard-sidebar.tsx"), "utf8");
const errors = [];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const pageFiles = walk(appRoot).filter((file) => path.basename(file) === "page.tsx");
const concretePages = new Set(pageFiles.map((file) => {
  const rel = path.relative(appRoot, path.dirname(file));
  if (!rel) return "/";
  return "/" + rel.split(path.sep).map((segment) => segment.startsWith("[") ? ":dynamic" : segment).join("/");
}));
const routeValues = Object.fromEntries([...routeSource.matchAll(/\s+([A-Za-z0-9_]+): "([^"]+)"/g)].map((m) => [m[1], m[2]]));
const redirects = [...routeSource.matchAll(/\{\s*source:\s*"([^"]+)",\s*destination:\s*(APP_ROUTES\.[A-Za-z0-9_]+|"[^"]+")/g)].map((m) => ({
  source: m[1],
  destination: m[2].startsWith("APP_ROUTES.") ? routeValues[m[2].slice("APP_ROUTES.".length)] : m[2].slice(1, -1),
}));
const redirectSources = new Set(redirects.map((item) => item.source));

for (const required of ["/dashboard","/chat","/swap","/bridge","/staking","/wallet","/history","/explorer","/claim","/assets","/fees","/integrations","/status"]) {
  if (!concretePages.has(required)) errors.push(`Canonical page missing: ${required}`);
}
for (const required of ["/stake","/rewards","/validators","/transactions","/portfolio","/docs"]) {
  if (!redirectSources.has(required)) errors.push(`Compatibility redirect missing: ${required}`);
}
if (!nextSource.includes('import { APP_REDIRECTS } from "./config/app-routes"')) errors.push("Next config does not consume canonical APP_REDIRECTS");
if (!nextSource.includes("typedRoutes: true")) errors.push("Next typedRoutes must remain enabled");
if (!navSource.includes("APPLICATION_NAVIGATION") || !navSource.includes("APP_ROUTES.status")) errors.push("Navigation registry does not include canonical status route");
if (!routeSource.includes("DASHBOARD_WORKSPACE_ROUTES") || !routeSource.includes("isDashboardWorkspaceRoute")) errors.push("Dashboard workspace route registry is missing");
if (!shellSource.includes("isDashboardWorkspaceRoute(pathname)")) errors.push("Application shell is not driven by the canonical workspace route registry");
if (!dashboardSidebarSource.includes("APPLICATION_NAVIGATION_SECTIONS")) errors.push("Dashboard sidebar must consume the canonical navigation registry instead of maintaining a second route list");

const tsxFiles = walk(path.join(root, "apps/bridge")).filter((file) => file.endsWith(".tsx"));
for (const file of tsxFiles) {
  const source = fs.readFileSync(file, "utf8");
  for (const match of source.matchAll(/(?:href|router\.(?:push|replace)\()\s*=*\s*["'](\/[A-Za-z0-9_\-/.]+)["']/g)) {
    const href = match[1];
    if (href.startsWith("/api/") || href.startsWith("/_next/")) continue;
    const normalized = href.replace(/\/$/, "") || "/";
    const dynamicCompatible = [...concretePages].some((page) => page.includes(":dynamic") && normalized.split("/").length === page.split("/").length && page.split("/").every((part, i) => part === ":dynamic" || part === normalized.split("/")[i]));
    if (!concretePages.has(normalized) && !redirectSources.has(normalized) && !dynamicCompatible) errors.push(`Internal navigation target has no page or redirect: ${path.relative(root,file)} -> ${href}`);
  }
}

if (errors.length) {
  for (const error of [...new Set(errors)]) console.error(error);
  process.exit(1);
}
console.log(`App routing production check PASS — ${concretePages.size} pages, ${redirects.length} redirects, canonical navigation synchronized`);
