import { PublicKey } from "@solana/web3.js";
import { normalizeSuiAddress } from "@powerchain/blockchain";
import { POWERCHAIN_INFORMATION_COMMITMENT, POWERCHAIN_SOLANA_BRIDGE_PROGRAM_ID } from "@powerchain/protocol";
import { auxiliaryBridgeConfig } from "./config";
import type { BridgeDirection } from "./types";
import { bridgeDirectionCode as canonicalDirectionCode, parseQuoteCommitment } from "@powerchain/bridge-core";
import { POWERCHAIN_SUI_BRIDGE_MODULE, suiBridgeTargets } from "./sui-targets";

const BRIDGE_CONFIG_SEED = "bridge-config";
const INFORMATION_COMMITMENT_SEED = "information-commitment";

export function bridgeDirectionCode(direction: BridgeDirection): 0 | 1 {
  return canonicalDirectionCode(direction);
}

export function quoteCommitmentBytes(commitment: string): Uint8Array {
  return parseQuoteCommitment(commitment).bytes;
}

export function auxiliaryBridgeOperations() {
  const configured = auxiliaryBridgeConfig();
  const programId = new PublicKey(POWERCHAIN_SOLANA_BRIDGE_PROGRAM_ID);
  const [configPda, bump] = PublicKey.findProgramAddressSync([Buffer.from(BRIDGE_CONFIG_SEED)], programId);
  const [informationPda, informationBump] = PublicKey.findProgramAddressSync([Buffer.from(INFORMATION_COMMITMENT_SEED)], programId);
  const suiPackageId = configured.sui.packageId ? normalizeSuiAddress(configured.sui.packageId) : null;
  const suiConfigObject = process.env.POWERCHAIN_SUI_BRIDGE_CONFIG_OBJECT_ID?.trim();
  const suiInformationObject = process.env.POWERCHAIN_SUI_INFORMATION_COMMITMENT_OBJECT_ID?.trim();

  return {
    solana: {
      programId: programId.toBase58(),
      configPda: configPda.toBase58(),
      configBump: bump,
      authority: configured.solana.authority,
      informationCommitmentPda: informationPda.toBase58(),
      informationCommitmentBump: informationBump,
      informationCommitment: POWERCHAIN_INFORMATION_COMMITMENT,
      instructions: {
        initializeConfig: "initialize_config",
        initializeInformationCommitment: "initialize_information_commitment",
        assertInformationCommitment: "assert_information_commitment",
        setAuthority: "set_authority",
        setPaused: "set_paused",
        recordIntent: "record_intent",
        recordIntentV2Event: "BridgeIntentRecordedV2",
      },
    },
    sui: {
      packageId: suiPackageId,
      configObjectId: suiConfigObject ? normalizeSuiAddress(suiConfigObject) : null,
      authority: configured.sui.authority,
      informationCommitmentObjectId: suiInformationObject ? normalizeSuiAddress(suiInformationObject) : null,
      informationCommitment: POWERCHAIN_INFORMATION_COMMITMENT,
      module: POWERCHAIN_SUI_BRIDGE_MODULE,
      targets: suiPackageId ? suiBridgeTargets(suiPackageId) : null,
    },
    directionCodes: {
      SOLANA_TO_SUI: 0,
      SUI_TO_SOLANA: 1,
    },
    principalMovement: "wormhole-ntt-only",
  } as const;
}
