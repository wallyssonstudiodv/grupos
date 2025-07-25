const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const fs = require('fs')
const path = require('path')

async function iniciarBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth')
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    auth: state,
    version,
    printQRInTerminal: true,
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update
    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode
      if (reason !== 401) iniciarBot()
    }
  })

  sock.ev.on('chats.set', async ({ chats }) => {
    const grupos = chats.filter(chat => chat.id.endsWith('@g.us'))

    console.log(`\n📋 Lista de Grupos:`)
    grupos.forEach((grupo, i) => {
      console.log(`${i + 1}. Nome: ${grupo.name || 'Desconhecido'} | ID: ${grupo.id}`)
    })

    // Salvar em arquivo
    const dados = grupos.map(g => `${g.name || 'Desconhecido'} - ${g.id}`).join('\n')
    fs.writeFileSync(path.join(__dirname, 'grupos.txt'), dados)
    console.log(`\n✅ IDs dos grupos salvos em grupos.txt`)
  })
}

iniciarBot()