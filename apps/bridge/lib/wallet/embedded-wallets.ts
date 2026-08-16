export type EmbeddedWalletCapability = "sign-transaction" | "sign-message";
export type EmbeddedWalletDescriptor = { provider:string; chain:"SOLANA"|"SUI"; address:string; embedded:boolean; capabilities:readonly EmbeddedWalletCapability[] };
export function embeddedWalletDescriptor(input:EmbeddedWalletDescriptor):EmbeddedWalletDescriptor{
  if(!input.address.trim()) throw new Error("EMBEDDED_WALLET_ADDRESS_REQUIRED");
  if(!input.capabilities.includes("sign-transaction")) throw new Error("EMBEDDED_WALLET_TRANSACTION_SIGNATURE_REQUIRED");
  return {...input,address:input.address.trim()};
}
export function canEmbeddedWalletExecute(wallet:EmbeddedWalletDescriptor|null|undefined):boolean{return Boolean(wallet?.capabilities.includes("sign-transaction"));}
