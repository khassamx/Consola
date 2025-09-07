const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys');
const readline = require('readline');
const pino = require('pino');
const cron = require('node-cron');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const os = require('os');

const { CREATOR_JID, OFFENSIVE_WORDS, isAntiLinkEnabled, isWordFilterEnabled, isWelcomeMessageEnabled, isAntiSpamEnabled, ANTI_SPAM_THRESHOLD, botMode, botVersion, isAntiPrefixEnabled, arabicPrefixes, isRemoteConsoleEnabled, remoteConsoleJid, COMMAND_STATUS } = require('./config');
const { log, logError } = require('./utils/logger');
const { loadSentRecords, addSentUser } = require('./utils/persistence');
const { sendWelcomeMessageWithPersistence } = require('./utils/welcomeMessage');
const { handleGeneralCommands } = require('./handlers/generalCommands');
const { handleCreatorCommands } = require('./handlers/creatorCommands');
const { sendFuturisticMenu, sendFuturisticSection, isCreator } = require('./handlers/futuristicMenu');
const { sendUserMenu } = require('./handlers/userMenu');

const width = 70;
const height = 20;

// Halcón frames para animación
const halconFrames = [
  `  __🦅__ `,
  ` <(🦅 )> `,
  `  ~~🦅~~ `,
  ` <( 🦅)> `
];

const welcomeFrames = [
  "🌟 BIENVENIDO A MICHIBOT 🌟",
  "✨ QUE EMPIECE LA AVENTURA ✨",
  "      CREADO POR NOADEVSTUDIO      "
];

// Colores ANSI para el efecto arcoíris, sin la librería 'chalk'
const ansiColors = [
    "\x1b[31m", // Rojo
    "\x1b[33m", // Amarillo
    "\x1b[32m", // Verde
    "\x1b[36m", // Cian
    "\x1b[34m", // Azul
    "\x1b[35m", // Magenta
];
const resetColor = "\x1b[0m";

function rainbowText(text) {
    return text.split('').map((c, i) => ansiColors[i % ansiColors.length] + c).join('') + resetColor;
}

let pos = 0;
let frameIndex = 0;
let verticalPos = 8;
let direction = 1;
let cycle = 0;
let qrCodeData = null;
let botIsReady = false;
let conn = null;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const tickets = {}
let ticketCounter = 0
let currentMode = 'menu'
let activeJid = null

if (!fs.existsSync('./logs')) {
    fs.mkdirSync('./logs')
}
if (!fs.existsSync('./session')) {
    fs.mkdirSync('./session')
}

// Simulación de nubes y estrellas
let cloudLayer1 = Array.from({ length: width }, () => Math.random() < 0.12 ? '☁️' : ' ');
let cloudLayer2 = Array.from({ length: width }, () => Math.random() < 0.08 ? '☁️' : ' ');
let starsLayer = Array.from({ length: width }, () => Math.random() < 0.05 ? '✨' : ' ');

function drawFrame() {
  console.clear();

  const welcomeMessage = welcomeFrames[Math.floor(cycle / 2) % welcomeFrames.length];
  console.log(rainbowText(welcomeMessage.padEnd(width/2 + welcomeMessage.length/2, ' ').padStart(width, ' ')) + "\n");

  cloudLayer1.unshift(cloudLayer1.pop());
  cloudLayer2.unshift(cloudLayer2.pop());
  starsLayer.unshift(starsLayer.pop());

  for (let i = 0; i < height; i++) {
    let line = Array(width).fill(' ');

    if (i === Math.floor(height / 4)) {
      line = cloudLayer1.slice();
    } else if (i === Math.floor(height / 2)) {
      line = cloudLayer2.slice();
    } else if (i === Math.floor(height / 1.5)) {
      line = starsLayer.slice();
    }
    
    if (i === verticalPos) {
      const halcon = halconFrames[frameIndex];
      for (let j = 0; j < halcon.length; j++) {
        if (pos + j >= 0 && pos + j < width) {
          line[pos + j] = halcon[j];
        }
      }
    }
    console.log(line.join(''));
  }

  console.log('_'.repeat(width));

  console.log("\n".repeat(2));
  if (qrCodeData) {
      console.log(rainbowText("📌 Escanea este QR con tu WhatsApp:"));
      qrcode.generate(qrCodeData, { small: true });
  } else if (botIsReady) {
      console.log(rainbowText("✅ Bot listo. Esperando nuevos mensajes..."));
  } else {
      console.log(rainbowText("⏳ Esperando el código QR..."));
  }

  pos++;
  if (pos > width - halconFrames[0].length) pos = 0;
  frameIndex = (frameIndex + 1) % halconFrames.length;
  verticalPos += direction;
  if (verticalPos >= height - 5 || verticalPos <= 2) direction *= -1;
  cycle++;
}

