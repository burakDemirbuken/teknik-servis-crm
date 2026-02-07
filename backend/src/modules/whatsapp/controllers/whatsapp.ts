import whatsapp from './WhatsAppService.js';
import validator from 'validator';

import z from 'zod';

export const connect = async (req: any, res: any) => {
	try {
		await whatsapp.connect();
		res.status(200).json({ message: 'WhatsApp Client is connecting' });
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
};

export const disconnect = (req: any, res: any) => {
	try {
		whatsapp.disconnect();
		res.status(200).json({ message: 'WhatsApp Client disconnected' });
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
};

export const getStatus = (req: any, res: any) => {
	try {
		const status = whatsapp.getStatus();
		res.status(200).json(status);
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
};

const sendMessageSchema = z.object({
	to: z.string().refine((value) => validator.isMobilePhone(value, 'tr-TR'), "Invalid phone number" ),
	message: z.string().min(1, "Message cannot be empty")
});

export const sendMessage = async (req: any, res: any) => {
	try
	{
		// Check WhatsApp connection first
		const status = whatsapp.getStatus();
		if (!status.isReady) {
			return res.status(503).json({ error: 'WhatsApp bağlı değil. Önce Ayarlar sayfasından WhatsApp bağlantısını kurun.' });
		}

		const validateData = sendMessageSchema.parse(req.body);
		await whatsapp.sendMessage(validateData.to, validateData.message);
		res.status(200).json({ message: 'Message sent successfully' });
	}
	catch (error)
	{
		if (error instanceof z.ZodError)
		{
			const errors = error.issues.map((err) => err.message);
			return res.status(400).json({ errors });
		}
		const msg = (error as Error).message;
		if (msg.includes('not ready') || msg.includes('not connected')) {
			return res.status(503).json({ error: 'WhatsApp bağlantısı koptu. Lütfen tekrar bağlanın.' });
		}
		res.status(500).json({ error: 'Mesaj gönderilemedi: ' + msg });
	}
};