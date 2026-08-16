# Bridge Worker

Thin process supervisor for Bridge finality, Wormhole NTT observation, destination confirmation, retry handling, and reconciliation.

Business logic belongs in `@powerchain/backend`; this workspace should only own process startup/shutdown and worker supervision. Worker heartbeat state is operational evidence only and never Bridge finality authority.
