import {
  PWRC_STAKING_REWARD_MINT,
  SOLANA_STAKING_CONFIG_VERSION,
  SOLANA_STAKING_SOURCE_PLACEHOLDER_PROGRAM_ID,
  SOLANA_TOKEN_2022_PROGRAM_ID,
} from "./config";
import type { SolanaStakePositionSnapshot, SolanaStakingConfigSnapshot, StakingConfiguration, StakingIdentifier, StakingRewardSource, StakingVerificationEvidence } from "./types/staking";

const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const SOLANA_ACCOUNT_TIMEOUT_MS = 5_000;
const STAKING_CONFIG_DISCRIMINATOR_HEX = "2d86fc5225395419";

interface SolanaAccountValue { readonly data?: unknown; readonly executable?: boolean; readonly owner?: string; }
interface SolanaAccountInfoResponse {
  readonly error?: { readonly code?: number; readonly message?: string };
  readonly result?: { readonly value?: SolanaAccountValue | null };
}

function evidence(status: StakingVerificationEvidence["status"], source: StakingVerificationEvidence["source"], detail: string, checkedAt?: string): StakingVerificationEvidence {
  return checkedAt === undefined ? { status, source, detail } : { status, source, detail, checkedAt };
}
function base58Encode(bytes: Uint8Array): string {
  let value = 0n; for (const byte of bytes) value = (value << 8n) | BigInt(byte);
  let encoded = ""; while (value > 0n) { const r = Number(value % 58n); encoded = BASE58_ALPHABET[r] + encoded; value /= 58n; }
  let zeroes = 0; while (zeroes < bytes.length && bytes[zeroes] === 0) zeroes += 1;
  return "1".repeat(zeroes) + encoded;
}
function readU64LE(buffer: Buffer, offset: number): bigint { if (offset + 8 > buffer.length) throw new Error("STAKING_CONFIG_TRUNCATED"); return buffer.readBigUInt64LE(offset); }
function readPubkey(buffer: Buffer, offset: number): string { if (offset + 32 > buffer.length) throw new Error("STAKING_CONFIG_TRUNCATED"); return base58Encode(buffer.subarray(offset, offset + 32)); }

const STAKE_POSITION_DISCRIMINATOR_HEX = "4ea51e6fab7d0bdc";

export function decodeSolanaStakePosition(dataBase64: string): SolanaStakePositionSnapshot {
  const data = Buffer.from(dataBase64, "base64");
  const minimumLength = 8 + 32 + (8 * 5) + 1 + 2;
  if (data.length < minimumLength || data.subarray(0, 8).toString("hex") !== STAKE_POSITION_DISCRIMINATOR_HEX) throw new Error("STAKING_POSITION_DISCRIMINATOR_MISMATCH");
  let offset = 8;
  const owner = readPubkey(data, offset); offset += 32;
  const stakedBaseUnits = readU64LE(data, offset).toString(); offset += 8;
  const pendingUnstakeBaseUnits = readU64LE(data, offset).toString(); offset += 8;
  const accruedRewardsBaseUnits = readU64LE(data, offset).toString(); offset += 8;
  const lastRewardSlot = readU64LE(data, offset).toString(); offset += 8;
  const unstakeAvailableSlot = readU64LE(data, offset).toString(); offset += 8;
  const bump = data[offset] ?? 0; offset += 1;
  const version = data.readUInt16LE(offset);
  return { owner, stakedBaseUnits, pendingUnstakeBaseUnits, accruedRewardsBaseUnits, lastRewardSlot, unstakeAvailableSlot, bump, version };
}

