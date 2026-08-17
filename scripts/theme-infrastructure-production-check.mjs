import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const must = (condition, message) => { if (!condition) throw new Error(message); };

const layout = read("apps/bridge/app/layout.tsx");
const workspaceShell = read("apps/bridge/components/navigation/workspace-shell.tsx");
const theme = read("apps/bridge/components/providers/theme-provider.tsx");
const toggle = read("apps/bridge/components/ui/theme-toggle.tsx");
const bootstrap = read("apps/bridge/components/providers/theme-bootstrap.tsx");
const mobileMenu = read("apps/bridge/components/navigation/mobile-navigation-menu.tsx");
const navigationConfig = read("apps/bridge/components/navigation/navigation-config.ts");
const appLoading = read("apps/bridge/app/loading.tsx");
const routeLoadingShell = read("apps/bridge/components/routing/route-loading-shell.tsx");
const appError = read("apps/bridge/app/error.tsx");
const manifest = read("apps/bridge/app/manifest.ts");
const css = read("apps/bridge/app/globals.css");
const proxy = read("apps/bridge/proxy.ts");
const nextConfig = read("apps/bridge/next.config.ts");
const solanaEndpoints = read("apps/backend/src/config/endpoints.ts");
const sui = read("apps/backend/src/sui/client.ts");
const cetus = read("apps/backend/src/integrations/dex/cetus.ts");
const cetusRoute = read("apps/bridge/app/api/v1/integrations/cetus/route.ts");
const vercel = JSON.parse(read("vercel.json"));

for (const token of ["data-theme=\"light\"", "suppressHydrationWarning"]) must(layout.includes(token), `layout missing ${token}`);
must(workspaceShell.includes("ThemeToggle"), "workspace shell missing ThemeToggle");
for (const token of ["powerchain.bridge.theme", "toggleTheme", 'useState<PowerChainTheme>("light")']) must(theme.includes(token), `theme provider missing ${token}`);
must(toggle.includes("Switch to ${next} theme"), "theme toggle needs an accessible stateful label");
for (const token of ["powerchain.bridge.theme", "localStorage.getItem", "theme-color"]) must(bootstrap.includes(token), `theme bootstrap missing ${token}`);
must(theme.includes('window.addEventListener("storage"'), "theme provider must synchronize theme changes across tabs");
for (const token of ["Open navigation menu", "Close navigation menu", "Escape", "event.key !== \"Tab\"", "document.body.style.overflow", "APPLICATION_NAVIGATION"]) must(mobileMenu.includes(token), `mobile navigation missing ${token}`);
for (const token of ["APP_ROUTES.claim", "APP_ROUTES.integrations", "APP_ROUTES.status"]) must(navigationConfig.includes(token), `navigation registry missing ${token}`);
for (const token of ["Loading PowerChain workspace", "RouteLoadingShell"]) must(appLoading.includes(token), `root loading state missing ${token}`);
for (const token of ["animate-pulse", "aria-busy", "Loading workspace"]) must(routeLoadingShell.includes(token), `shared route loading shell missing ${token}`);
for (const token of ["No bridge completion is inferred", "View history"]) must(appError.includes(token), `root error state missing ${token}`);
for (const token of ['display: "standalone"', "#eef1ef", "/icon.png"]) must(manifest.includes(token), `manifest missing ${token}`);
for (const token of ["@custom-variant dark", "--pc-onyx: #050807", "--pc-forest: #173b2d", ".pc-glass", ".pc-cinematic-panel", ".pc-button-light", "linear-gradient", "backdrop-filter", "scrollbar-color"]) must(css.includes(token), `theme CSS missing ${token}`);
must(!css.includes("#22c55e") && !css.includes("emerald"), "theme CSS must avoid emerald/bright-green accents");
must(workspaceShell.includes("pc-glass"), "application header must use the controlled cinematic glass primitive");
for (const file of fs.readdirSync("apps/bridge", { recursive: true }).filter((entry) => typeof entry === "string" && /\.(?:ts|tsx|css)$/.test(entry))) {
  const source = read(`apps/bridge/${file}`);
  must(!/\b(?:blue|sky|cyan|indigo)-/.test(source), `low-blue UI rule violated by apps/bridge/${file}`);
  must(!/\bemerald-|#22c55e|#10b981|#34d399/.test(source), `no-emerald UI rule violated by apps/bridge/${file}`);
}
for (const token of ["export function proxy", "x-request-id", "noindex, nofollow", "REQUEST_ID_PATTERN", "manifest.webmanifest"]) must(proxy.includes(token), `proxy missing ${token}`);
for (const token of ["productionBrowserSourceMaps: false", 'formats: ["image/avif", "image/webp"]']) must(nextConfig.includes(token), `next config missing ${token}`);
for (const token of ["HELIUS_API_KEY", "mainnet.helius-rpc.com", "devnet.helius-rpc.com", "POWERCHAIN_SOLANA_RPC_FALLBACK_URLS", "POWERCHAIN_SOLANA_WS_FALLBACK_URLS"]) must(solanaEndpoints.includes(token), `Solana/Helius config missing ${token}`);
for (const token of ["SuiGrpcClient", "POWERCHAIN_SUI_GRPC_FALLBACK_URLS", "withPowerChainSuiClient"]) must(sui.includes(token), `Sui config missing ${token}`);
for (const token of ["cetusIntegrationStatus", "POWERCHAIN_CETUS_API_URL", "authoritative"] ) if (token !== "authoritative") must(cetus.includes(token), `Cetus integration missing ${token}`);
must(cetusRoute.includes("authoritativeForBridgeSettlement: false"), "Cetus route must remain non-authoritative for bridge settlement");
must(!Object.prototype.hasOwnProperty.call(vercel, "$schema"), "vercel.json must not depend on a remote JSON schema URL");
must(vercel.framework === "nextjs", "Vercel framework must be Next.js");
must(vercel.buildCommand.endsWith("pnpm build:production") && vercel.buildCommand.includes("NEXT_TELEMETRY_DISABLED=1"), "Vercel must use telemetry-disabled production build command");

console.log("POWERCHAIN_THEME_INFRASTRUCTURE_PRODUCTION_CHECK_PASS version=1.0.0");
