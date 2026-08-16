export type AiProviderId="powerchain"|"openai"|"anthropic"|"google"|"deepseek"|"openrouter";
export function aiProviderStatus(){return Object.freeze({
  enabled:(process.env.ENABLE_AI??"true").trim().toLowerCase()!=="false",
  providers:{
    powerchain:Boolean(process.env.POWERCHAIN_AI_API_URL?.trim()),
    openai:Boolean(process.env.OPENAI_API_KEY?.trim()),
    anthropic:Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
    google:Boolean(process.env.GOOGLE_API_KEY?.trim()),
    deepseek:Boolean(process.env.DEEPSEEK_API_KEY?.trim()),
    openrouter:Boolean(process.env.OPENROUTER_API_KEY?.trim()),
  },
  advisoryOnly:true as const,
  walletSigningAuthority:false as const,
});}
