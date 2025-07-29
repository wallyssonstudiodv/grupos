const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const axios = require('axios');
const P = require('pino');

let sock = null; // socket global para evitar múltiplas instâncias

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
        if (type !== 'notify' || !messages[0]?.message) return;

        const msg = messages[0];
        const from = msg.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        const sender = isGroup ? msg.key.participant : from;
        const messageContent = msg.message.conversation || msg.message.extendedTextMessage?.text;

        if (!messageContent) return;

        try {
            const { data } = await axios.post('https://meudrivenet.x10.bz/botzap1/webhook.php', {
                comando: messageContent,
                de: sender,
                grupo: from,
                isGroup: isGroup
            });

            if (data && data.texto) {
                await sock.sendMessage(from, { text: data.texto });

                if (data.midia && data.midia !== '') {
                    const url = data.midia;
                    const mediaBuffer = await axios.get(url, { responseType: 'arraybuffer' });
                    const mimeType = data.tipo || 'image/jpeg';

                    await sock.sendMessage(from, {
                        [mimeType.startsWith('image') ? 'image' :
                         mimeType.startsWith('video') ? 'video' :
                         mimeType.startsWith('audio') ? 'audio' : 'document']: mediaBuffer.data,
                        mimetype: mimeType,
                        caption: data.caption || ''
                    });
                }
            }
        } catch (err) {
            console.error('Erro ao comunicar com webhook:', err);
        }
    });

    sock.ev.on('connection.update', async (update) => {
        console.log('Connection update:', JSON.stringify(update, null, 2));

        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

            console.log('StatusCode:', statusCode);
            console.log('Should reconnect:', shouldReconnect);

            if (shouldReconnect) {
                console.log('Reconectando...');
                await startSock();
            } else {
                console.log('Desconectado permanentemente (logout)');
            }
        } else if (connection === 'open') {
            console.log('Conectado ao WhatsApp');
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

startSock();