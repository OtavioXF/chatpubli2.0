export type ChatMessage = {
  id: string;
  visibleName: string;
  content: string | null;
  createdAt: string;
  isDeleted: boolean;
  messageType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' | 'MIXED';
  attachments: Array<{
    id: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    url: string;
    thumbnailUrl: string | null;
  }>;
};

export type RoomSummary = {
  id: string;
  name: string;
  slug: string;
  type: 'PUBLIC' | 'GROUP';
  createdAt: string;
};
