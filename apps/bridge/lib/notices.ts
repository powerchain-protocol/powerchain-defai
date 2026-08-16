import type { ToastTone } from "./toast";

export type ProductNotice = {
  id: string;
  tone: ToastTone;
  title: string;
  description: string;
};

export const NOTICES = {
  walletRejected: { id: "wallet-rejected", tone: "warning", title: "Wallet request cancelled", description: "No transaction was submitted." },
  quoteExpired: { id: "quote-expired", tone: "warning", title: "Quote expired", description: "Refresh the quote before opening your wallet." },
  offline: { id: "offline", tone: "warning", title: "You are offline", description: "Live chain data and transaction submission are unavailable until connectivity returns." },
  submittedNotFinal: { id: "submitted-not-final", tone: "info", title: "Transaction submitted", description: "Submission is not finality. Verify execution and reconciliation before treating the operation as complete." },
} satisfies Record<string, ProductNotice>;
