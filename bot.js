const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const qrcode = require('qrcode');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const cron = require('node-cron');

class WhatsAppBot {
    constructor() {
        this.sock = null;
        this.qrString = null;
        this.isConnected = false;
        this.serverUrl = 'https://meudrive.x10.mx/ads';
        this.scheduledJobs = new Map();
        this.groups = [];
        
        this.initBot();
        this.startScheduleChecker();
    }

    async initBot() {
        const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
        
        this.sock = makeWASocket({
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            auth: state,
            generateHighQualityLinkPreview: true,
        });

        this.sock.ev.on('creds.update', saveCreds);
        this.sock.ev.on('connection.update', this.handleConnection.bind(this));
        this.sock.ev.on('messages.upsert', this.handleMessage.bind(this));
    }

    async handleConnection(update) {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            this.qrString = qr;
            await this.generateQRImage();
            await this.sendQRToServer();
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            
            console.log('Conexão fechada devido a ', lastDisconnect?.error, ', reconectando ', shouldReconnect);
            
            if (shouldReconnect) {
                this.initBot();
            }
            
            this.isConnected = false;
            await this.updateConnectionStatus(false);
        } else if (connection === 'open') {
            console.log('Bot conectado com sucesso!');
            this.isConnected = true;
            await this.loadGroups();
            await this.updateConnectionStatus(true);
            await this.notifyServerConnection();
        }
    }

    async generateQRImage() {
        try {
            const qrImage = await qrcode.toDataURL(this.qrString);
            fs.writeFileSync('./qr-code.png', qrImage.split(',')[1], 'base64');
            console.log('QR Code gerado: qr-code.png');
        } catch (error) {
            console.error('Erro ao gerar QR:', error);
        }
    }

    async sendQRToServer() {
        try {
            const qrImage = await qrcode.toDataURL(this.qrString);
            
            await axios.post(`${this.serverUrl}/api.php`, {
                action: 'update_qr',
                qr_code: qrImage
            });
            
            console.log('QR Code enviado para o servidor');
        } catch (error) {
            console.error('Erro ao enviar QR para servidor:', error);
        }
    }

    async updateConnectionStatus(status) {
        try {
            await axios.post(`${this.serverUrl}/api.php`, {
                action: 'update_connection',
                connected: status
            });
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
        }
    }

    async notifyServerConnection() {
        try {
            await axios.post(`${this.serverUrl}/api.php`, {
                action: 'bot_connected'
            });
        } catch (error) {
            console.error('Erro ao notificar conexão:', error);
        }
    }

    async loadGroups() {
        try {
            const groups = await this.sock.groupFetchAllParticipating();
            this.groups = Object.values(groups).map(group => ({
                id: group.id,
                name: group.subject,
                participants: group.participants.length
            }));

            // Enviar grupos para o servidor
            await axios.post(`${this.serverUrl}/api.php`, {
                action: 'update_groups',
                groups: this.groups
            });

            console.log(`${this.groups.length} grupos carregados`);
        } catch (error) {
            console.error('Erro ao carregar grupos:', error);
        }
    }

    async handleMessage(m) {
        try {
            const message = m.messages[0];
            if (!message.message) return;
            
            // Log da mensagem recebida (apenas para debug)
            console.log('Mensagem recebida:', message.key.remoteJid);
        } catch (error) {
            console.error('Erro ao processar mensagem:', error);
        }
    }

    startScheduleChecker() {
        // Verifica agendamentos a cada minuto
        cron.schedule('* * * * *', async () => {
            await this.checkScheduledAds();
        });
    }

    async checkScheduledAds() {
        if (!this.isConnected) return;

        try {
            const response = await axios.get(`${this.serverUrl}/api.php?action=get_scheduled_ads`);
            const scheduledAds = response.data;

            for (const ad of scheduledAds) {
                if (this.shouldSendNow(ad.schedule_time)) {
                    await this.sendScheduledAd(ad);
                }
            }
        } catch (error) {
            console.error('Erro ao verificar anúncios agendados:', error);
        }
    }

    shouldSendNow(scheduleTime) {
        const now = new Date();
        const [hour, minute] = scheduleTime.split(':');
        
        return now.getHours() === parseInt(hour) && now.getMinutes() === parseInt(minute);
    }

    async sendScheduledAd(ad) {
        try {
            const selectedGroups = JSON.parse(ad.selected_groups);
            
            for (const groupId of selectedGroups) {
                await this.sendAdToGroup(groupId, ad);
                
                // Aguarda 2 segundos entre envios para evitar spam
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            // Marcar como enviado
            await axios.post(`${this.serverUrl}/api.php`, {
                action: 'mark_ad_sent',
                ad_id: ad.id
            });

            console.log(`Anúncio ${ad.id} enviado com sucesso`);
        } catch (error) {
            console.error('Erro ao enviar anúncio agendado:', error);
        }
    }

    async sendAdToGroup(groupId, ad) {
        try {
            if (ad.media_type === 'image' && ad.media_path) {
                const mediaBuffer = fs.readFileSync(`${this.serverUrl}/uploads/${ad.media_path}`);
                
                await this.sock.sendMessage(groupId, {
                    image: mediaBuffer,
                    caption: ad.text_content
                });
            } else if (ad.media_type === 'video' && ad.media_path) {
                const mediaBuffer = fs.readFileSync(`${this.serverUrl}/uploads/${ad.media_path}`);
                
                await this.sock.sendMessage(groupId, {
                    video: mediaBuffer,
                    caption: ad.text_content
                });
            } else {
                // Apenas texto
                await this.sock.sendMessage(groupId, {
                    text: ad.text_content
                });
            }
        } catch (error) {
            console.error(`Erro ao enviar para grupo ${groupId}:`, error);
        }
    }

    // API para receber comandos do servidor
    async handleServerCommand(command) {
        switch (command.action) {
            case 'send_test':
                await this.sendTestMessage(command.groupId, command.message);
                break;
            case 'get_groups':
                return this.groups;
            case 'reconnect':
                await this.initBot();
                break;
        }
    }

    async sendTestMessage(groupId, message) {
        try {
            await this.sock.sendMessage(groupId, { text: message });
            return { success: true };
        } catch (error) {
            console.error('Erro ao enviar mensagem teste:', error);
            return { success: false, error: error.message };
        }
    }
}

// Inicializar o bot
const bot = new WhatsAppBot();

// Servidor HTTP simples para receber comandos
const http = require('http');
const url = require('url');

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    
    if (req.method === 'GET' && parsedUrl.pathname === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            connected: bot.isConnected,
            groups: bot.groups.length
        }));
    } else if (req.method === 'POST' && parsedUrl.pathname === '/command') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', async () => {
            try {
                const command = JSON.parse(body);
                const result = await bot.handleServerCommand(command);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, data: result }));
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log('Bot WhatsApp iniciado!');
});

process.on('uncaughtException', (error) => {
    console.error('Erro não capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Rejeição não tratada em:', promise, 'razão:', reason);
});