import { fetchIntegrationJson, configuredUrl } from "./http";
export async function fetchMeteoraData(path = ""): Promise<unknown> { return fetchIntegrationJson(`${configuredUrl("POWERCHAIN_METEORA_API_URL")}/${path.replace(/^\/+/, "")}`); }
