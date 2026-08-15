export type WalletActivityItem = {
  chain?: string;
  id?: string;
  signature?: string;
  digest?: string;
  kind?: string;
  status?: string | null;
  timestamp?: number | null;
  label?: string;
  description?: string;
  type?: string;
  explorerUrl?: string | null;
  url?: string | null;
};

export type WalletHistoryItem = WalletActivityItem;

export type WalletHistory = {
  source?: string;
  transactions?: WalletHistoryItem[];
};

export type WalletBalance = { balance?: string };

export type WalletChainOverview = {
  balance?: WalletBalance;
  history?: WalletHistory;
};

export type WalletOverviewResponse = {
  status?: string;
  message?: string;
  solana?: WalletChainOverview;
  sui?: WalletChainOverview;
  activity?: WalletActivityItem[];
};

export type WalletPortfolioResponse = {
  status?: string;
  message?: string;
  [key: string]: unknown;
};

export type WalletActivityPage = {
  status?: string;
  message?: string;
  activity?: WalletActivityItem[];
  pagination?: { nextCursor?: string | null };
};

export type PwrcTransfer = {
  signature: string;
  explorerUrl?: string | null;
  direction?: string;
  amountBaseUnits?: string;
  [key: string]: unknown;
};

export type PwrcTransfersResponse = {
  message?: string;
  fallbackReason?: string | null;
  transfers?: PwrcTransfer[];
};
