import { fetchIntegrationJson, configuredUrl } from "./http";
export async function fetchWalrusData(path = ""): Promise<unknown> { return fetchIntegrationJson(`${configuredUrl("POWERCHAIN_WALRUS_API_URL")}/${path.replace(/^\/+/, "")}`); }
