"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type CookieConsent = "all" | "essential";

const COOKIE_NAME = "pc_cookie_consent";
const STORAGE_KEY = "powerchain.defai.cookie-consent.v1";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 180;
const EVENT_NAME = "powerchain:cookie-consent";

function readCookie(): CookieConsent | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`));
  const value = match?.slice(COOKIE_NAME.length + 1);
  return value === "all" || value === "essential" ? value : null;
}

function readStored(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === "all" || value === "essential" ? value : null;
}

function persist(value: CookieConsent): void {
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_NAME}=${value}; Max-Age=${MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
  window.localStorage.setItem(STORAGE_KEY, value);
}

export function useCookies() {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const sync = useCallback(() => {
    const next = readCookie() ?? readStored();
    if (next) persist(next);
    setConsent(next);
    setHydrated(true);
  }, []);

  useEffect(() => {
    sync();
    const onConsent = () => sync();
    window.addEventListener(EVENT_NAME, onConsent);
    window.addEventListener("storage", onConsent);
    return () => {
      window.removeEventListener(EVENT_NAME, onConsent);
      window.removeEventListener("storage", onConsent);
    };
  }, [sync]);

  const choose = useCallback((value: CookieConsent) => {
    persist(value);
    setConsent(value);
    window.dispatchEvent(new Event(EVENT_NAME));
  }, []);

  const reset = useCallback(() => {
    document.cookie = `${COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
    window.localStorage.removeItem(STORAGE_KEY);
    setConsent(null);
    window.dispatchEvent(new Event(EVENT_NAME));
  }, []);

  return useMemo(() => ({ consent, hydrated, choose, reset, showBanner: hydrated && consent === null }), [choose, consent, hydrated, reset]);
}

export function requestCookieChoices(): void {
  if (typeof window === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(EVENT_NAME));
}
