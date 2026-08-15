import { fetchIntegrationJson, configuredUrl } from "./http";
export async function fetchOrcaData(path = ""): Promise<unknown> { return fetchIntegrationJson(`${configuredUrl("POWERCHAIN_ORCA_API_URL")}/${path.replace(/^\/+/, "")}`); }
