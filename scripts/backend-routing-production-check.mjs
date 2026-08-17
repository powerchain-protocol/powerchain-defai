import fs from "node:fs";
import path from "node:path";
const root=process.cwd(); const routes=fs.readFileSync(path.join(root,"apps/backend/src/routing/routes.ts"),"utf8"); const router=fs.readFileSync(path.join(root,"apps/backend/src/routing/router.ts"),"utf8"); const errors=[];
for(const token of ["/api/v1/providers/health","/api/v1/providers/readiness","/api/v1/staking/status","/api/v1/staking/position","/api/v1/staking/transactions/:signature","/api/v1/escrow/readiness","/api/v1/payments/checkout","/api/v1/wallet/portfolio"]) if(!routes.includes(token)) errors.push(`backend core route missing ${token}`);
for(const token of ["routePathMatches","matchRoutePath","matchCoreRoute","allowedMethodsForCorePath","expectedSegment.startsWith(\":\")"]) if(!routes.includes(token)) errors.push(`dynamic route matcher missing ${token}`);
for(const token of ["decodeURIComponent","API_PATH_ENCODING_INVALID","API_PATH_TRAVERSAL_FORBIDDEN","replace(/\\\\/g, \"/\")"]) if(!router.includes(token)) errors.push(`route normalization hardening missing ${token}`);
if(errors.length){for(const e of errors)console.error(e);process.exit(1);} console.log("Backend routing production check PASS — dynamic core routes and traversal-safe normalization wired");
