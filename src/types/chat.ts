export type ChatRole = "user" | "admin";
export type MediaType = "image" | "video";

export interface MediaAttachment {
  id: string;
  url: string;
  type: MediaType;
  name: string;
}

export interface ChatMessage {
  id: string;
  trackingId: string;
  sender: ChatRole;
  senderName?: string;
  senderAvatarUrl?: string;
  text?: string;
  media?: MediaAttachment[];
  createdAt: number;
  animateTyping?: boolean;
  typingSpeedMs?: number;
  replyToMessageId?: string;
  replyTo?: {
    id: string;
    sender: ChatRole;
    senderName?: string;
    text?: string;
    media?: MediaAttachment[];
    supportProfileId?: string;
    /** Admin view only: the quoted support message was deleted (content withheld). */
    deleted?: boolean;
  };
  supportProfileId?: string;
  /** Set when a support message was deleted by admin. Customers never receive these. */
  deletedAt?: number;
}

export interface ChatThreadSummary {
  id: string;
  trackingId: string;
  participantRole?: 'sender' | 'receiver';
  lastMessageAt?: number;
  lastMessagePreview?: string | null;
  unreadForAdmin: number;
  unreadForUser: number;
}
