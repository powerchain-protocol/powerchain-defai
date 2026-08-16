import { createHash } from "node:crypto";
import {
  POWERCHAIN_CANONICAL_SOLANA_MINT,
  POWERCHAIN_INFORMATION_CANONICALIZATION,
  POWERCHAIN_INFORMATION_COMMITMENT,
  POWERCHAIN_INFORMATION_COMMITMENT_ALGORITHM,
  POWERCHAIN_TOKEN_INFORMATION,
  canonicalTokenInformationJson,
  serverProtocolAddresses,
} from "@powerchain/protocol";

export type TokenInformationVerification = {
  commitment: string;
  algorithm: typeof POWERCHAIN_INFORMATION_COMMITMENT_ALGORITHM;
  canonicalization: typeof POWERCHAIN_INFORMATION_CANONICALIZATION;
  compiledCommitmentMatches: boolean;
  solanaMintMatches: boolean;
  wpwrcCoinTypeConfigured: boolean;
  runtimeVerified: boolean;
  failures: readonly string[];
};

export function computedTokenInformationCommitment(): string {
  return createHash("sha256").update(canonicalTokenInformationJson()).digest("hex");
}

export function verifyRuntimeTokenInformation(): TokenInformationVerification {
  const addresses = serverProtocolAddresses();
  const computed = computedTokenInformationCommitment();
  const compiledCommitmentMatches = computed === POWERCHAIN_INFORMATION_COMMITMENT;
  const solanaMintMatches = addresses.pwrcSolanaMint === POWERCHAIN_CANONICAL_SOLANA_MINT;
  const wpwrcCoinTypeConfigured = addresses.wpwrcSuiCoinType.length > 0;
  const failures: string[] = [];
  if (!compiledCommitmentMatches) failures.push("INFORMATION_COMMITMENT_MISMATCH");
  if (!solanaMintMatches) failures.push(addresses.pwrcSolanaMint ? "PWRC_SOLANA_MINT_MISMATCH" : "PWRC_SOLANA_MINT_UNCONFIGURED");
  if (!wpwrcCoinTypeConfigured) failures.push("WPWRC_SUI_COIN_TYPE_UNCONFIGURED");
  return Object.freeze({
    commitment: POWERCHAIN_INFORMATION_COMMITMENT,
    algorithm: POWERCHAIN_INFORMATION_COMMITMENT_ALGORITHM,
    canonicalization: POWERCHAIN_INFORMATION_CANONICALIZATION,
    compiledCommitmentMatches,
    solanaMintMatches,
    wpwrcCoinTypeConfigured,
    runtimeVerified: failures.length === 0,
    failures: Object.freeze(failures),
  });
}

export function tokenInformation() {
  const verification = verifyRuntimeTokenInformation();
  const addresses = serverProtocolAddresses();
  return Object.freeze({
    information: POWERCHAIN_TOKEN_INFORMATION,
    informationCommitment: Object.freeze({
      algorithm: POWERCHAIN_INFORMATION_COMMITMENT_ALGORITHM,
      canonicalization: POWERCHAIN_INFORMATION_CANONICALIZATION,
      digest: POWERCHAIN_INFORMATION_COMMITMENT,
    }),
    runtime: Object.freeze({
      canonicalSolanaMint: POWERCHAIN_CANONICAL_SOLANA_MINT,
      configuredPwrcSolanaMint: addresses.pwrcSolanaMint || null,
      configuredWpwrcSuiCoinType: addresses.wpwrcSuiCoinType || null,
      verification,
    }),
    authoritativeForBridgeAccounting: false as const,
  });
}
