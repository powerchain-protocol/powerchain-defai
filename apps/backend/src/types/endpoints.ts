export type EndpointKind = "rpc" | "grpc" | "rest" | "websocket";
export type EndpointRole = "primary" | "fallback";
export type EndpointDefinition = { id: string; provider: string; kind: EndpointKind; role: EndpointRole; url: string; secret: boolean };
export type EndpointPool = { primary?: EndpointDefinition; fallbacks: readonly EndpointDefinition[] };
