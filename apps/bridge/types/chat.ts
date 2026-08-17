export type { DefaiCapability, DefaiChatContext, DefaiChatRequest, DefaiChatResponse } from "@powerchain/chat/types/chat";

export const CHAT_MESSAGE_MAX_LENGTH = 2_000;
export type ChatAttachmentKind = "image" | "link";
export type ChatAttachment = Readonly<{ kind: ChatAttachmentKind; url: string; label?: string }>;
export type ChatComposerState = Readonly<{ message: string; attachments: readonly ChatAttachment[] }>;
