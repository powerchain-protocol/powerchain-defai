import { fetchIntegrationJson, configuredUrl } from "./http";
export async function fetchRaydiumData(path = ""): Promise<unknown> { return fetchIntegrationJson(`${configuredUrl("POWERCHAIN_RAYDIUM_API_URL")}/${path.replace(/^\/+/, "")}`); }
