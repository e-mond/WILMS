export interface MessageDto {
  id: string;
  threadId: string;
  senderUserId: string;
  senderDisplayName: string;
  body: string;
  sentAt: string;
}

export interface MessageThreadSummary {
  id: string;
  adminUserId: string;
  adminDisplayName: string;
  collectorUserId: string;
  collectorDisplayName: string;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageThreadDetail extends MessageThreadSummary {
  messages: MessageDto[];
}

export interface CreateMessageThreadInput {
  collectorId: string;
  adminId?: string;
}

export interface SendMessageInput {
  threadId: string;
  body: string;
}
