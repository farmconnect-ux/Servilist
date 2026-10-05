import { z } from "zod";

export const SendMessageSchema = z.object({
  recipientId: z.string().uuid(),
  listingId: z.string().uuid().optional(),
  requestId: z.string().uuid().optional(),
  body: z.string().min(1, "Message cannot be empty").max(2000, "Message cannot exceed 2000 characters"),
  attachmentUrl: z.string().url().optional(),
  messageType: z.enum(["text", "offer", "quote", "system"]).default("text"),
}).refine((data) => data.listingId || data.requestId, {
  message: "Messages must reference an item (listing or request)",
});

export type SendMessageInput = z.infer<typeof SendMessageSchema>;
