import z from 'zod';

export const MessageSchema = z.object({
	senderName: z.string().min(1),
	senderEmail: z.string().email(),
	messageContent: z.string().min(1),
});

export type Message = z.infer<typeof MessageSchema>;
