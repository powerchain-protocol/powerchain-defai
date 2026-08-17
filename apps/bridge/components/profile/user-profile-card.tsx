"use client";

import Link from "next/link";
import { GearIcon, PersonIcon } from "@radix-ui/react-icons";
import { APP_ROUTES } from "@/config/app-routes";
import { useUserSettings } from "@/context/user-settings-context";
import { useConnectedWallets } from "@/lib/wallet/connected-wallets";
import { compactAddress } from "@/utils/helpers";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardIcon, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

function WalletRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-[var(--pc-radius-control)] border border-slate-200/80 bg-slate-50/75 p-3 dark:border-white/8 dark:bg-white/[.03]">
      <dt className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-500">{label}</dt>
      <dd className="mt-1 break-all font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">{value ? compactAddress(value, 8, 6) : "Not connected"}</dd>
    </div>
  );
}

export function UserProfileCard() {
  const { settings, updateSettings } = useUserSettings();
  const wallets = useConnectedWallets();
  const displayName = settings.profile.displayName.trim() || "PowerChain user";
  const initial = displayName.slice(0, 1).toUpperCase() || "P";

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,.8fr)]">
      <Card>
        <CardHeader>
          <div className="flex min-w-0 items-center gap-3">
            <Avatar fallback={initial} size={48} className="bg-[#173b2d] text-white dark:bg-[#d0dcd6] dark:text-[#0b1511]" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#557568]">Local profile</p>
              <CardTitle className="mt-1 truncate text-lg">{displayName}</CardTitle>
              <p className="mt-0.5 text-xs text-slate-500">Personalization only · not an authentication claim</p>
            </div>
          </div>
          <CardIcon><PersonIcon /></CardIcon>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Display name</span>
              <Input value={settings.profile.displayName} maxLength={48} autoComplete="name" onChange={(event) => updateSettings({ profile: { ...settings.profile, displayName: event.target.value } })} placeholder="Display name" className="mt-2" />
            </label>
            <label>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Preferred currency</span>
              <Select value={settings.profile.preferredCurrency} onChange={(event) => updateSettings({ profile: { ...settings.profile, preferredCurrency: event.target.value as typeof settings.profile.preferredCurrency } })} className="mt-2">
                {["USD", "EUR", "GBP", "KRW"].map((value) => <option key={value} value={value}>{value}</option>)}
              </Select>
            </label>
          </div>
          <p className="mt-5 text-xs leading-5 text-slate-500">Profile fields stay in this browser. PowerChain never treats a profile name as wallet ownership; wallet identity still comes from the connected wallet and explicit signatures.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#557568]">Wallets</p>
            <CardTitle className="mt-1 text-lg">Connected identities</CardTitle>
            <p className="mt-1 text-xs text-slate-500">Current browser wallet state.</p>
          </div>
          <Link href={APP_ROUTES.settings} className="pc-theme-control inline-flex min-h-9 items-center gap-2 border border-slate-200 bg-white px-3 text-xs font-semibold text-[#294a3b] shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-white/[.04] dark:text-[#d0dcd6] dark:hover:bg-white/[.07]"><GearIcon />Settings</Link>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3">
            <WalletRow label="Solana" value={wallets.solanaAddress} />
            <WalletRow label="Sui" value={wallets.suiAddress} />
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
