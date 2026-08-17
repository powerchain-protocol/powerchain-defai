"use client";

import { useState } from "react";
import { NetworkIcon } from "@web3icons/react/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardIcon, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { solscanAccountUrl, solscanTransactionUrl, suiscanAccountUrl, suiscanTransactionUrl } from "@/lib/explorers/links";

type ExplorerChain = "SOLANA" | "SUI";
type ExplorerKind = "account" | "transaction";

function explorerHref(chain: ExplorerChain, kind: ExplorerKind, value: string): string | null {
  const clean = value.trim();
  if (!clean) return null;
  if (chain === "SOLANA") return kind === "account" ? solscanAccountUrl(clean) : solscanTransactionUrl(clean);
  return kind === "account" ? suiscanAccountUrl(clean) : suiscanTransactionUrl(clean);
}

export function ExplorerSearch() {
  const [chain, setChain] = useState<ExplorerChain>("SOLANA");
  const [kind, setKind] = useState<ExplorerKind>("transaction");
  const [value, setValue] = useState("");
  const href = explorerHref(chain, kind, value);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-slate-200/80 dark:border-white/8">
        <div className="flex min-w-0 items-start gap-3">
          <CardIcon><NetworkIcon network={chain === "SOLANA" ? "solana" : "sui"} size={22} variant="branded" /></CardIcon>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#557568]">Chain explorer</p>
            <CardTitle className="mt-1 text-xl">Inspect accounts and transactions</CardTitle>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">Open Solana or Sui explorer context without treating indexer visibility as bridge settlement evidence.</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-200" htmlFor="explorer-network">
            Network
            <Select id="explorer-network" value={chain} onChange={(event) => setChain(event.target.value as ExplorerChain)} className="mt-2">
              <option value="SOLANA">Solana</option>
              <option value="SUI">Sui</option>
            </Select>
          </label>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-200" htmlFor="explorer-resource">
            Resource
            <Select id="explorer-resource" value={kind} onChange={(event) => setKind(event.target.value as ExplorerKind)} className="mt-2">
              <option value="transaction">Transaction</option>
              <option value="account">Account</option>
            </Select>
          </label>
        </div>
        <label className="mt-4 block text-xs font-semibold text-slate-700 dark:text-slate-200" htmlFor="explorer-identifier">
          {kind === "transaction" ? "Signature / digest" : "Wallet / account address"}
          <Input
            id="explorer-identifier"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            maxLength={512}
            placeholder={chain === "SOLANA" ? "Solana signature or address" : "Sui digest or 0x address"}
            className="mt-2 min-h-12 font-mono"
          />
        </label>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {href ? (
            <a className="pc-button-primary pc-theme-control inline-flex min-h-11 items-center justify-center px-5 text-sm font-semibold" href={href} target="_blank" rel="noopener noreferrer">Open explorer ↗</a>
          ) : (
            <Button disabled>Enter an identifier</Button>
          )}
          <span className="text-xs text-slate-500">Read-only navigation · never transaction finality</span>
        </div>
      </CardContent>
    </Card>
  );
}
