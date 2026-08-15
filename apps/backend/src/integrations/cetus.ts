import { fetchIntegrationJson, configuredUrl } from "./http";
export async function fetchCetusData(path = ""): Promise<unknown> { return fetchIntegrationJson(`${configuredUrl("POWERCHAIN_CETUS_API_URL")}/${path.replace(/^\/+/, "")}`); }
