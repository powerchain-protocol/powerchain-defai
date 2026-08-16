import { POWERCHAIN_INFORMATION_COMMITMENT, serverProtocolAddresses } from "@powerchain/protocol";
import type { BlockchainChain } from "@powerchain/blockchain";

export type DexChain = BlockchainChain;
export type TrustedToken = {
  id: string;
  chain: DexChain;
  symbol: string;
  name: string;
  decimals: number;
  address: string;
  native: boolean;
  tokenProgram?: "native" | "spl-token" | "token-2022" | "sui-coin";
  icon?: string;
  swapEnabled: boolean;
  poolDiscoveryEnabled: boolean;
  informationCommitment?: string;
};

const SOL_WRAPPED = "So11111111111111111111111111111111111111112";
const SOLANA_USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const SOLANA_EURC = "HzwqbKZw8HxMN6bF2yFZNrht3c2iXXzpKcFu7uBEDKtr";
const SUI_USDC = "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC";

function env(name: string): string { return process.env[name]?.trim() ?? ""; }
function add(list: TrustedToken[], token: TrustedToken) { if (token.address && !list.some((item) => item.chain === token.chain && item.address === token.address)) list.push(token); }

export function trustedTokenList(): readonly TrustedToken[] {
  const protocol = serverProtocolAddresses();
  const tokens: TrustedToken[] = [];
  add(tokens, { id: "solana:sol", chain: "SOLANA", symbol: "SOL", name: "Solana", decimals: 9, address: SOL_WRAPPED, native: true, tokenProgram: "native", swapEnabled: true, poolDiscoveryEnabled: true });
  add(tokens, { id: "solana:usdc", chain: "SOLANA", symbol: "USDC", name: "USD Coin", decimals: 6, address: env("POWERCHAIN_SOLANA_USDC_MINT") || SOLANA_USDC, native: false, tokenProgram: "spl-token", swapEnabled: true, poolDiscoveryEnabled: true });
  add(tokens, { id: "solana:eurc", chain: "SOLANA", symbol: "EURC", name: "EURC", decimals: 6, address: env("POWERCHAIN_SOLANA_EURC_MINT") || SOLANA_EURC, native: false, tokenProgram: "spl-token", swapEnabled: true, poolDiscoveryEnabled: true });
  if (protocol.pwrcSolanaMint) add(tokens, { id: "solana:pwrc", chain: "SOLANA", symbol: "PWRC", name: "PowerChain", decimals: 9, address: protocol.pwrcSolanaMint, native: false, tokenProgram: "token-2022", icon: "/tokens/pwrc.png", swapEnabled: true, poolDiscoveryEnabled: true, informationCommitment: POWERCHAIN_INFORMATION_COMMITMENT });
  add(tokens, { id: "sui:sui", chain: "SUI", symbol: "SUI", name: "Sui", decimals: 9, address: "0x2::sui::SUI", native: true, tokenProgram: "sui-coin", swapEnabled: true, poolDiscoveryEnabled: true });
  if (protocol.wpwrcSuiCoinType) add(tokens, { id: "sui:wpwrc", chain: "SUI", symbol: "wPWRC", name: "Wrapped PowerChain", decimals: 9, address: protocol.wpwrcSuiCoinType, native: false, tokenProgram: "sui-coin", icon: "/tokens/wpwrc.png", swapEnabled: true, poolDiscoveryEnabled: true, informationCommitment: POWERCHAIN_INFORMATION_COMMITMENT });
  const suiUsdc = env("POWERCHAIN_SUI_USDC_COIN_TYPE") || env("NEXT_PUBLIC_POWERCHAIN_SUI_USDC_COIN_TYPE") || SUI_USDC;
  if (suiUsdc) add(tokens, { id: "sui:usdc", chain: "SUI", symbol: "USDC", name: "USD Coin", decimals: 6, address: suiUsdc, native: false, tokenProgram: "sui-coin", swapEnabled: true, poolDiscoveryEnabled: true });
  return Object.freeze(tokens);
}

export function trustedToken(chain: DexChain, address: string): TrustedToken {
  const found = trustedTokenList().find((token) => token.chain === chain && token.address === address);
  if (!found) throw new Error("SWAP_TOKEN_NOT_TRUSTED");
  return found;
}
