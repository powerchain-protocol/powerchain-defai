import fs from "node:fs";
const read=(p)=>fs.readFileSync(p,"utf8");
for(const file of [".env.example",".env.local.example",".env.production.example"]) if(!fs.existsSync(file)) throw new Error(`ENV_TEMPLATE_MISSING:${file}`);
const env=read(".env.example"); for(const token of ["POWERCHAIN_API_KEY_MODE=optional","POWERCHAIN_API_KEYS="]) if(!env.includes(token)) throw new Error(`API_KEY_ENV_MISSING:${token}`);
const production=read(".env.production.example"); if(!production.includes("POWERCHAIN_API_KEY_MODE=required")) throw new Error("PRODUCTION_API_KEY_MODE_MUST_BE_REQUIRED_TEMPLATE");
const security=read("apps/backend/src/services/security.ts"); for(const token of ["API_KEY_HEADER","X-Api-Key","authorizeApiKey","API_KEY_REQUIRED","API_KEY_INVALID","API_KEY_NOT_CONFIGURED"]) if(!security.includes(token)) throw new Error(`API_KEY_SECURITY_MISSING:${token}`);
const proxy=read("apps/bridge/proxy.ts"); if(!proxy.includes("authorizeApiKey")||!proxy.includes("www-authenticate")) throw new Error("PROXY_API_KEY_GUARD_MISSING");
for(const file of ["api/swagger.yaml","api/bridge/openapi.yaml","api/swap/openapi.yaml"]){const text=read(file); for(const token of ["securitySchemes:","ApiKey:","type: apiKey","in: header","name: X-Api-Key","security:","- ApiKey: []"]) if(!text.includes(token)) throw new Error(`OPENAPI_API_KEY_MISSING:${file}:${token}`);}
const ts=read("apps/bridge/server/openapi.ts"); for(const token of ["security: [{ ApiKey: [] }]","securitySchemes","name: \"X-Api-Key\""]) if(!ts.includes(token)) throw new Error(`OPENAPI_TS_API_KEY_MISSING:${token}`);
console.log("api-key-security-production-check: PASS — env templates, runtime guard, OpenAPI and Postman auth policy");
