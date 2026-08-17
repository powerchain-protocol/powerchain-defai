"use client";

import { useRef, useState } from "react";
import { SWAP_SLIPPAGE_PRESETS_BPS, formatSwapSlippagePercent } from "@powerchain/swap-core";
import { useUserSettings } from "@/context/user-settings-context";
import { usePowerChainTheme } from "@/components/providers/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input as TextInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DEFAULT_JUPITER_SWAP_API } from "@/lib/settings/defaults";
import { exportSettings, importSettings } from "@/lib/settings/storage";
import { testJupiterProvider, testPowerChainApi, testSolanaRpc, testSuiRpc, type EndpointTestResult } from "@/lib/settings/endpoint-tests";

type TestName = "api" | "solana" | "sui" | "jupiter";

function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (value: boolean) => void; label: string; description: string }) {
  return <label className="flex cursor-pointer items-start gap-3 rounded-[var(--pc-radius-control)] border border-slate-200/80 bg-slate-50/70 p-3 dark:bg-white/[.025] dark:border-white/10"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1 size-4 accent-[#173b2d]"/><span><span className="block text-sm font-semibold">{label}</span><span className="mt-0.5 block text-xs leading-5 text-slate-500">{description}</span></span></label>;
}

function Input({ label, value, onChange, placeholder, secret = false, hint }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; secret?: boolean; hint?: string }) {
  return <label className="block"><span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{label}</span><TextInput type={secret ? "password" : "url"} autoComplete="off" spellCheck={false} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2"/>{hint ? <span className="mt-1.5 block text-[11px] leading-4 text-slate-500">{hint}</span> : null}</label>;
}

function TestBadge({ result }: { result?: EndpointTestResult }) {
  if (!result) return null;
  return <Badge tone={result.ok ? "success" : "danger"}>{result.message}</Badge>;
}