export function decodeSolanaStakingConfig(dataBase64: string): SolanaStakingConfigSnapshot {
  const data = Buffer.from(dataBase64, "base64");
  if (data.length < 8 || data.subarray(0, 8).toString("hex") !== STAKING_CONFIG_DISCRIMINATOR_HEX) throw new Error("STAKING_CONFIG_DISCRIMINATOR_MISMATCH");
  const minimumLength = 8 + (32 * 4) + (8 * 8) + 1 + 1 + 1 + 2;
  if (data.length < minimumLength) throw new Error("STAKING_CONFIG_TRUNCATED");
  let offset = 8;
  const authority = readPubkey(data, offset); offset += 32;
  const mint = readPubkey(data, offset); offset += 32;
  const stakeVault = readPubkey(data, offset); offset += 32;
  const rewardVault = readPubkey(data, offset); offset += 32;
  const rewardAllocationCapBaseUnits = readU64LE(data, offset).toString(); offset += 8;
  const totalRewardsFundedBaseUnits = readU64LE(data, offset).toString(); offset += 8;
  const totalRewardsDistributedBaseUnits = readU64LE(data, offset).toString(); offset += 8;
  const totalStakedBaseUnits = readU64LE(data, offset).toString(); offset += 8;
  const rewardRatePpmPerEpoch = readU64LE(data, offset).toString(); offset += 8;
  const epochSlots = readU64LE(data, offset).toString(); offset += 8;
  const cooldownSlots = readU64LE(data, offset).toString(); offset += 8;
  const minStakeBaseUnits = readU64LE(data, offset).toString(); offset += 8;
  const paused = data[offset] === 1; offset += 3;
  const version = data.readUInt16LE(offset);
  return { authority, mint, stakeVault, rewardVault, rewardAllocationCapBaseUnits, totalRewardsFundedBaseUnits, totalRewardsDistributedBaseUnits, totalStakedBaseUnits, rewardRatePpmPerEpoch, epochSlots, cooldownSlots, minStakeBaseUnits, paused, version };
}

async function rpcAccountInfo(rpcUrl: string, address: string, encoding: "base64" | "jsonParsed", parentSignal?: AbortSignal) {
  const controller = new AbortController();
  const abortFromParent = () => controller.abort(parentSignal?.reason);
  parentSignal?.addEventListener("abort", abortFromParent, { once: true });
  if (parentSignal?.aborted) controller.abort(parentSignal.reason);
  const timeout = setTimeout(() => controller.abort(new Error("STAKING_RPC_TIMEOUT")), SOLANA_ACCOUNT_TIMEOUT_MS);
  try {
    const response = await fetch(rpcUrl, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: `powerchain-staking-${encoding}`, method: "getAccountInfo", params: [address, { encoding, commitment: "confirmed" }] }), signal: controller.signal, cache: "no-store" });
    if (!response.ok) throw new Error(`SOLANA_RPC_HTTP_${response.status}`);
    const payload = await response.json() as SolanaAccountInfoResponse;
    if (payload.error) throw new Error(`SOLANA_RPC_${payload.error.code ?? "ERROR"}:${payload.error.message ?? "unknown"}`);
    return payload.result;
  } finally { clearTimeout(timeout); parentSignal?.removeEventListener("abort", abortFromParent); }
}

function parsedTokenAccount(value: SolanaAccountValue): { mint: string; amount: string } | null {
  if (value.owner !== SOLANA_TOKEN_2022_PROGRAM_ID || !value.data || typeof value.data !== "object" || Array.isArray(value.data)) return null;
  const parsed = (value.data as { parsed?: unknown }).parsed;
  if (!parsed || typeof parsed !== "object") return null;
  const info = (parsed as { info?: unknown }).info;
  if (!info || typeof info !== "object") return null;
  const mint = (info as { mint?: unknown }).mint; const tokenAmount = (info as { tokenAmount?: unknown }).tokenAmount;
  if (typeof mint !== "string" || !tokenAmount || typeof tokenAmount !== "object") return null;
  const amount = (tokenAmount as { amount?: unknown }).amount; return typeof amount === "string" ? { mint, amount } : null;
}

