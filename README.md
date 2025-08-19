# 🤖 Bot WhatsApp - Sistema de Divulgação Automática

## 🎯 Desenvolvido por Wallysson Studio Dv © 2025

### 📋 Descrição do Projeto

Sistema completo de automação para WhatsApp que permite criar e gerenciar campanhas publicitárias com envio programado para grupos selecionados. O sistema é composto por um bot rodando no Termux (Android) e um painel web responsivo para gerenciamento.

---

## 🏗️ Arquitetura do Sistema

### 📱 **Bot (Termux)**
- **bot.js** - Aplicação Node.js principal
- **Baileys 6.6.0** - Biblioteca para WhatsApp Web
- **Servidor HTTP** - API local na porta 3000
- **Cron Jobs** - Agendamento automático

### 🌐 **Painel Web (Hospedagem)**
- **index.php** - Interface principal
- **login.php** - Sistema de autenticação
- **token.php** - Gerador de tokens (Admin)
- **api.php** - Backend para comunicação
- **Sistema responsivo** - Design mobile-first

---

## 🚀 Instalação e Configuração

### 📱 **No Termux (Android)**

1. **Instalação automática:**
```bash
# Baixar e executar o script de instalação
curl -O https://raw.githubusercontent.com/seu-repo/install.sh
chmod +x install.sh
./install.sh
```

2. **Instalação manual:**
```bash
# Atualizar pacotes
pkg update && pkg upgrade -y

# Instalar dependências
pkg install nodejs npm git python -y

# Criar diretório do projeto
mkdir ~/whatsapp-bot && cd ~/whatsapp-bot

# Instalar dependências Node.js
npm install @whiskeysockets/baileys@6.6.0
npm install @hapi/boom pino qrcode axios form-data node-cron
```

### 🌐 **Na Hospedagem Web**

1. **Upload dos arquivos PHP:**
   - `index.php` - Painel principal
   - `login.php` - Página de login
   - `token.php` - Gerador de tokens
   - `api.php` - API backend
   - `logout.php` - Logout
   - `.htaccess` - Configurações

2. **Configurar permissões:**
   - Pasta `uploads/` - 755
   - Arquivos PHP - 644
   - Arquivos JSON - 644

---

## 🎮 Como Usar

### 🔐 **1. Gerar Token de Acesso**
```
https://meudrive.x10.mx/ads/token.php
```
- Acesso exclusivo do administrador
- Tokens com validade de 7, 15 ou 30 dias
- Cada token só pode ser usado uma vez

### 📱 **2. Conectar o Bot**
```bash
cd ~/whatsapp-bot
./start.sh
```
- Bot gera QR Code automaticamente
- QR Code aparece no painel web
- Escanear com WhatsApp para conectar

### 🎯 **3. Gerenciar Campanhas**
1. **Login no painel:** `https://meudrive.x10.mx/ads/`
2. **Criar anúncios** com texto, imagem ou vídeo
3. **Ativar anúncios** para envio automático
4. **Selecionar grupos** de destino
5. **Definir horário** de envio

---

## ⚙️ Funcionalidades Detalhadas

### 📝 **Criação de Anúncios**
- ✅ Título personalizado
- ✅ Texto do anúncio (suporte a quebras de linha)
- ✅ Upload de imagens (JPG, PNG, GIF)
- ✅ Upload de vídeos (MP4, AVI, MOV)
- ✅ Preview em tempo real

### 📊 **Gerenciamento**
- ✅ **Anúncios Salvos** - Criados mas inativos
- ✅ **Anúncios Ativos** - Habilitados para envio
- ✅ **Edição completa** - Modificar texto e mídia
- ✅ **Ativação/Desativação** em um clique
- ✅ **Exclusão segura** com confirmação

### 👥 **Seleção de Grupos**
- ✅ Carregamento automático dos grupos
- ✅ Exibição de nome e número de participantes
- ✅ Seleção múltipla com checkboxes
- ✅ Atualização em tempo real

### ⏰ **Agendamento**
- ✅ Seleção de hora e minuto
- ✅ Envio diário no horário programado
- ✅ Verificação a cada minuto
- ✅ Delay de 2s entre grupos (anti-spam)

### 🔒 **Sistema de Segurança**
- ✅ **Tokens únicos** - Uso único com expiração
- ✅ **Sessões seguras** - Controle de acesso
- ✅ **Validação de uploads** - Tipos de arquivo permitidos
- ✅ **Logs de atividade** - Rastreamento completo

---

## 📱 Design Responsivo

