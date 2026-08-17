import { fetchPythSuiSignedUpdates, normalizePythFeedId } from "@powerchain/blockchain/pyth-sui";
import { providerUrls } from "../config/provider-urls";

export type PythSuiStatus = Readonly<{
  client: "native-fetch";
  transport: "hermes-rest-v2";
  suiSdk: "@mysten/sui";
  onchainBuilder: "feature-gated";
  apiKeyConfigured: boolean;
}>;

export function pythSuiStatus(env: NodeJS.ProcessEnv = process.env): PythSuiStatus {
  return {
    client: "native-fetch",
    transport: "hermes-rest-v2",
    suiSdk: "@mysten/sui",
    onchainBuilder: "feature-gated",
    apiKeyConfigured: Boolean(env.POWERCHAIN_PYTH_API_KEY?.trim() || env.PYTH_API_KEY?.trim()),
  };
}

export async function getSuiPythSignedUpdates(feedIds: readonly string[], env: NodeJS.ProcessEnv = process.env) {
  const ids = feedIds.map(normalizePythFeedId);
  const accessToken = env.POWERCHAIN_PYTH_API_KEY?.trim() || env.PYTH_API_KEY?.trim();
  return fetchPythSuiSignedUpdates(ids, {
    endpoint: providerUrls(env).pythHermes,
    ...(accessToken ? { accessToken } : {}),
  });
}
