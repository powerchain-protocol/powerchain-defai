"use client";

import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";
import Link from "next/link";

type Props = { children: ReactNode; name?: string };
type State = { failed: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State { return { failed: true }; }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV !== "production") console.error(`[${this.props.name ?? "PowerChain"}]`, error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section className="pc-panel rounded-[22px] p-5" role="alert">
        <p className="text-sm font-semibold text-slate-950 dark:text-white">This section could not load</p>
        <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">No wallet action or transaction finality is inferred from this error.</p>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => this.setState({ failed: false })} className="pc-button-primary min-h-10 rounded-xl px-4 text-xs font-semibold">Retry</button>
          <Link href="/history" className="pc-button-light inline-flex min-h-10 items-center rounded-xl px-4 text-xs font-semibold">History</Link>
        </div>
      </section>
    );
  }
}
