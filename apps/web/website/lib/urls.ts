const strip = (value: string) => value.replace(/\/+$/, "");
export const appBaseUrl = strip(process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000");
export const appUrl = (path = "") => `${appBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
