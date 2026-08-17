"use client";

import Link from "next/link";
import { useUserSettings } from "@/context/user-settings-context";
import { useConnectedWallets } from "@/lib/wallet/connected-wallets";
import { APP_ROUTES } from "@/config/app-routes";

function short(value: string | null) { return value ? `${value.slice(0, 6)}…${value.slice(-5)}` : "Not connected"; }

export function UserProfileCard() {
  const { settings, updateSettings } = useUserSettings();
  const wallets = useConnectedWallets();
  const initial = settings.profile.displayName.trim().slice(0, 1).toUpperCase() || "P";
  return <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,.8fr)]">
    <section className="pc-glass rounded-[24px] p-5 sm:p-6"><div className="flex items-center gap-4"><div className="grid size-14 place-items-center rounded-2xl bg-[#173b2d] text-lg font-bold text-white">{initial}</div><div><p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#557568]">Local profile</p><h2 className="mt-1 text-lg font-semibold">{settings.profile.displayName||"PowerChain user"}</h2><p className="text-xs text-slate-500">Personalization only · not an authentication claim</p></div></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><label><span className="text-xs font-semibold">Display name</span><input value={settings.profile.displayName} maxLength={48} onChange={(event)=>updateSettings({profile:{...settings.profile,displayName:event.target.value}})} placeholder="Display name" className="pc-input mt-2 w-full rounded-xl px-3 py-2.5 text-sm"/></label><label><span className="text-xs font-semibold">Preferred currency</span><select value={settings.profile.preferredCurrency} onChange={(event)=>updateSettings({profile:{...settings.profile,preferredCurrency:event.target.value as typeof settings.profile.preferredCurrency}})} className="pc-select mt-2 w-full rounded-xl px-3 py-2.5 text-sm">{["USD","EUR","GBP","KRW"].map(value=><option key={value}>{value}</option>)}</select></label></div><p className="mt-5 text-xs leading-5 text-slate-500">Profile fields are saved in this browser. PowerChain does not treat this profile as wallet ownership. Wallet identity still comes from the connected wallet and explicit wallet signatures.</p></section>
    <section className="pc-glass rounded-[24px] p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#557568]">Wallets</p><h2 className="mt-1 text-lg font-semibold">Connected identities</h2></div><Link href={APP_ROUTES.settings} className="pc-button-light rounded-xl px-3 py-2 text-xs font-semibold">Settings</Link></div><dl className="mt-5 space-y-3 text-sm"><div className="rounded-2xl border border-slate-200 p-3 dark:border-white/10"><dt className="text-xs text-slate-500">Solana</dt><dd className="mt-1 break-all font-mono text-xs font-semibold">{short(wallets.solanaAddress)}</dd></div><div className="rounded-2xl border border-slate-200 p-3 dark:border-white/10"><dt className="text-xs text-slate-500">Sui</dt><dd className="mt-1 break-all font-mono text-xs font-semibold">{short(wallets.suiAddress)}</dd></div></dl></section>
  </div>;
}