function repositoryIdentifiers(): readonly StakingIdentifier[] {
  const verified = evidence("verified", "repository", "Canonical PWRC mint and Token-2022 program are pinned by the PowerChain protocol source.");
  return [{ name: "mint", value: PWRC_STAKING_REWARD_MINT, evidence: verified }, { name: "token-program", value: SOLANA_TOKEN_2022_PROGRAM_ID, evidence: verified }];
}
function rewardSource(input: { sourceType: StakingRewardSource["sourceType"]; evidence: StakingVerificationEvidence; rewardVault?: string; snapshot?: SolanaStakingConfigSnapshot; availableBaseUnits?: string }): StakingRewardSource {
  const snapshot = input.snapshot;
  return {
    model: "fixed-pool", tokenSymbol: "PWRC", allocationPolicy: "on-chain-configured-cap", sourceType: input.sourceType,
    rewardAssetIdentifier: PWRC_STAKING_REWARD_MINT,
    ...(input.rewardVault === undefined ? {} : { sourceIdentifier: input.rewardVault }),
    ...(snapshot === undefined ? {} : {
      allocationCapBaseUnits: snapshot.rewardAllocationCapBaseUnits,
      fundedBaseUnits: snapshot.totalRewardsFundedBaseUnits,
      distributedBaseUnits: snapshot.totalRewardsDistributedBaseUnits,
      rate: { ppmPerEpoch: snapshot.rewardRatePpmPerEpoch, epochSlots: snapshot.epochSlots, source: "on-chain-config", evidence: input.evidence },
    }),
    ...(input.availableBaseUnits === undefined ? {} : { availableBaseUnits: input.availableBaseUnits }),
    evidence: input.evidence,
  };
}

