"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useActionLock } from "../../hooks/use-action-lock";

export type ActionStateButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> & {
  children: ReactNode;
  pendingLabel?: string;
  onAction: () => Promise<void>;
};

export function ActionStateButton({ children, pendingLabel = "Working…", onAction, disabled, className = "", ...props }: ActionStateButtonProps) {
  const { locked, run } = useActionLock();
  return (
    <button
      {...props}
      type="button"
      disabled={disabled || locked}
      aria-busy={locked}
      onClick={() => { void run(onAction); }}
      className={`min-h-11 rounded-xl px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {locked ? pendingLabel : children}
    </button>
  );
}
