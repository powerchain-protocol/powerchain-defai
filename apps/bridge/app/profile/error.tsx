"use client";
import { RouteErrorPanel } from "@/components/routing/route-error-panel";
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) { return <RouteErrorPanel eyebrow="Account" title="Profile unavailable" description="This browser-local profile surface could not be loaded. Your wallet remains in control and no transaction was submitted." error={error} reset={reset} />; }
