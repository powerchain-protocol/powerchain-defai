export function ScreenReaderStatus({ children, assertive = false }: { children: React.ReactNode; assertive?: boolean }) {
  return <span className="sr-only" role="status" aria-live={assertive ? "assertive" : "polite"} aria-atomic="true">{children}</span>;
}
