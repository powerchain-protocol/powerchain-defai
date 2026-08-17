"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { DEFAULT_USER_SETTINGS, EMPTY_SESSION_SECRETS } from "@/lib/settings/defaults";
import { SETTINGS_STORAGE_KEY, clearSessionSecrets, clearStoredSettings, readSessionSecrets, readStoredSettings, sanitizeSessionSecrets, sanitizeSettings, writeSessionSecrets, writeStoredSettings } from "@/lib/settings/storage";
import type { PowerChainUserSettings, UserSessionSecrets } from "@/types/user-settings";

type SettingsPatch = Partial<Omit<PowerChainUserSettings, "version">>;
type ContextValue = Readonly<{
  settings: PowerChainUserSettings;
  secrets: UserSessionSecrets;
  hydrated: boolean;
  updateSettings: (patch: SettingsPatch) => void;
  replaceSettings: (settings: PowerChainUserSettings) => void;
  updateSecrets: (patch: Partial<UserSessionSecrets>) => void;
  resetSettings: () => void;
  clearSecrets: () => void;
}>;

const Context = createContext<ContextValue | null>(null);

function mergeSettings(current: PowerChainUserSettings, patch: SettingsPatch): PowerChainUserSettings {
  return sanitizeSettings({
    ...current,
    ...patch,
    profile: { ...current.profile, ...(patch.profile ?? {}) },
    connectivity: { ...current.connectivity, ...(patch.connectivity ?? {}) },
    jupiter: { ...current.jupiter, ...(patch.jupiter ?? {}) },
    swap: { ...current.swap, ...(patch.swap ?? {}) },
    bridge: { ...current.bridge, ...(patch.bridge ?? {}) },
    operations: { ...current.operations, ...(patch.operations ?? {}) },
  });
}

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PowerChainUserSettings>(DEFAULT_USER_SETTINGS);
  const [secrets, setSecrets] = useState<UserSessionSecrets>(EMPTY_SESSION_SECRETS);
  const [hydrated, setHydrated] = useState(false);
  const settingsRef = useRef<PowerChainUserSettings>(DEFAULT_USER_SETTINGS);
  const secretsRef = useRef<UserSessionSecrets>(EMPTY_SESSION_SECRETS);

  useEffect(() => {
    const storedSettings = readStoredSettings();
    const storedSecrets = readSessionSecrets();
    settingsRef.current = storedSettings;
    secretsRef.current = storedSecrets;
    setSettings(storedSettings);
    setSecrets(storedSecrets);
    setHydrated(true);
  }, []);

  useEffect(() => {
    const syncSettings = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage || event.key !== SETTINGS_STORAGE_KEY) return;
      try {
        const current = settingsRef.current;
        const next = event.newValue ? sanitizeSettings(JSON.parse(event.newValue)) : DEFAULT_USER_SETTINGS;
        const externalPowerChainEndpointChanged = next.connectivity.apiBaseUrl !== current.connectivity.apiBaseUrl;
        const externalJupiterEndpointChanged = next.jupiter.apiBaseUrl !== current.jupiter.apiBaseUrl;
        if (externalPowerChainEndpointChanged || externalJupiterEndpointChanged) {
          const nextSecrets = sanitizeSessionSecrets({
            ...secretsRef.current,
            ...(externalPowerChainEndpointChanged ? { powerChainApiKey: "" } : {}),
            ...(externalJupiterEndpointChanged ? { jupiterApiKey: "" } : {}),
          });
          secretsRef.current = nextSecrets;
          writeSessionSecrets(nextSecrets);
          setSecrets(nextSecrets);
        }
        settingsRef.current = next;
        setSettings(next);
      } catch { /* ignore malformed external writes */ }
    };
    window.addEventListener("storage", syncSettings);
    return () => window.removeEventListener("storage", syncSettings);
  }, []);

  const persistSecrets = useCallback((next: UserSessionSecrets) => {
    const normalized = sanitizeSessionSecrets(next);
    secretsRef.current = normalized;
    writeSessionSecrets(normalized);
    setSecrets(normalized);
  }, []);
  const updateSettings = useCallback((patch: SettingsPatch) => {
    const current = settingsRef.current;
    const next = mergeSettings(current, patch);
    const powerChainEndpointChanged = next.connectivity.apiBaseUrl !== current.connectivity.apiBaseUrl;
    const jupiterEndpointChanged = next.jupiter.apiBaseUrl !== current.jupiter.apiBaseUrl;
    if (powerChainEndpointChanged || jupiterEndpointChanged) {
      persistSecrets({
        ...secretsRef.current,
        ...(powerChainEndpointChanged ? { powerChainApiKey: "" } : {}),
        ...(jupiterEndpointChanged ? { jupiterApiKey: "" } : {}),
      });
    }
    settingsRef.current = next;
    writeStoredSettings(next);
    setSettings(next);
  }, [persistSecrets]);
  const replaceSettings = useCallback((next: PowerChainUserSettings) => {
    const normalized = sanitizeSettings(next);
    settingsRef.current = normalized;
    writeStoredSettings(normalized);
    clearSessionSecrets();
    secretsRef.current = EMPTY_SESSION_SECRETS;
    setSecrets(EMPTY_SESSION_SECRETS);
    setSettings(normalized);
  }, []);
  const updateSecrets = useCallback((patch: Partial<UserSessionSecrets>) => {
    persistSecrets({ ...secretsRef.current, ...patch });
  }, [persistSecrets]);
  const resetSettings = useCallback(() => {
    clearStoredSettings();
    clearSessionSecrets();
    settingsRef.current = DEFAULT_USER_SETTINGS;
    secretsRef.current = EMPTY_SESSION_SECRETS;
    setSecrets(EMPTY_SESSION_SECRETS);
    setSettings(DEFAULT_USER_SETTINGS);
  }, []);
  const clearSecrets = useCallback(() => {
    clearSessionSecrets();
    secretsRef.current = EMPTY_SESSION_SECRETS;
    setSecrets(EMPTY_SESSION_SECRETS);
  }, []);
  const value = useMemo(() => ({ settings, secrets, hydrated, updateSettings, replaceSettings, updateSecrets, resetSettings, clearSecrets }), [settings, secrets, hydrated, updateSettings, replaceSettings, updateSecrets, resetSettings, clearSecrets]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useUserSettings() {
  const value = useContext(Context);
  if (!value) throw new Error("USER_SETTINGS_PROVIDER_REQUIRED");
  return value;
}
