import { PublicKey } from "@solana/web3.js";

export const OFFICIAL_SOLANA_PROGRAMS = Object.freeze({
  token: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  token2022: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
  associatedToken: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
} as const);

export type OfficialSolanaProgramName = keyof typeof OFFICIAL_SOLANA_PROGRAMS;

function configured(env: NodeJS.ProcessEnv, name: string, fallback: string) {
  return env[name]?.trim() || fallback;
}

export function officialSolanaPrograms(env: NodeJS.ProcessEnv = process.env) {
  const values = {
    token: configured(env, "TOKEN_PROGRAM_ID", OFFICIAL_SOLANA_PROGRAMS.token),
    token2022: configured(env, "TOKEN_2022_PROGRAM_ID", OFFICIAL_SOLANA_PROGRAMS.token2022),
    associatedToken: configured(env, "ASSOCIATED_TOKEN_PROGRAM_ID", OFFICIAL_SOLANA_PROGRAMS.associatedToken),
  } as const;
  for (const [name, value] of Object.entries(values)) {
    try { new PublicKey(value); } catch { throw new Error(`SOLANA_PROGRAM_${name.toUpperCase()}_INVALID`); }
    if (value !== OFFICIAL_SOLANA_PROGRAMS[name as OfficialSolanaProgramName]) throw new Error(`SOLANA_PROGRAM_${name.toUpperCase()}_MISMATCH`);
  }
  return values;
}
