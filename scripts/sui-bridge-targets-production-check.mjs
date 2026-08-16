import fs from "node:fs";
const read=(p)=>fs.readFileSync(p,"utf8");
const target=read("apps/backend/src/bridge/sui-targets.ts");
const contracts=read("apps/backend/src/bridge/contracts.ts");
const move=read("contracts/sui/powerchain_bridge/sources/powerchain_bridge.move");
const toml=read("contracts/sui/powerchain_bridge/Move.toml");
for(const token of ["POWERCHAIN_SUI_BRIDGE_MODULE","normalizeSuiAddress","create_information_commitment","set_authority","set_paused","record_intent"]){if(!target.includes(token))throw new Error(`SUI_TARGET_HELPER_MISSING:${token}`)}
if(!contracts.includes("suiBridgeTargets(suiPackageId)"))throw new Error("SUI_BRIDGE_TARGETS_NOT_CANONICAL");
if(!toml.includes('powerchain_bridge = "0x0"'))throw new Error("SUI_SOURCE_PACKAGE_ID_MUST_REMAIN_FAIL_CLOSED");
for(const token of ["public entry fun create_information_commitment","public entry fun set_authority","public entry fun set_paused","public entry fun record_intent"]){if(!move.includes(token))throw new Error(`SUI_MOVE_TARGET_MISSING:${token}`)}
console.log("Sui bridge target production check: PASS");