### 🎨 **Tema Noturno Transparente**
- Fundo gradiente com efeitos visuais
- Cores principais: Azul (#3b82f6) e Vermelho (#ef4444)
- Transparências e blur effects
- Animações suaves

### 📱 **Adaptação Mobile**
- Layout flexível para todas as telas
- Botões otimizados para toque
- Formulários responsivos
- Navegação intuitiva

### ✨ **Efeitos Visuais**
- Gradientes animados
- Partículas flutuantes
- Hover effects
- Transições suaves
- Loading states

---

## 🔧 Scripts de Controle

### 📜 **Comandos Disponíveis**

```bash
# Iniciar o bot
./start.sh

# Parar o bot
./stop.sh

# Reiniciar o bot
./restart.sh

# Instalar serviço automático
./install-service.sh

# Executar diretamente
node bot.js
```

### 📊 **Monitoramento**
```bash
# Ver logs em tempo real
tail -f logs/bot.log

# Status da conexão
curl http://localhost:3000/status

# Verificar processos
ps aux | grep "node bot.js"
```

---

## 🛠️ Configurações Avançadas

### ⚙️ **config.json**
```json
{
  "serverUrl": "https://meudrive.x10.mx/ads",
  "botPort": 3000,
  "scheduleCheckInterval": "* * * * *",
  "qrCodeTimeout": 20000,
  "messageDelay": 2000,
  "logLevel": "info"
}
```

### 🔐 **Variáveis de Ambiente**
```bash
# URL do servidor
export SERVER_URL="https://meudrive.x10.mx/ads"

# Porta do bot
export BOT_PORT=3000

# Timeout do QR Code (ms)
export QR_TIMEOUT=20000
```

---

## 📚 API Endpoints

### 🔗 **Bot ↔ Servidor**
```bash
# Enviar QR Code
POST /api.php
{"action": "update_qr", "qr_code": "data:image/png;base64,..."}

# Atualizar status da conexão
POST /api.php
{"action": "update_connection", "connected": true}

# Atualizar lista de grupos
POST /api.php
{"action": "update_groups", "groups": [...]}

# Buscar anúncios agendados
GET /api.php?action=get_scheduled_ads
```

### 🎯 **Painel ↔ API**
```bash
# Verificar status
GET /api.php?action=check_status

# Obter estatísticas
GET /api.php?action=get_statistics

# Validar token
POST /api.php
{"action": "validate_token", "token": "abc123..."}
```

---

## 🚨 Solução de Problemas

### ❌ **Bot não conecta**
1. Verificar conexão com internet
2. Reiniciar o bot: `./restart.sh`
3. Limpar cache: `rm -rf auth_info_baileys/`
4. Gerar novo QR Code

### ❌ **QR Code não aparece**
1. Verificar logs: `tail -f logs/bot.log`
2. Testar conexão com servidor
3. Verificar permissões de escrita
4. Reiniciar serviços

### ❌ **Anúncios não enviam**
1. Verificar se o bot está conectado
2. Confirmar grupos selecionados
3. Verificar horário programado
4. Checar logs de erro

### ❌ **Upload não funciona**
1. Verificar permissões da pasta uploads/
2. Confirmar tipos de arquivo permitidos
3. Verificar limite de upload (50MB)
4. Checar espaço em disco

---

## 📈 Logs e Monitoramento

### 📊 **Tipos de Log**
- **Conexão** - Status do WhatsApp
- **Grupos** - Carregamento e atualização
- **Anúncios** - Criação, edição e envio
- **Erros** - Falhas e exceções
- **API** - Requisições e respostas

### 📈 **Métricas Disponíveis**
- Total de anúncios criados
- Anúncios ativos
- Grupos conectados
- Taxa de sucesso de envio
- Tempo de atividade do bot

---

## 🔒 Segurança e Privacidade

### 🛡️ **Proteções Implementadas**
- ✅ Tokens únicos com expiração
- ✅ Validação de tipos de arquivo
- ✅ Sanitização de dados de entrada
- ✅ Controle de sessão
- ✅ Logs de auditoria
- ✅ Headers de segurança
- ✅ Rate limiting básico

### 🔐 **Dados Protegidos**
- Credenciais do WhatsApp
- Tokens de acesso
- Informações dos grupos
- Conteúdo dos anúncios
- Logs de atividade

---

## ⚠️ Termos de Uso

### 📋 **Responsabilidades**
- Respeitar os termos do WhatsApp
- Não enviar spam ou conteúdo ofensivo
- Usar apenas em grupos próprios ou autorizados
- Manter o sistema atualizado
- Fazer backup regular dos dados

### ⚖️ **Limitações**
- Não garantimos 100% de uptime
- O WhatsApp pode bloquear contas por uso inadequado
- Limites de envio do próprio WhatsApp
- Dependência de conexão com internet

---

## 🎊 Créditos e Suporte

### 🏆 **Desenvolvido por Wallysson Studio Dv**
- **Ano:** 2025
- **Tecnologias:** Node.js, PHP, HTML5, CSS3, JavaScript
- **Bibliotecas:** Baileys 6.6.0, QRCode, Axios, Cron
- **Design:** Responsive, Dark Theme, Modern UI

### 📞 **Suporte Técnico**
- **Email:** contato@wallyssonstudio.com
- **WhatsApp:** +55 (xx) xxxxx-xxxx
- **Website:** www.wallyssonstudio.com
- **GitHub:** github.com/wallyssonstudio

### 💝 **Agradecimentos**
- Comunidade Baileys
- Desenvolvedores Node.js
- Usuários beta testers
- Comunidade open source

---

## 📄 Licença

Este projeto é propriedade de **Wallysson Studio Dv** © 2025. Todos os direitos reservados.

### ⚖️ **Uso Permitido:**
- ✅ Uso pessoal e comercial
- ✅ Modificações para uso próprio
- ✅ Distribuição com créditos

### ❌ **Uso Não Permitido:**
- ❌ Revenda sem autorização
- ❌ Remoção de créditos
- ❌ Uso para atividades ilegais
- ❌ Distribuição sem licença

---

## 🔄 Atualizações e Versioning

### 📋 **Versão Atual: 1.0.0**

#### ✨ **Novidades da v1.0.0:**
- Sistema completo de anúncios
- Interface web responsiva
- Autenticação por tokens
- Agendamento automático
- Upload de mídias
- Tema dark moderno

#### 🔮 **Próximas Versões:**
- v1.1.0 - Sistema de relatórios
- v1.2.0 - API externa
- v1.3.0 - Multi-usuário
- v2.0.0 - Interface mobile app

---

**🎯 Obrigado por usar o Bot WhatsApp da Wallysson Studio Dv!**

*Se este projeto te ajudou, considere dar uma ⭐ e compartilhar com outros desenvolvedores!*