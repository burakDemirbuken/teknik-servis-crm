import qrcode from 'qrcode-terminal';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;

class WhatsAppService {
	private client: InstanceType<typeof Client> | null = null;
	private qrCode: string | null = null;
	private isReady: boolean = false;
	private isInitializing: boolean = false;

	constructor()
	{

	}

	private eventListeners()
	{
		if (!this.client) return;

		this.client.on('qr', (qr: string) => {
			qrcode.generate(qr, { small: true });
			this.qrCode = qr;
		});

		this.client.on('ready', () => {
			this.isReady = true;
			this.qrCode = null;
			this.isInitializing = false;
			console.log('WhatsApp Client is ready!');
		});

		this.client.on('authenticated', () => {
			console.log('WhatsApp Client is authenticated!');
		});

		this.client.on('auth_failure', (msg: string) => {
			console.error('Authentication failure:', msg);
			throw new Error('WhatsApp authentication failed');
		});

		this.client.on('disconnected', (reason: string) => {
			this.isReady = false;
			this.qrCode = null;
			this.client = null;
			console.log('WhatsApp Client was disconnected:', reason);
		});
	}

	private formatPhoneNumber(phone: string): string
	{
        let cleaned = phone.replace(/\D/g, '');

        if (cleaned.startsWith('05') && cleaned.length === 11)
            cleaned = '9' + cleaned;
        
        else if (cleaned.startsWith('5') && cleaned.length === 10)
            cleaned = '90' + cleaned;

		if (cleaned.length < 10 || cleaned.length > 12)
			throw new Error('Invalid phone number format');

        return `${cleaned}@c.us`;
    }
	
	public connect()
	{
		if (this.client && this.isReady)
			return;

		this.isInitializing = true;

		try
		{
			this.client = new Client({
				authStrategy: new LocalAuth({ dataPath: './whatsapp-auth-data',}),
				puppeteer: {
					headless: true,
					args: [
						'--no-sandbox',
						'--disable-setuid-sandbox',
						'--disable-gpu',
						'--disable-dev-shm-usage',
					]
				}
			});
			this.eventListeners();
			this.client.initialize();

		}
		catch (error)
		{
			console.error('Error initializing WhatsApp Client:', error);
			this.isInitializing = false;
			throw error;
		}
	}

	public disconnect()
	{
		if (this.client)
		{
			this.client.destroy();
			this.client = null;
			this.isReady = false;
			this.qrCode = null;
			this.isInitializing = false;
		}
	}

	public getStatus()
	{
		return {
			isReady: this.isReady,
			isInitializing: this.isInitializing,
			qrCode: this.qrCode
		}
	}

	public getQRCode(): string | null
	{
		return this.qrCode;
	}

	public async sendMessage(to: string, message: string)
	{
		if (!this.client || !this.isReady)
			throw new Error('WhatsApp Client is not ready');
		try
		{
			const chatId = this.formatPhoneNumber(to);
			await this.client.sendMessage(chatId, message);
		}
		catch (error)
		{
			console.error('Error sending WhatsApp message:', error);
			throw error;			
		}
	}
}

let instance: WhatsAppService = new WhatsAppService();

export default instance;