export function SettingsDashboard() {
  const { settings, secrets, updateSettings, updateSecrets, replaceSettings, resetSettings, clearSecrets } = useUserSettings();
  const { theme, setTheme } = usePowerChainTheme();
  const [tests, setTests] = useState<Partial<Record<TestName, EndpointTestResult>>>({});
  const [testing, setTesting] = useState<TestName | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  async function run(name: TestName, action: () => Promise<EndpointTestResult>) {
    setTesting(name); setNotice(null);
    try { setTests((current) => ({ ...current, [name]: await action() })); }
    catch { setTests((current) => ({ ...current, [name]: { ok: false, latencyMs: 0, message: "Endpoint test failed" } })); }
    finally { setTesting(null); }
  }

  function downloadSettings() {
    const blob = new Blob([exportSettings(settings)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "powerchain-settings.json"; anchor.click(); URL.revokeObjectURL(url);
    setNotice("Settings exported without API keys.");
  }

  async function handleImport(file: File | undefined) {
    if (!file) return;
    if (file.size > 256 * 1024) { setNotice("Settings file is too large. Maximum size is 256 KB."); return; }
    try { replaceSettings(importSettings(await file.text())); setNotice("Settings imported. API keys were not imported."); }
    catch { setNotice("Unable to import settings. Verify that the file is a valid PowerChain settings export."); }
    finally { if (importRef.current) importRef.current.value = ""; }
  }

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--pc-radius-control)] border border-[#dfe7e2] bg-[#f5f8f6] px-4 py-3 text-xs text-[#365448] dark:border-white/10 dark:bg-white/[.035] dark:text-[#c8d5cf]" role="status"><span>Preferences auto-save in this browser and sync across open tabs.</span><span className="font-semibold">API keys stay session-only</span></div>

    <Card>
      <CardHeader><div><p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#557568]">Appearance & operations</p><CardTitle className="mt-1 text-lg">Dashboard experience</CardTitle><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Theme and runtime-status preferences apply locally to this browser. They never change provider, settlement or wallet authority.</p></div></CardHeader>
      <CardContent className="grid gap-5 lg:grid-cols-2">
        <fieldset><legend className="text-xs font-semibold">Theme</legend><div className="mt-2 grid grid-cols-2 gap-2">{(["light","dark"] as const).map((value)=><Button key={value} variant={theme===value?"primary":"secondary"} onClick={()=>setTheme(value)} className="capitalize">{value}</Button>)}</div><p className="mt-2 text-[11px] leading-4 text-slate-500">Light keeps the gray workspace and white cards; dark preserves the low-glow operational palette.</p></fieldset>
        <div><label className="text-xs font-semibold" htmlFor="status-refresh">Status refresh cadence</label><Select id="status-refresh" value={settings.operations.statusRefreshMs} onChange={(event)=>updateSettings({operations:{...settings.operations,statusRefreshMs:Number(event.target.value) as 15000|30000|60000|120000}})} className="mt-2">{[15000,30000,60000,120000].map((ms)=><option key={ms} value={ms}>{ms/1000}s</option>)}</Select><div className="mt-3"><Toggle checked={settings.operations.showProcessTelemetry} onChange={(value)=>updateSettings({operations:{...settings.operations,showProcessTelemetry:value}})} label="Show process telemetry" description="Displays sanitized provider counters on Status. This telemetry is never accounting or settlement evidence."/></div></div>
      </CardContent>
    </Card>
    <section className="pc-theme-card p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#557568]">Connectivity</p><h2 className="mt-1 text-lg font-semibold">PowerChain API</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Use this deployment by default, or point the browser client at another PowerChain-compatible API. External APIs must allow this app origin with CORS.</p></div><TestBadge result={tests.api}/></div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end"><div className="space-y-3"><Toggle checked={settings.connectivity.useCustomApi} onChange={(value)=>updateSettings({connectivity:{...settings.connectivity,useCustomApi:value}})} label="Use custom PowerChain API" description="Routes browser API calls through your selected PowerChain API deployment."/><Input label="API base URL" value={settings.connectivity.apiBaseUrl} onChange={(value)=>updateSettings({connectivity:{...settings.connectivity,apiBaseUrl:value}})} placeholder="https://api.example.com" hint="HTTPS is required in production. Query strings, URL credentials and fragments are rejected."/><Input secret label="PowerChain API key · session only" value={secrets.powerChainApiKey} onChange={(value)=>updateSecrets({powerChainApiKey:value})} placeholder="Optional x-api-key" hint="Stored only in sessionStorage and never included in settings export. Changing the PowerChain API base URL clears this key."/></div><Button disabled={!settings.connectivity.apiBaseUrl} loading={testing==="api"} loadingLabel="Testing…" onClick={()=>void run("api",()=>testPowerChainApi(settings.connectivity.apiBaseUrl,secrets.powerChainApiKey))}>Test API</Button></div>
    </section>

    <section className="pc-theme-card p-5 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#557568]">Wallet RPC</p><h2 className="mt-1 text-lg font-semibold">Custom Solana and Sui endpoints</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">These endpoints drive wallet-facing RPC clients. PowerChain server validation and settlement evidence remain authoritative and continue using server-managed provider quorum.</p>
      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div className="rounded-[var(--pc-radius-card)] border border-slate-200/80 bg-slate-50/55 p-4 dark:border-white/10 dark:bg-white/[.025]"><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-semibold">Solana RPC</h3><p className="text-xs text-slate-500">Wallet connection and client reads.</p></div><TestBadge result={tests.solana}/></div><div className="mt-4 space-y-3"><Toggle checked={settings.connectivity.useCustomSolanaRpc} onChange={(value)=>updateSettings({connectivity:{...settings.connectivity,useCustomSolanaRpc:value}})} label="Use custom Solana RPC" description="Reconnects the Solana wallet provider to your endpoint."/><Input label="Solana RPC URL" value={settings.connectivity.solanaRpcUrl} onChange={(value)=>updateSettings({connectivity:{...settings.connectivity,solanaRpcUrl:value}})} placeholder="https://your-solana-rpc.example"/><Button size="sm" disabled={!settings.connectivity.solanaRpcUrl} loading={testing==="solana"} loadingLabel="Testing…" onClick={()=>void run("solana",()=>testSolanaRpc(settings.connectivity.solanaRpcUrl))}>Test Solana RPC</Button></div></div>
        <div className="rounded-[var(--pc-radius-card)] border border-slate-200/80 bg-slate-50/55 p-4 dark:border-white/10 dark:bg-white/[.025]"><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-semibold">Sui RPC / gRPC endpoint</h3><p className="text-xs text-slate-500">Wallet client endpoint.</p></div><TestBadge result={tests.sui}/></div><div className="mt-4 space-y-3"><Toggle checked={settings.connectivity.useCustomSuiRpc} onChange={(value)=>updateSettings({connectivity:{...settings.connectivity,useCustomSuiRpc:value}})} label="Use custom Sui endpoint" description="Recreates the Sui wallet runtime with your configured endpoint."/><Input label="Sui endpoint URL" value={settings.connectivity.suiRpcUrl} onChange={(value)=>updateSettings({connectivity:{...settings.connectivity,suiRpcUrl:value}})} placeholder="https://your-sui-rpc.example"/><Button size="sm" disabled={!settings.connectivity.suiRpcUrl} loading={testing==="sui"} loadingLabel="Testing…" onClick={()=>void run("sui",()=>testSuiRpc(settings.connectivity.suiRpcUrl))}>Test Sui endpoint</Button></div></div>
      </div>
    </section>

    <section className="pc-theme-card p-5 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#557568]">Solana swap provider</p><h2 className="mt-1 text-lg font-semibold">Jupiter Developer API</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Use the deployment credential by default, or provide your own Jupiter API key for swap requests. The key is forwarded only to Solana swap order/execute endpoints and is never persisted by PowerChain.</p>
      <div className="mt-5 space-y-3"><Toggle checked={settings.jupiter.useCustomCredentials} onChange={(value)=>updateSettings({jupiter:{...settings.jupiter,useCustomCredentials:value}})} label="Use my Jupiter credentials" description="Overrides the server Jupiter credential only for your Solana swap requests."/><Input label="Jupiter Swap API base URL" value={settings.jupiter.apiBaseUrl} onChange={(value)=>updateSettings({jupiter:{...settings.jupiter,apiBaseUrl:value}})} placeholder={DEFAULT_JUPITER_SWAP_API} hint="Official default: https://api.jup.ag/swap/v2. Production custom hosts must be allowed by the PowerChain server."/><Input secret label="Jupiter API key · session only" value={secrets.jupiterApiKey} onChange={(value)=>updateSecrets({jupiterApiKey:value})} placeholder="x-api-key" hint={secrets.jupiterApiKey?"Credential loaded for this browser session. If a custom PowerChain API is enabled, that selected API receives this key only for the Solana swap proxy request. Changing the Jupiter base URL clears this key.":"No user Jupiter key loaded. Server credentials remain the fallback unless custom credentials are enabled."}/><div className="flex flex-wrap items-center gap-3"><Button size="sm" loading={testing==="jupiter"} loadingLabel="Validating…" onClick={()=>void run("jupiter",testJupiterProvider)}>Validate Jupiter configuration</Button><TestBadge result={tests.jupiter}/><span className="text-[11px] text-slate-500">Policy validation only; it does not request a quote or transaction.</span></div></div>
    </section>

    <section className="grid gap-5 xl:grid-cols-2">
      <div className="pc-theme-card p-5 sm:p-6"><p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#557568]">Swap</p><h2 className="mt-1 text-lg font-semibold">Trading preferences</h2><div className="mt-5 space-y-4"><fieldset><legend className="text-xs font-semibold">Default network</legend><div className="mt-2 grid grid-cols-2 gap-2">{(["SOLANA","SUI"] as const).map(chain=><Button key={chain} size="sm" aria-pressed={settings.swap.defaultChain===chain} variant={settings.swap.defaultChain===chain?"primary":"secondary"} onClick={()=>updateSettings({swap:{...settings.swap,defaultChain:chain}})}>{chain==="SOLANA"?"Solana":"Sui"}</Button>)}</div></fieldset><fieldset><legend className="text-xs font-semibold">Default slippage</legend><div className="mt-2 grid grid-cols-4 gap-2">{SWAP_SLIPPAGE_PRESETS_BPS.map(bps=><Button key={bps} size="sm" aria-pressed={settings.swap.slippageBps===bps} variant={settings.swap.slippageBps===bps?"primary":"secondary"} onClick={()=>updateSettings({swap:{...settings.swap,slippageBps:bps}})}>{formatSwapSlippagePercent(bps)}</Button>)}</div></fieldset><Toggle checked={settings.swap.mevProtection} onChange={(value)=>updateSettings({swap:{...settings.swap,mevProtection:value}})} label="MEV-aware price protection" description="Uses fresh quotes and minimum-output checks; it does not claim private order flow."/><Toggle checked={settings.swap.showAdvancedRouting} onChange={(value)=>updateSettings({swap:{...settings.swap,showAdvancedRouting:value}})} label="Advanced routing context" description="Shows provider and pool diagnostics without changing signing authority."/></div></div>
      <div className="pc-theme-card p-5 sm:p-6"><p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#557568]">Bridge</p><h2 className="mt-1 text-lg font-semibold">Transfer preferences</h2><div className="mt-5 space-y-4"><fieldset><legend className="text-xs font-semibold">Default direction</legend><div className="mt-2 grid grid-cols-2 gap-2">{(["SUI_TO_SOLANA","SOLANA_TO_SUI"] as const).map(direction=><Button key={direction} size="sm" aria-pressed={settings.bridge.defaultDirection===direction} variant={settings.bridge.defaultDirection===direction?"primary":"secondary"} onClick={()=>updateSettings({bridge:{...settings.bridge,defaultDirection:direction}})}>{direction==="SUI_TO_SOLANA"?"Sui → Solana":"Solana → Sui"}</Button>)}</div></fieldset><label className="block"><span className="text-xs font-semibold">Fallback polling interval</span><Select value={settings.bridge.statusPollMs} onChange={(event)=>updateSettings({bridge:{...settings.bridge,statusPollMs:Number(event.target.value)}})} className="mt-2">{[3000,5000,10000,15000,30000].map(ms=><option key={ms} value={ms}>{ms/1000}s</option>)}</Select></label><Toggle checked={settings.bridge.preferRealtime} onChange={(value)=>updateSettings({bridge:{...settings.bridge,preferRealtime:value}})} label="Prefer realtime transfer updates" description="Uses WebSocket/SSE when available, with persisted REST polling as fallback. Custom remote APIs use polling when credentials cannot be attached to EventSource."/></div></div>
    </section>

    <section className="pc-theme-card p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold">Settings portability</h2><p className="mt-1 text-sm text-slate-500">Export/import preferences and endpoint URLs. Secret API keys are always excluded.</p></div><div className="flex flex-wrap gap-2"><Button size="sm" onClick={downloadSettings}>Export settings</Button><Button size="sm" onClick={()=>importRef.current?.click()}>Import settings</Button><input ref={importRef} type="file" accept="application/json,.json" className="hidden" onChange={(event)=>void handleImport(event.target.files?.[0])}/><Button size="sm" variant="ghost" onClick={()=>{clearSecrets();setNotice("Session API keys cleared.")}}>Clear API keys</Button><Button size="sm" variant="danger" onClick={()=>{resetSettings();setNotice("Settings reset to safe defaults.")}}>Reset settings</Button></div></div>{notice?<p className="mt-4 rounded-[var(--pc-radius-control)] bg-slate-100 px-3 py-2 text-xs text-slate-600 dark:bg-white/[.05] dark:text-slate-300" role="status">{notice}</p>:null}</section>
  </div>;
}
