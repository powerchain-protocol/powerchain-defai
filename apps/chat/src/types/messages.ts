export type DefaiMessageRole = "user" | "assistant" | "system";
export type DefaiMessageStatus = "ready" | "streaming" | "error";

export interface DefaiMessage {
  id: string;
  role: DefaiMessageRole;
  content: string;
  createdAt: string;
  status?: DefaiMessageStatus;
}
