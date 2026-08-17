# @powerchain/chat

Shared PowerChain DeFAI chat package for React message UI, prompts, provider/model metadata, saved prompt state and advisory-only AI presentation.

## Stack

- React `19.2.8`
- Vercel AI SDK `7.0.66`
- Radix Icons `1.3.2`

Provider credentials do not belong in this package or in the browser. OpenAI, DeepSeek and Google GenAI execution is owned by the server-side backend. DeepSeek uses the OpenAI-compatible transport; Google uses the official `@google/genai` SDK.

The assistant is informational only. It cannot sign, submit, finalize, settle or authorize blockchain transactions. Any swap, bridge, claim or staking action must re-enter the typed application workflow and require the connected wallet's explicit signature.

Public AI metadata is exported from `@powerchain/chat/ai/providers` and `@powerchain/chat/ai/model-settings`. Shared Radix icons are exported from `@powerchain/chat/icons`.

See [`../../docs/DEFAI_ARCHITECTURE.md`](../../docs/DEFAI_ARCHITECTURE.md).
