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
  };
  supportProfileId?: string;
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
