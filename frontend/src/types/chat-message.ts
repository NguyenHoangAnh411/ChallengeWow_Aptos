export interface Sender {
  id: string;
  walletId: string;
  username: string;
  timestamp: Date;
  isSystem?: boolean;
}

export interface ChatMessage {
  sender: Sender;
  message: string;
}
