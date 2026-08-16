export const POWERCHAIN_INFORMATION_COMMITMENT_ALGORITHM = "sha256" as const;
export const POWERCHAIN_INFORMATION_CANONICALIZATION = "powerchain-stable-json-v1" as const;
export const POWERCHAIN_INFORMATION_COMMITMENT = "f6bfd1627686fbff066ee68045a0808be4c1fc69350f3ff35fb501fa28ce51b5" as const;
export const POWERCHAIN_CANONICAL_SOLANA_MINT = "PWRCRXXZxbg6FdQZfK3PMD7KP8xfxs9acvifJiG46wc" as const;

export type PowerChainTokenInformation = {
  schema: "powerchain-token-information/v1";
  version: "1.0.0";
  canonicalAssetId: "powerchain-pwrc";
  name: "PowerChain";
  symbol: "PWRC";
  decimals: 9;
  supply: {
    model: "fixed";
    wholeTokens: "18446000000";
    baseUnits: "18446000000000000000";
  };
  solana: {
    role: "canonical";
    standard: "Token-2022";
    mint: typeof POWERCHAIN_CANONICAL_SOLANA_MINT;
    mintAuthorityPolicy: "revoked-after-genesis";
    freezeAuthorityPolicy: "revoked-after-genesis";
  };
  sui: {
    role: "wormhole-ntt-representation";
    symbol: "wPWRC";
    standard: "Sui Coin";
    coinTypeSource: "runtime-config";
    genesisRepresentationSupply: "0";
  };
  bridge: {
    protocol: "Wormhole NTT";
    principalRule: "1:1";
    auxiliaryContractsMovePrincipal: false;
  };
  fees: {
    serviceFeesSeparateFromPrincipal: true;
    networkGasSeparateFromPrincipal: true;
  };
};

export const POWERCHAIN_TOKEN_INFORMATION: PowerChainTokenInformation = Object.freeze({
  schema: "powerchain-token-information/v1",
  version: "1.0.0",
  canonicalAssetId: "powerchain-pwrc",
  name: "PowerChain",
  symbol: "PWRC",
  decimals: 9,
  supply: Object.freeze({ model: "fixed", wholeTokens: "18446000000", baseUnits: "18446000000000000000" }),
  solana: Object.freeze({
    role: "canonical",
    standard: "Token-2022",
    mint: POWERCHAIN_CANONICAL_SOLANA_MINT,
    mintAuthorityPolicy: "revoked-after-genesis",
    freezeAuthorityPolicy: "revoked-after-genesis",
  }),
  sui: Object.freeze({
    role: "wormhole-ntt-representation",
    symbol: "wPWRC",
    standard: "Sui Coin",
    coinTypeSource: "runtime-config",
    genesisRepresentationSupply: "0",
  }),
  bridge: Object.freeze({ protocol: "Wormhole NTT", principalRule: "1:1", auxiliaryContractsMovePrincipal: false }),
  fees: Object.freeze({ serviceFeesSeparateFromPrincipal: true, networkGasSeparateFromPrincipal: true }),
});

export function canonicalTokenInformationJson(information: PowerChainTokenInformation = POWERCHAIN_TOKEN_INFORMATION): string {
  const stableJson = (value: unknown): string => {
    if (value === null || typeof value !== "object") { const encoded = JSON.stringify(value); if (encoded === undefined) throw new Error("POWERCHAIN_INFORMATION_UNSERIALIZABLE"); return encoded; }
    if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(",")}}`;
  };
  return stableJson(information);
}