export async function verifySolanaStakingDeployment(input: { readonly rpcUrl?: string; readonly rpcUrls?: readonly string[]; readonly programId?: string; readonly configAddress?: string; readonly stakeVault?: string; readonly rewardVault?: string; readonly signal?: AbortSignal }): Promise<StakingConfiguration> {
  const checkedAt = new Date().toISOString(); const identifiers: StakingIdentifier[] = [...repositoryIdentifiers()];
  const required = [input.programId, input.configAddress, input.stakeVault, input.rewardVault];
  if (required.some((value) => !value)) {
    const unverified = evidence("unverified", "operator-config", "Program, config, stake vault and reward vault must all be configured; reward cap/rate remain unknown until verified on-chain.");
    return { chain: "SOLANA", state: "disabled", tokenSymbol: "PWRC", custodyModel: "unconfigured", identifiers, rewardSource: rewardSource({ sourceType: "unconfigured", evidence: unverified }), deploymentEvidence: unverified, executable: false, reason: "STAKING_DEPLOYMENT_IDENTIFIERS_REQUIRED" };
  }
  const programId=input.programId!; const configAddress=input.configAddress!; const stakeVault=input.stakeVault!; const rewardVault=input.rewardVault!;
  for (const [name,value] of [["program",programId],["config",configAddress],["stake-vault",stakeVault],["reward-vault",rewardVault]] as const) identifiers.push({ name, value, evidence: evidence("unverified","operator-config","Configured value awaiting RPC verification.") });
  if (programId === SOLANA_STAKING_SOURCE_PLACEHOLDER_PROGRAM_ID) {
    const invalid=evidence("invalid","repository","Compile-time staking placeholder cannot be used as a deployment identifier.");
    return { chain:"SOLANA",state:"verification-required",tokenSymbol:"PWRC",custodyModel:"program-vault",identifiers,rewardSource:rewardSource({sourceType:"program-reward-vault",evidence:invalid,rewardVault}),deploymentEvidence:invalid,executable:false,reason:"STAKING_PROGRAM_ID_PLACEHOLDER_FORBIDDEN" };
  }
  const rpcUrls = [...new Set([input.rpcUrl, ...(input.rpcUrls ?? [])].map((value) => value?.trim()).filter((value): value is string => Boolean(value)))];
  if (!rpcUrls.length) {
    const unverified=evidence("unverified","operator-config","Solana RPC is required to verify executable program, config, vault identities and reward policy.");
    return { chain:"SOLANA",state:"verification-required",tokenSymbol:"PWRC",custodyModel:"program-vault",identifiers,rewardSource:rewardSource({sourceType:"program-reward-vault",evidence:unverified,rewardVault}),deploymentEvidence:unverified,executable:false,reason:"SOLANA_RPC_REQUIRED_FOR_STAKING_VERIFICATION" };
  }
  const attempts: string[] = [];
  for (let endpointIndex = 0; endpointIndex < rpcUrls.length; endpointIndex += 1) {
    const rpcUrl = rpcUrls[endpointIndex]!;
    try {
      const [programResult,configResult,stakeVaultResult,rewardVaultResult]=await Promise.all([rpcAccountInfo(rpcUrl,programId,"base64",input.signal),rpcAccountInfo(rpcUrl,configAddress,"base64",input.signal),rpcAccountInfo(rpcUrl,stakeVault,"jsonParsed",input.signal),rpcAccountInfo(rpcUrl,rewardVault,"jsonParsed",input.signal)]);
      const programAccount=programResult?.value; const configAccount=configResult?.value; const stakeAccount=stakeVaultResult?.value; const rewardAccount=rewardVaultResult?.value;
      if (!programAccount?.executable) throw new Error("STAKING_PROGRAM_NOT_EXECUTABLE");
      if (!configAccount || configAccount.owner!==programId || !Array.isArray(configAccount.data) || typeof configAccount.data[0]!=="string") throw new Error("STAKING_CONFIG_NOT_OWNED_BY_PROGRAM");
      if (!stakeAccount || !rewardAccount) throw new Error("STAKING_VAULT_ACCOUNT_MISSING");
      const parsedStake=parsedTokenAccount(stakeAccount); const parsedReward=parsedTokenAccount(rewardAccount);
      if (!parsedStake || parsedStake.mint!==PWRC_STAKING_REWARD_MINT) throw new Error("STAKING_STAKE_VAULT_INVALID");
      if (!parsedReward || parsedReward.mint!==PWRC_STAKING_REWARD_MINT) throw new Error("STAKING_REWARD_VAULT_INVALID");
      const snapshot=decodeSolanaStakingConfig(configAccount.data[0]);
      if (snapshot.version!==SOLANA_STAKING_CONFIG_VERSION) throw new Error("STAKING_CONFIG_VERSION_MISMATCH");
      if (snapshot.mint!==PWRC_STAKING_REWARD_MINT) throw new Error("STAKING_CONFIG_MINT_MISMATCH");
      if (snapshot.stakeVault!==stakeVault || snapshot.rewardVault!==rewardVault) throw new Error("STAKING_CONFIG_VAULT_MISMATCH");
      const cap=BigInt(snapshot.rewardAllocationCapBaseUnits); const funded=BigInt(snapshot.totalRewardsFundedBaseUnits); const distributed=BigInt(snapshot.totalRewardsDistributedBaseUnits); const vaultAmount=BigInt(parsedReward.amount);
      if (cap<=0n) throw new Error("STAKING_REWARD_ALLOCATION_INVALID");
      if (funded>cap) throw new Error("STAKING_REWARD_FUNDING_EXCEEDS_ALLOCATION");
      if (distributed>funded) throw new Error("STAKING_REWARD_DISTRIBUTION_EXCEEDS_FUNDING");
      if (BigInt(snapshot.rewardRatePpmPerEpoch)<=0n || BigInt(snapshot.rewardRatePpmPerEpoch)>1_000_000n) throw new Error("STAKING_REWARD_RATE_INVALID");
      if (BigInt(snapshot.epochSlots)<=0n) throw new Error("STAKING_EPOCH_SLOTS_ZERO");
      if (BigInt(snapshot.minStakeBaseUnits)<=0n) throw new Error("STAKING_MIN_STAKE_ZERO");
      const accountedRemaining=funded-distributed; if (vaultAmount<accountedRemaining) throw new Error("STAKING_REWARD_VAULT_ACCOUNTING_DEFICIT");
      const verified=evidence("verified","solana-rpc",`Executable program, program-owned config, canonical Token-2022 PWRC vaults, funded reward cap and reward-rate policy verified from configured RPC endpoint ${endpointIndex + 1}.`,checkedAt);
      const verifiedIdentifiers=identifiers.map((item)=>item.evidence.status==="unverified"?{...item,evidence:verified}:item);
      const rewards=rewardSource({sourceType:"program-reward-vault",evidence:verified,rewardVault,snapshot,availableBaseUnits:parsedReward.amount});
      const rewardAvailable=accountedRemaining>0n && vaultAmount>0n;
      return { chain:"SOLANA",state:rewardAvailable?"configured":"unavailable",tokenSymbol:"PWRC",custodyModel:"program-vault",identifiers:verifiedIdentifiers,rewardSource:rewards,deploymentEvidence:verified,poolMetrics:{totalStakedBaseUnits:snapshot.totalStakedBaseUnits,minStakeBaseUnits:snapshot.minStakeBaseUnits,cooldownSlots:snapshot.cooldownSlots,source:"on-chain-config",evidence:verified},executable:rewardAvailable&&!snapshot.paused,paused:snapshot.paused,...(rewardAvailable?{}:{reason:"STAKING_REWARD_POOL_EMPTY_OR_EXHAUSTED"}) };
    } catch (reason) {
      if (input.signal?.aborted) throw input.signal.reason instanceof Error ? input.signal.reason : new Error("STAKING_VERIFICATION_ABORTED");
      attempts.push(reason instanceof Error ? reason.message : "STAKING_RPC_VERIFICATION_FAILED");
    }
  }
  const detail=attempts.length ? `STAKING_RPC_VERIFICATION_FAILED:${attempts.join("|")}` : "STAKING_RPC_VERIFICATION_FAILED";
  const unavailable=evidence("unavailable","solana-rpc",detail,checkedAt);
  return { chain:"SOLANA",state:"unavailable",tokenSymbol:"PWRC",custodyModel:"program-vault",identifiers,rewardSource:rewardSource({sourceType:"program-reward-vault",evidence:unavailable,rewardVault}),deploymentEvidence:unavailable,executable:false,reason:detail };
}

