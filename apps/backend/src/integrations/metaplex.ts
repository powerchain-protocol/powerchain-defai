import { PublicKey } from "@solana/web3.js";
export const TOKEN_METADATA_PROGRAM_ID=new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
export function tokenMetadataPda(mint:string){const mintKey=new PublicKey(mint);return PublicKey.findProgramAddressSync([Buffer.from("metadata"),TOKEN_METADATA_PROGRAM_ID.toBuffer(),mintKey.toBuffer()],TOKEN_METADATA_PROGRAM_ID)[0].toBase58()}
export function metaplexStatus(){return{provider:"metaplex" as const,chain:"solana" as const,tokenMetadataProgram:TOKEN_METADATA_PROGRAM_ID.toBase58(),onChain:true}}
