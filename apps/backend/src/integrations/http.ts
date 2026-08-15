export async function fetchIntegrationJson<T>(url: string, init: RequestInit = {}, timeoutMs = 8_000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1_000, Math.min(20_000, timeoutMs)));
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, cache: "no-store", headers: { accept: "application/json", ...init.headers } });
    if (!response.ok) throw new Error(`INTEGRATION_HTTP_${response.status}`);
    return await response.json() as T;
  } finally { clearTimeout(timer); }
}

export function configuredUrl(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name}_REQUIRED`);
  return value.replace(/\/+$/, "");
}
