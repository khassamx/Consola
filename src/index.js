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

const showMenu = (sock) => {
    console.log(`\n
----------------------------------------
|       🤖 MENÚ DE CONSOLA 🤖        |
----------------------------------------
| 1. Ver estado del Bot              |
| 2. Ver lista de tickets            |
| 3. Cerrar un ticket por ID         |
| 4. Cambiar modo del Bot            |
| 5. Enviar mensaje a un JID         |
| 6. Salir                           |
----------------------------------------
`);
    rl.question('Selecciona una opción: ', (input) => handleConsoleInput(input, sock));
};

const handleConsoleInput = async (input, sock) => {
    if (!sock) {
        log(sock, '❌ El bot no está conectado. Esperando conexión...');
        showMenu(sock);
        return;
    }

    switch (input.trim()) {
        case '1':
            const uptime = process.uptime();
            const uptimeDays = Math.floor(uptime / (3600 * 24));
            const uptimeHours = Math.floor((uptime % (3600 * 24)) / 3600);
            const uptimeMinutes = Math.floor((uptime % 3600) / 60);
            const uptimeSeconds = Math.floor(uptime % 60);
            const freeMem = (os.freemem() / 1204 / 1024).toFixed(2);
            const totalMem = (os.totalmem() / 1204 / 1024).toFixed(2);
            log(sock, `
✅ Estado del Bot:
  - En línea: Sí
  - Tiempo de actividad: ${uptimeDays}d, ${uptimeHours}h, ${uptimeMinutes}m, ${uptimeSeconds}s
  - Memoria: ${freeMem} MB / ${totalMem} MB
  - Versión: ${botVersion}
  - Modo: ${botMode.charAt(0).toUpperCase() + botMode.slice(1)}
            `);
            break;
        case '2':
            log(sock, '\n🎟️ Tickets Abiertos:');
            const openTickets = Object.values(tickets).filter(t => t.status === 'open');
            if (openTickets.length > 0) {
                openTickets.forEach(t => {
                    log(sock, `  - ID: ${t.id}, Nombre: ${t.name}`);
                });
            } else {
                log(sock, '  - No hay tickets abiertos.');
            }
            break;
        case '3':
            rl.question('Ingresa el ID del ticket a cerrar: ', (id) => {
                const ticketId = parseInt(id, 10);
                const ticketToClose = Object.entries(tickets).find(([jid, ticket]) => ticket.id === ticketId);
                if (ticketToClose) {
                    const [jid, ticket] = ticketToClose;
                    ticket.status = 'closed';
                    log(sock, `✅ Ticket ${ticketId} cerrado.`);
                    sock.sendMessage(jid, { text: 'Su ticket ha sido cerrado. Si necesita ayuda adicional, por favor, abra uno nuevo.' });
                } else {
                    log(sock, `❌ No se encontró ningún ticket con el ID ${id}.`);
                }
                showMenu(sock);
            });
            return;
        case '4':
            rl.question('Ingresa el nuevo modo (activo, silencioso, fiesta): ', async (mode) => {
                if (['activo', 'silencioso', 'fiesta'].includes(mode)) {
                    botMode = mode;
                    log(sock, `✅ Modo del bot cambiado a: *${mode.charAt(0).toUpperCase() + mode.slice(1)}*.`);
                } else {
                    await sock.sendMessage(senderJid, { text: '❌ Modo incorrecto. Modos disponibles: `activo`, `silencioso`, `fiesta`.' });
                }
                showMenu(sock);
            });
            return;
        case '5':
            rl.question('Ingresa el JID (ej: 595984495031@s.whatsapp.net) y el mensaje (separados por un espacio): ', async (line) => {
                const [targetJid, ...msgParts] = line.split(' ');
                const msgBody = msgParts.join(' ');
                if (targetJid && msgBody) {
                    try {
                        await sock.sendMessage(targetJid, { text: msgBody });
                        log(sock, `Mensaje enviado a ${targetJid} desde la consola.`);
                    } catch (e) {
                        logError(sock, `Error al enviar mensaje desde la consola: ${e.message}`);
                    }
                } else {
                    log(sock, '❌ Uso incorrecto. Formato: JID mensaje');
                }
                showMenu(sock);
            });
            return;
        case '6':
            log(sock, 'Saliendo de la consola interactiva.');
            rl.close();
            return;
        default:
            log(sock, '❌ Opción no válida. Por favor, selecciona una opción del 1 al 6.');
            break;
    }
    showMenu(sock);
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function typeWriterEffect(text, delay = 50) {
    let currentLine = "";
    for (let i = 0; i < text.length; i++) {
        currentLine += text[i];
        process.stdout.write('\r' + currentLine);
        await sleep(delay);
    }
    console.log();
}

const cinematicBannerLines = [
    " ██████╗ ██████╗ ███╗   ██╗███████╗███╗   ██╗███████╗",
    "██╔════╝██╔═══██╗████╗  ██║██╔════╝████╗  ██║██╔════╝",
    "██║     ██║   ██║██╔██╗ ██║█████╗  ██╔██╗ ██║█████╗  ",
    "██║     ██║   ██║██║╚██╗██║██╔══╝  ██║╚██╗██║██╔══╝  ",
    "╚██████╗╚██████╔╝██║ ╚████║███████╗██║ ╚████║███████╗",
    " ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═══╝╚══════╝",
    "                   🌌 CONSOLE MODE 🌌                "
];

function printColorLine(line, color) {
    const green = '\x1b[32m';
    const cyan = '\x1b[36m';
    const reset = '\x1b[0m';
    let coloredLine = line
        .replace(/██/g, `${green}██${reset}`)
        .replace(/╔/g, `${cyan}╔${reset}`)
        .replace(/═/g, `${cyan}═${reset}`)
        .replace(/╗/g, `${cyan}╗${reset}`)
        .replace(/╚/g, `${cyan}╚${reset}`)
        .replace(/╝/g, `${cyan}╝${reset}`)
        .replace(/║/g, `${cyan}║${reset}`)
        .replace(/🌌/g, `${cyan}🌌${reset}`);
    console.log(coloredLine);
}

async function loadingAnimation(message, totalSteps = 50, delayPerStep = 100) {
    const rainbowColors = [
        '\x1b[31m', // Red
        '\x1b[33m', // Yellow
        '\x1b[32m', // Green
        '\x1b[36m', // Cyan
        '\x1b[34m', // Blue
        '\x1b[35m', // Magenta
    ];
    const reset = '\x1b[0m';
    let progressBar = "[          ]";

    for (let i = 0; i <= totalSteps; i++) {
        let filled = '█'.repeat(Math.floor(i / (totalSteps / 10)));
        let empty = ' '.repeat(10 - Math.floor(i / (totalSteps / 10)));
        let color = rainbowColors[i % rainbowColors.length];
        let currentProgress = `${color}[${filled}${empty}]${reset}`;
        process.stdout.write(`\r${message} ${currentProgress}`);
        await sleep(delayPerStep);
    }
    console.log();
}

let sock = null;
let qrCodeData = null;

async function connectToWhatsApp(skipQr) {
    const sessionPath = './session';
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        auth: state,
        browser: Browsers.macOS("Desktop"),
        logger: pino({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on("connection.update", async (update) => {
        const { connection, qr, lastDisconnect } = update;

        if (qr && !skipQr) {
            qrCodeData = qr;
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            log(null, `Conexión cerrada. Razón: ${statusCode}`);
            if (statusCode !== DisconnectReason.loggedOut) {
                log(null, 'Reconectando...');
                await connectToWhatsApp(skipQr);
            } else {
                log(null, 'Sesión cerrada. Por favor, elimina la carpeta session e inicia de nuevo.');
            }
        } else if (connection === "open") {
            log(null, "✅ Bot conectado a WhatsApp");
            if (sock.user && sock.user.id && isCreator(sock.user.id)) {
                const creatorJid = sock.user.id;
                
                await showCinematicIntro();

                await sendFuturisticMenu(sock, creatorJid);
            } else {
                log(null, "Bot conectado, esperando escaneo del creador o reconexión.");
            }
        }
    });

    cron.schedule('0 8 * * *', async () => {
        const groupJid = 'TU_JID_DE_GRUPO@g.us';
        const message = '¡Buenos días! Este es un recordatorio diario. ¡Que tengas un gran día!';
        try {
            await sock.sendMessage(groupJid, { text: message });
            log(null, `Mensaje diario enviado a [${groupJid}]`);
        } catch (e) {
            logError(null, `Error al enviar mensaje programado: ${e.message}`);
        }
    });

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
        if (type === "notify" && sock) {
            const m = messages[0];

            if (m.message?.protocolMessage?.type === 'REVOKE') {
                const deletedMsgKey = m.message.protocolMessage.key;
                const senderJid = deletedMsgKey.remoteJid;
                const participantJid = deletedMsgKey.participant || senderJid;
                const senderName = m.pushName || participantJid.split('@')[0];
                log(sock, `🗑️ ALERTA: Mensaje eliminado por ${senderName} en [${senderJid}].`);
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
                    await sock.sendMessage(senderJid, { text: `
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
                        await sock.groupParticipantsUpdate(senderJid, [senderParticipant], 'remove');
                        await sock.sendMessage(senderJid, { delete: m.key });
                        await sock.sendMessage(senderJid, { text: `⚠️ Usuario expulsado. El prefijo de su número (*+${countryCode}*) no está permitido.` });
                        log(sock, `🚫 Filtro de Prefijos: Usuario con código de país '${countryCode}' expulsado y su mensaje eliminado de [${senderJid}].`);
                        return;
                    }
                }

                const linkRegex = /(https?:\/\/|www\.)[^\s]+/gi;
                if (isAntiLinkEnabled && isGroup && messageText.match(linkRegex)) {
                    try {
                        const groupMetadata = await sock.groupMetadata(senderJid);
                        const senderIsAdmin = groupMetadata.participants.find(p => p.id === senderParticipant)?.admin !== null;

                        if (!senderIsAdmin) {
                            await sock.sendMessage(senderJid, { delete: m.key });
                            await sock.groupParticipantsUpdate(senderJid, [senderParticipant], 'remove');
                            await sock.sendMessage(senderJid, { text: `❌ Enlace detectado. El usuario ha sido expulsado por enviar un link.` });
                            log(sock, `🚫 Anti-Link: Mensaje con enlace de ${senderName} eliminado en [${senderJid}]. Usuario expulsado.`);
                        } else {
                            log(sock, `ℹ️ Anti-Link: Enlace ignorado, el remitente es un administrador.`);
                        }
                    } catch (e) {
                        logError(sock, `Error en Anti-Link: ${e.message}`);
                    }
                    return;
                }

                if (isWordFilterEnabled) {
                    for (const word of OFFENSIVE_WORDS) {
                        if (messageText.toLowerCase().includes(word.toLowerCase())) {
                            await sock.sendMessage(senderJid, { text: `⚠️ Por favor, mantén un lenguaje respetuoso. El uso de palabras ofensivas no está permitido.` });
                            log(sock, `😠 Alerta: Palabra ofensiva detectada de ${senderName} en [${senderJid}]`);
                            return;
                        }
                    }
                }
                
                if (isCreator(senderJid)) {
                    const text = messageText.trim();
                    if (text === '~menu') {
                        await sendFuturisticMenu(sock, senderJid);
                        return;
                    } else if (['0','1','2','3','4'].includes(text)) {
                        await sendFuturisticSection(sock, senderJid, text);
                        return;
                    }
                }

                if (messageText.toLowerCase().trim() === '!menu' || messageText.toLowerCase().trim() === '!help') {
                    await sendUserMenu(sock, senderJid);
                    return;
                }

                const isCreatorCommand = await handleCreatorCommands(sock, m, messageText);
                if (isCreatorCommand) {
                    return;
                }

                await handleGeneralCommands(sock, m, messageText);

                if (messageText.toLowerCase().trim() === '!abrir' && !isGroup) {
                    if (tickets[senderJid] && tickets[senderJid].status === 'open') {
                        await sock.sendMessage(senderJid, { text: "Este ticket ya está abierto." });
                    } else {
                        ticketCounter = (ticketCounter % 900) + 1;
                        tickets[senderJid] = { id: ticketCounter, status: 'open', name: senderName };
                        await sock.sendMessage(senderJid, { text: `Ticket abierto. ID: ${tickets[senderJid].id}` });
                        log(sock, `🎟️ Ticket: Se abrió un ticket para [${senderJid}]`);
                    }
                } else if (messageText.toLowerCase().trim() === '!cerrar' && tickets[senderJid] && tickets[senderJid].status === 'open' && !isGroup) {
                    tickets[senderJid].status = 'closed';
                    await sock.sendMessage(senderJid, { text: "Su ticket ha sido cerrado. ¡Gracias por usar nuestro servicio!" });
                    log(sock, `🎟️ Ticket: Se cerró un ticket para [${senderJid}]`);
                } else if (messageText.toLowerCase().trim() === '!cerrar' && !tickets[senderJid] && !isGroup) {
                    await sock.sendMessage(senderJid, { text: "No tienes un ticket abierto para cerrar." });
                }
            }
        }
    });
}

async function showCinematicIntro() {
    for (let line of cinematicBannerLines) {
        printColorLine(line);
        await typeWriterEffect(line, 5);
        await sleep(30);
    }
    
    await sleep(500);
    await typeWriterEffect("\nIniciando sistema central...", 60);

    await loadingAnimation("Cargando módulos esenciales", 10, 150);
    await sleep(500);
    await loadingAnimation("Estableciendo protocolos de seguridad", 10, 150);
    await sleep(500);
    await loadingAnimation("Sincronizando base de datos", 10, 150);
    await sleep(500);

    await typeWriterEffect("✅ Sistema listo. Acceso al Dashboard del Creador activado.", 60);
    await sleep(1000);
}

// Nueva función principal que controla el flujo de inicio
async function main() {
    console.clear();
    const sessionExists = fs.existsSync('./session/creds.json');
    
    if (sessionExists) {
        log(null, '✅ Sesión encontrada. Iniciando conexión automáticamente...');
        await connectToWhatsApp(true);
    } else {
        log(null, 'ℹ️ No se encontró sesión. Se requiere escanear el código QR.');
        await connectToWhatsApp(false);

        // Esperar a que el QR se genere y preguntar al usuario
        const intervalId = setInterval(() => {
            if (qrCodeData) {
                clearInterval(intervalId);
                rl.question(`\n${'\x1b[32m'}¿Deseas empezar? (Y/n):${'\x1b[0m'} `, async (answer) => {
                    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
                        log(null, '📌 Escaneando código QR...');
                        qrcode.generate(qrCodeData, { small: true });
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