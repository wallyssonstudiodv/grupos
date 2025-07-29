const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const axios = require('axios');
const P = require('pino');
const qrcode = require('qrcode-terminal'); // 📦 Importa QR Code terminal

let sock = null;

async function startSock() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth');
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        logger: P({ level: 'silent' }),
        version,
        auth: state
    });

    // Exibe QR code visual
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.clear();
            console.log('📱 Escaneie o QR Code abaixo com o WhatsApp:\n');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

            console.log('🔌 Desconectado. Código:', statusCode);
            if (shouldReconnect) {
                console.log('🔁 Tentando reconectar...');
                await startSock();
            } else {
                console.log('🚪 Logout detectado. Reconexão cancelada.');
            }
        } else if (connection === 'open') {
            console.log('✅ Conectado ao WhatsApp com sucesso!');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify' || !messages[0]) return;

        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        const sender = isGroup ? msg.key.participant : from;

        const messageContent = msg.message.conversation
            || msg.message.extendedTextMessage?.text
            || msg.message.imageMessage?.caption
            || msg.message.videoMessage?.caption;

        if (!messageContent) return;

        try {
            const { data } = await axios.post('https://meudrivenet.x10.bz/botzap1/webhook.php', {
                comando: messageContent,
                de: sender,
                grupo: from,
                isGroup: isGroup
            });

            if (data?.texto) {
                await sock.sendMessage(from, { text: data.texto });
            }

            if (data?.midia) {
                const url = data.midia;
                const mimeType = data.tipo || 'application/octet-stream';
                const caption = data.caption || '';

                try {
                    const response = await axios.get(url, { responseType: 'arraybuffer' });
                    const buffer = Buffer.from(response.data, 'binary');

                    const mediaType =
                        mimeType.startsWith('image') ? 'image' :
                        mimeType.startsWith('video') ? 'video' :
                        mimeType.startsWith('audio') ? 'audio' : 'document';

                    const messageData = {
                        [mediaType]: buffer,
                        mimetype: mimeType
                    };

                    if (caption && mediaType !== 'audio') {
                        messageData.caption = caption;
                    }

                    if (mediaType === 'document') {
                        messageData.fileName = url.split('/').pop() || 'arquivo';
                    }

                    await sock.sendMessage(from, messageData);
                } catch (err) {
                    console.error('❌ Erro ao baixar ou enviar mídia:', err.message);
                }
            }

        } catch (err) {
            console.error('❌ Erro ao processar mensagem:', err.message);
        }
    });
}

startSock();