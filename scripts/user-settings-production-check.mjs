import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");
const requireToken = (source, token, label) => {
  if (!source.includes(token)) throw new Error(`${label}:${token}`);
};

for (const file of [
  "apps/bridge/app/profile/page.tsx",
  "apps/bridge/app/settings/page.tsx",
  "apps/bridge/components/profile/user-profile-card.tsx",
  "apps/bridge/components/settings/settings-dashboard.tsx",
  "apps/bridge/context/user-settings-context.tsx",
  "apps/bridge/lib/settings/storage.ts",
  "apps/bridge/lib/api/client-routing.ts",
]) {
  if (!fs.existsSync(file)) throw new Error(`USER_SETTINGS_REQUIRED_FILE_MISSING:${file}`);
}

const storage = read("apps/bridge/lib/settings/storage.ts");
for (const token of [
  "powerchain.user-settings.v2",
  "powerchain.user-secrets.session.v1",
  "window.localStorage",
  "window.sessionStorage",
  "SETTINGS_IMPORT_TOO_LARGE",
  "secretsIncluded: false",
  "migrateLegacySettings",
]) requireToken(storage, token, "USER_SETTINGS_STORAGE_GUARD_MISSING");
if (/localStorage[^\n]*(powerChainApiKey|jupiterApiKey)/i.test(storage)) {
  throw new Error("USER_SETTINGS_SECRET_LOCAL_STORAGE_FORBIDDEN");
}

const clientRouting = read("apps/bridge/lib/api/client-routing.ts");
for (const token of [
  "x-powerchain-jupiter-api-key",
  "x-powerchain-jupiter-api-url",
  "x-api-key",
  "normalizeHttpEndpoint",
]) requireToken(clientRouting, token, "USER_SETTINGS_CLIENT_ROUTING_MISSING");

const jupiter = read("apps/backend/src/integrations/dex/jupiter.ts");
for (const token of [
  "POWERCHAIN_JUPITER_USER_API_HOSTS",
  "JUPITER_CUSTOM_API_KEY_REQUIRED",
  "JUPITER_CUSTOM_API_HOST_NOT_ALLOWED",
  "JUPITER_CUSTOM_API_HOST_UNSAFE",
  "unsafeProductionHost",
  "api.jup.ag",
  "/swap/v2",
]) requireToken(jupiter, token, "USER_SETTINGS_JUPITER_GUARD_MISSING");

const proxy = read("apps/bridge/proxy.ts");
for (const token of [
  "POWERCHAIN_CORS_ORIGINS",
  "x-powerchain-jupiter-api-key",
  "x-powerchain-jupiter-api-url",
  "access-control-allow-origin",
]) requireToken(proxy, token, "USER_SETTINGS_CORS_GUARD_MISSING");

const settingsContext = read("apps/bridge/context/user-settings-context.tsx");
for (const token of ["SETTINGS_STORAGE_KEY", "storage", "writeStoredSettings", "writeSessionSecrets", "powerChainEndpointChanged", "jupiterEndpointChanged", "externalPowerChainEndpointChanged", "externalJupiterEndpointChanged", "clearSessionSecrets"]) {
  requireToken(settingsContext, token, "USER_SETTINGS_CROSS_TAB_SYNC_MISSING");
}

const sdkApi = read("packages/sdk/src/api-client.ts");
for (const token of ["buildApiPath", "POWERCHAIN_API_PATH_PARAM_REQUIRED", "encodeURIComponent"]) {
  requireToken(sdkApi, token, "USER_SETTINGS_GENERATED_API_HELPER_MISSING");
}

const endpointTests = read("apps/bridge/lib/settings/endpoint-tests.ts");
for (const token of ["SuiGrpcClient", "getChainIdentifier", "getHealth", "testJupiterProvider", "/api/v1/swap/solana/provider"]) {
  requireToken(endpointTests, token, "USER_SETTINGS_ENDPOINT_TEST_MISSING");
}

const sdk = read("packages/sdk/src/client.ts");
for (const token of ["GeneratedApiClient", "readonly api:", "ApiHeadersFactory"]) {
  requireToken(sdk, token, "USER_SETTINGS_SDK_CLIENT_MISSING");
}
const swapSdk = read("packages/sdk/src/swap-client.ts");
for (const token of ["solanaProviderWithJupiter", "solanaOrderWithJupiter", "solanaExecuteWithJupiter", "JupiterClientOverride"]) {
  requireToken(swapSdk, token, "USER_SETTINGS_SDK_JUPITER_MISSING");
}

const generated = read("packages/sdk/src/generated/api-routes.ts");
requireToken(generated, "GENERATED_API_ROUTES", "USER_SETTINGS_GENERATED_API_REGISTRY_MISSING");
const providerRoute = read("apps/bridge/app/api/v1/swap/solana/provider/route.ts");
for (const token of ["resolveJupiterRequestConfig", "credentialPersisted: false", "Selected Jupiter configuration is not accepted"]) {
  requireToken(providerRoute, token, "USER_SETTINGS_JUPITER_PROVIDER_CHECK_MISSING");
}
const overrideHelper = read("apps/bridge/server/jupiter-user-override.ts");
for (const token of ["jupiterRequestOverride", "x-powerchain-jupiter-api-key", "x-powerchain-jupiter-api-url"]) {
  requireToken(overrideHelper, token, "USER_SETTINGS_JUPITER_OVERRIDE_HELPER_MISSING");
}
const openapi = read("apps/bridge/server/openapi.ts");
for (const token of ["UserJupiterApiKey", "UserJupiterApiUrl", "x-powerchain-jupiter-api-key", "x-powerchain-jupiter-api-url"]) {
  requireToken(openapi, token, "USER_SETTINGS_OPENAPI_JUPITER_OVERRIDE_MISSING");
}

const browserApiRoots = ["apps/bridge/components", "apps/bridge/hooks", "apps/bridge/lib"];
for (const root of browserApiRoots) {
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = `${current}/${entry.name}`;
      if (entry.isDirectory()) { stack.push(full); continue; }
      if (!/\.(ts|tsx)$/.test(entry.name) || full.endsWith("lib/settings/endpoint-tests.ts")) continue;
      const source = read(full);
      if (/new URL\(["'`]\/api\/v1\//.test(source)) throw new Error(`USER_SETTINGS_CUSTOM_API_ABSOLUTE_BYPASS:${full}`);
      if (/\bfetch\(["'`]\/api\/v1\//.test(source)) throw new Error(`USER_SETTINGS_CUSTOM_API_FETCH_BYPASS:${full}`);
    }
  }
}

const navigation = read("apps/bridge/config/app-routes.ts");
for (const token of ['profile: "/profile"', 'settings: "/settings"']) {
  requireToken(navigation, token, "USER_SETTINGS_APP_ROUTE_MISSING");
}

console.log("user-settings-production-check: PASS — profile/settings, local preferences, session-only secrets, custom RPC/API and Jupiter SDK overrides");
