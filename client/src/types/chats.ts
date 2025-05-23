export type ChatStatus = 'sending' | 'sent' | 'failed';

export interface Chat {
  id?: string;
  clientId?: string;
  docId: string;
  userId: string | null;
  content: string;
  isUserMessage: boolean;
  timestamp: string;
  status: ChatStatus;
}