export type Chat = {
  id: string;
  memberIds: string[];
  updatedAt: number;
};

export type ChatMessage = {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: number;
};