export function suiStakingConfiguration(input: { readonly packageId?: string; readonly poolObjectId?: string; readonly rewardPoolObjectId?: string; readonly coinType?: string }): StakingConfiguration {
  const identifiers: StakingIdentifier[]=[];
  if(input.packageId)identifiers.push({name:"package",value:input.packageId,evidence:evidence("unverified","operator-config","Configured Sui package requires runtime verification.")});
  if(input.poolObjectId)identifiers.push({name:"pool",value:input.poolObjectId,evidence:evidence("unverified","operator-config","Configured Sui pool requires runtime object verification.")});
  if(input.rewardPoolObjectId)identifiers.push({name:"reward-pool",value:input.rewardPoolObjectId,evidence:evidence("unverified","operator-config","Configured Sui reward pool requires runtime object verification.")});
  if(input.coinType)identifiers.push({name:"coin-type",value:input.coinType,evidence:evidence("unverified","operator-config","Configured wPWRC coin type requires runtime verification.")});
  const complete=Boolean(input.packageId&&input.poolObjectId&&input.rewardPoolObjectId&&input.coinType);
  const ev=evidence("unverified","sui-runtime",complete?"Sui identifiers are configured, but package/object ownership and reward funding have not been runtime-verified.":"Sui staking deployment identifiers are incomplete.");
  return { chain:"SUI",state:complete?"verification-required":"disabled",tokenSymbol:"wPWRC",custodyModel:complete?"shared-object":"unconfigured",identifiers,rewardSource:{model:"fixed-pool",tokenSymbol:"wPWRC",allocationPolicy:"on-chain-configured-cap",sourceType:complete?"shared-reward-pool":"unconfigured",...(input.coinType?{rewardAssetIdentifier:input.coinType}:{}),...(input.rewardPoolObjectId?{sourceIdentifier:input.rewardPoolObjectId}:{}),evidence:ev},deploymentEvidence:ev,executable:false,reason:complete?"SUI_STAKING_RUNTIME_VERIFICATION_REQUIRED":"STAKING_DEPLOYMENT_IDENTIFIERS_REQUIRED" };
}