const animationInterval = setInterval(drawFrame, 120);

// Lógica de Baileys
async function connectToWhatsApp(skipQr = false) {
    const sessionPath = './session';
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    conn = makeWASocket({
        version,
        auth: state,
        browser: Browsers.macOS("Desktop"),
        logger: pino({ level: 'silent' })
    });
    global.sock = conn;

    conn.ev.on('creds.update', saveCreds);

    conn.ev.on("connection.update", (update) => {
        const { connection, qr, lastDisconnect } = update;

        if (qr && !skipQr) {
            qrCodeData = qr;
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            log(conn, `Conexión cerrada. Razón: ${statusCode}`);
            if (statusCode !== DisconnectReason.loggedOut) {
                log(conn, 'Reconectando...');
                connectToWhatsApp(skipQr);
            } else {
                log(conn, 'Sesión cerrada. Por favor, elimina la carpeta session e inicia de nuevo.');
                qrCodeData = null;
                botIsReady = false;
            }
        } else if (connection === "open") {
            log(conn, "✅ Bot conectado a WhatsApp");
            qrCodeData = null;
            botIsReady = true;
        }
    });

    conn.ev.on("messages.upsert", async ({ messages, type }) => {
        if (type === "notify" && conn) {
            const m = messages[0];
            if (m.message?.protocolMessage?.type === 'REVOKE') {
                const deletedMsgKey = m.message.protocolMessage.key;
                const senderJid = deletedMsgKey.remoteJid;
                const participantJid = deletedMsgKey.participant || senderJid;
                const senderName = m.pushName || participantJid.split('@')[0];
                log(conn, `🗑️ ALERTA: Mensaje eliminado por ${senderName} en [${senderJid}].`);
                return;
            }
            if (!m.key.fromMe) {
                const senderJid = m.key.remoteJid;
                const isGroup = senderJid.endsWith('@g.us');
                const messageText = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
                const senderParticipant = m.key.participant || m.key.remoteJid;
                const senderName = m.pushName || senderParticipant.split('@')[0];
                
                if (isCreator(senderJid) && !isGroup && messageText.trim() === '~consola-status') {
                     const uptime = process.uptime();
                     const uptimeDays = Math.floor(uptime / (3600 * 24));
                     const uptimeHours = Math.floor((uptime % (3600 * 24)) / 3600);
                     const uptimeMinutes = Math.floor((uptime % 3600) / 60);
                     const uptimeSeconds = Math.floor(uptime % 60);
                     const freeMem = (os.freemem() / 1024 / 1024).toFixed(2);
                     const totalMem = (os.totalmem() / 1024 / 1024).toFixed(2);
                     await conn.sendMessage(senderJid, { text: `
*✅ Estado del Bot (Consola Remota)*
  - En línea: Sí
  - Tiempo de actividad: ${uptimeDays}d, ${uptimeHours}h, ${uptimeMinutes}m, ${uptimeSeconds}s
  - Memoria: ${freeMem} MB / ${totalMem} MB
  - Versión: ${botVersion}
  - Modo: ${botMode.charAt(0).toUpperCase() + botMode.slice(1)}
                     `});
                     return;
                }
                
                if (isAntiPrefixEnabled && isGroup) {
                    const countryCode = senderParticipant.split('@')[0].substring(0, 3);
                    if (arabicPrefixes.includes(countryCode)) {
                        await conn.groupParticipantsUpdate(senderJid, [senderParticipant], 'remove');
                        await conn.sendMessage(senderJid, { delete: m.key });
                        await conn.sendMessage(senderJid, { text: `⚠️ Usuario expulsado. El prefijo de su número (*+${countryCode}*) no está permitido.` });
                        log(conn, `🚫 Filtro de Prefijos: Usuario con código de país '${countryCode}' expulsado y su mensaje eliminado de [${senderJid}].`);
                        return;
                    }
                }

                const linkRegex = /(https?:\/\/|www\.)[^\s]+/gi;
                if (isAntiLinkEnabled && isGroup && messageText.match(linkRegex)) {
                    try {
                        const groupMetadata = await conn.groupMetadata(senderJid);
                        const senderIsAdmin = groupMetadata.participants.find(p => p.id === senderParticipant)?.admin !== null;

                        if (!senderIsAdmin) {
                            await conn.sendMessage(senderJid, { delete: m.key });
                            await conn.groupParticipantsUpdate(senderJid, [senderParticipant], 'remove');
                            await conn.sendMessage(senderJid, { text: `❌ Enlace detectado. El usuario ha sido expulsado por enviar un link.` });
                            log(conn, `🚫 Anti-Link: Mensaje con enlace de ${senderName} eliminado en [${senderJid}]. Usuario expulsado.`);
                        } else {
                            log(conn, `ℹ️ Anti-Link: Enlace ignorado, el remitente es un administrador.`);
                        }
                    } catch (e) {
                        logError(conn, `Error en Anti-Link: ${e.message}`);
                    }
                    return;
                }

                if (isWordFilterEnabled) {
                    for (const word of OFFENSIVE_WORDS) {
                        if (messageText.toLowerCase().includes(word.toLowerCase())) {
                            await conn.sendMessage(senderJid, { text: `⚠️ Por favor, mantén un lenguaje respetuoso. El uso de palabras ofensivas no está permitido.` });
                            log(conn, `😠 Alerta: Palabra ofensiva detectada de ${senderName} en [${senderJid}]`);
                            return;
                        }
                    }
                }
                
                if (isCreator(senderJid)) {
                    const text = messageText.trim();
                    if (text === '~menu') {
                        await sendFuturisticMenu(conn, senderJid);
                        return;
                    } else if (['0','1','2','3','4'].includes(text)) {
                        await sendFuturisticSection(conn, senderJid, text);
                        return;
                    }
                }

                if (messageText.toLowerCase().trim() === '!menu' || messageText.toLowerCase().trim() === '!help') {
                    await sendUserMenu(conn, senderJid);
                    return;
                }

                const isCreatorCommand = await handleCreatorCommands(conn, m, messageText);
                if (isCreatorCommand) {
                    return;
                }

                await handleGeneralCommands(conn, m, messageText);

                if (messageText.toLowerCase().trim() === '!abrir' && !isGroup) {
                    if (tickets[senderJid] && tickets[senderJid].status === 'open') {
                        await conn.sendMessage(senderJid, { text: "Este ticket ya está abierto." });
                    } else {
                        ticketCounter = (ticketCounter % 900) + 1;
                        tickets[senderJid] = { id: ticketCounter, status: 'open', name: senderName };
                        await conn.sendMessage(senderJid, { text: `Ticket abierto. ID: ${tickets[senderJid].id}` });
                        log(conn, `🎟️ Ticket: Se abrió un ticket para [${senderJid}]`);
                    }
                } else if (messageText.toLowerCase().trim() === '!cerrar' && tickets[senderJid] && tickets[senderJid].status === 'open' && !isGroup) {
                    tickets[senderJid].status = 'closed';
                    await conn.sendMessage(senderJid, { text: "Su ticket ha sido cerrado. ¡Gracias por usar nuestro servicio!" });
                    log(conn, `🎟️ Ticket: Se cerró un ticket para [${senderJid}]`);
                } else if (messageText.toLowerCase().trim() === '!cerrar' && !tickets[senderJid] && !isGroup) {
                    await conn.sendMessage(senderJid, { text: "No tienes un ticket abierto para cerrar." });
                }
            }
        }
    });
}

async function main() {
    const sessionExists = fs.existsSync('./session/creds.json');
    
    if (sessionExists) {
        log(null, '✅ Sesión encontrada. Iniciando conexión automáticamente...');
        await connectToWhatsApp(true);
    } else {
        log(null, 'ℹ️ No se encontró sesión. Se requiere escanear el código QR.');
        await connectToWhatsApp(false);
        const checkQrInterval = setInterval(() => {
            if (qrCodeData) {
                clearInterval(checkQrInterval);
                rl.question(`\n${rainbowText('¿Deseas empezar? (Y/n):')} `, async (answer) => {
                    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
                        log(null, '📌 Escaneando código QR...');
                    } else {
                        log(null, 'Cerrando bot. ¡Hasta pronto!');
                        process.exit();
                    }
                });
            }
        }, 100);
    }
}

main();