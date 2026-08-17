"use client";

import Link from "next/link";
import { Cross2Icon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";

const NOTICE_KEY = "powerchain-web-cookie-notice";

export function CookiesNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(window.localStorage.getItem(NOTICE_KEY) !== "acknowledged");
  }, []);

  function acknowledge() {
    window.localStorage.setItem(NOTICE_KEY, "acknowledged");
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `powerchain_cookie_notice=acknowledged; Max-Age=31536000; Path=/; SameSite=Lax${secure}`;
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <aside className="web-cookie-card" aria-label="Cookie and local storage notice">
      <div className="min-w-0">
        <p className="web-eyebrow">Privacy controls</p>
        <p className="mt-1 text-sm font-semibold text-brand-950 dark:text-brand-100">Essential browser storage only.</p>
        <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">
          PowerChain uses essential browser storage for theme and wallet preferences. This notice does not enable advertising or analytics cookies.
        </p>
        <Link href="/legal/cookies" className="mt-2 inline-flex text-xs font-bold text-brand-700 hover:text-brand-900 dark:text-brand-200 dark:hover:text-white">
          Cookie policy
        </Link>
      </div>
      <button type="button" onClick={acknowledge} className="web-icon-button shrink-0" aria-label="Acknowledge cookie notice">
        <Cross2Icon />
      </button>
    </aside>
  );
}
