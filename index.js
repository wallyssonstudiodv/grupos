const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const axios = require('axios');
const P = require('pino');

let sock = null;

async function startSock() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth');
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        logger: P({ level: 'silent' }),
        version,
        printQRInTerminal: true,
        auth: state
    });

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

            // Envia resposta de texto
            if (data?.texto) {
                await sock.sendMessage(from, { text: data.texto });
            }

            // Envia mídia, se existir
            if (data?.midia) {
                const url = data.midia;
                const mimeType = data.tipo || 'image/jpeg';
                const caption = data.caption || '';

                const mediaBuffer = await axios.get(url, { responseType: 'arraybuffer' });

                const mediaType =
                    mimeType.startsWith('image') ? 'image' :
                    mimeType.startsWith('video') ? 'video' :
                    mimeType.startsWith('audio') ? 'audio' :
                    'document';

                await sock.sendMessage(from, {
                    [mediaType]: mediaBuffer.data,
                    mimetype: mimeType,
                    caption: caption
                });
            }

        } catch (err) {
            console.error('Erro ao processar mensagem:', err);
        }
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

            console.log('Desconectado. Código:', statusCode);
            if (shouldReconnect) {
                console.log('Tentando reconectar...');
                await startSock();
            } else {
                console.log('Logout detectado. Reconexão cancelada.');
            }
        } else if (connection === 'open') {
            console.log('✅ Conectado ao WhatsApp com sucesso!');
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

startSock();