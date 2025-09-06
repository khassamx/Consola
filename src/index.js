const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys');
const readline = require('readline');
const pino = require('pino');
const cron = require('node-cron');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const os = require('os');

const { CREATOR_JID, OFFENSIVE_WORDS, isAntiLinkEnabled, isWordFilterEnabled, isWelcomeMessageEnabled, isAntiSpamEnabled, ANTI_SPAM_THRESHOLD, botMode, botVersion } = require('./config');
const { log, logError } = require('./utils/logger');
const { loadSentRecords, addSentUser } = require('./utils/persistence');
const { sendWelcomeMessageWithPersistence } = require('./utils/welcomeMessage');
const { handleGeneralCommands } = require('./handlers/generalCommands');
const { handleCreatorCommands } = require('./handlers/creatorCommands');
const { sendFuturisticMenu, sendFuturisticSection, isCreator } = require('./handlers/futuristicMenu');

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

const showMenu = () => {
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
    rl.question('Selecciona una opción: ', handleConsoleInput);
};

const handleConsoleInput = async (input) => {
    const sock = global.sock;
    if (!sock) {
        console.log('❌ El bot no está conectado. Esperando conexión...');
        showMenu();
        return;
    }

    switch (input.trim()) {
        case '1':
            const uptime = process.uptime();
            const uptimeDays = Math.floor(uptime / (3600 * 24));
            const uptimeHours = Math.floor((uptime % (3600 * 24)) / 3600);
            const uptimeMinutes = Math.floor((uptime % 3600) / 60);
            const uptimeSeconds = Math.floor(uptime % 60);
            const freeMem = (os.freemem() / 1024 / 1024).toFixed(2);
            const totalMem = (os.totalmem() / 1024 / 1024).toFixed(2);
            console.log(`
✅ Estado del Bot:
  - En línea: Sí
  - Tiempo de actividad: ${uptimeDays}d, ${uptimeHours}h, ${uptimeMinutes}m, ${uptimeSeconds}s
  - Memoria: ${freeMem} MB / ${totalMem} MB
  - Versión: ${botVersion}
  - Modo: ${botMode.charAt(0).toUpperCase() + botMode.slice(1)}
            `);
            break;
        case '2':
            console.log('\n🎟️ Tickets Abiertos:');
            const openTickets = Object.values(tickets).filter(t => t.status === 'open');
            if (openTickets.length > 0) {
                openTickets.forEach(t => {
                    console.log(`  - ID: ${t.id}, Nombre: ${t.name}`);
                });
            } else {
                console.log('  - No hay tickets abiertos.');
            }
            break;
        case '3':
            rl.question('Ingresa el ID del ticket a cerrar: ', (id) => {
                const ticketId = parseInt(id, 10);
                const ticketToClose = Object.entries(tickets).find(([jid, ticket]) => ticket.id === ticketId);
                if (ticketToClose) {
                    const [jid, ticket] = ticketToClose;
                    ticket.status = 'closed';
                    console.log(`✅ Ticket ${ticketId} cerrado.`);
                    sock.sendMessage(jid, { text: 'Su ticket ha sido cerrado. Si necesita ayuda adicional, por favor, abra uno nuevo.' });
                } else {
                    console.log(`❌ No se encontró ningún ticket con el ID ${id}.`);
                }
                showMenu();
            });
            return;
        case '4':
            rl.question('Ingresa el nuevo modo (activo, silencioso, fiesta): ', async (mode) => {
                if (['activo', 'silencioso', 'fiesta'].includes(mode)) {
                    botMode = mode;
                    console.log(`✅ Modo del bot cambiado a: *${mode.charAt(0).toUpperCase() + mode.slice(1)}*.`);
                } else {
                    console.log('❌ Modo incorrecto. Modos disponibles: `activo`, `silencioso`, `fiesta`.');
                }
                showMenu();
            });
            return;
        case '5':
            rl.question('Ingresa el JID (ej: 595984495031@s.whatsapp.net) y el mensaje (separados por un espacio): ', async (line) => {
                const [targetJid, ...msgParts] = line.split(' ');
                const msgBody = msgParts.join(' ');
                if (targetJid && msgBody) {
                    try {
                        await sock.sendMessage(targetJid, { text: msgBody });
                        log(`Mensaje enviado a ${targetJid} desde la consola.`);
                    } catch (e) {
                        logError(`Error al enviar mensaje desde la consola: ${e.message}`);
                    }
                } else {
                    console.log('❌ Uso incorrecto. Formato: JID mensaje');
                }
                showMenu();
            });
            return;
        case '6':
            console.log('Saliendo de la consola interactiva.');
            rl.close();
            return;
        default:
            console.log('❌ Opción no válida. Por favor, selecciona una opción del 1 al 6.');
            break;
    }
    showMenu();
};

// Función de retraso para efectos de animación
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Efecto de escritura de máquina de escribir
async function typeWriterEffect(sock, jid, text, delay = 50) {
    let currentLine = "";
    for (let i = 0; i < text.length; i++) {
        currentLine += text[i];
        process.stdout.write('\r' + currentLine);
        await sleep(delay);
    }
    console.log();
    await sock.sendMessage(jid, { text: text });
}

// Banner estilo consola hacker cinematográfico
const cinematicBannerLines = [
    " ██████╗ ██████╗ ███╗   ██╗███████╗███╗   ██╗███████╗",
    "██╔════╝██╔═══██╗████╗  ██║██╔════╝████╗  ██║██╔════╝",
    "██║     ██║   ██║██╔██╗ ██║█████╗  ██╔██╗ ██║█████╗  ",
    "██║     ██║   ██║██║╚██╗██║██╔══╝  ██║╚██╗██║██╔══╝  ",
    "╚██████╗╚██████╔╝██║ ╚████║███████╗██║ ╚████║███████╗",
    " ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═══╝╚══════╝",
    "                   🌌 CONSOLE MODE 🌌                "
];

// Función para imprimir línea con colores simulados (solo consola)
function printColorLine(line) {
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

// Animación de carga con progreso gradual y parpadeo
async function loadingAnimation(sock, jid, message, totalSteps = 10, delayPerStep = 100) {
    await sock.sendMessage(jid, { text: message });
    let progressBar = "[          ]";

    for (let i = 0; i <= totalSteps; i++) {
        let filled = '■'.repeat(i);
        let empty = ' '.repeat(totalSteps - i);
        let currentProgress = `[${filled}${empty}]`;

        process.stdout.write(`\r${message} ${currentProgress}`);
        
        if (i > 0) {
            await sock.sendMessage(jid, { text: `${message} ${currentProgress}` });
            await sleep(delayPerStep / 2);
            await sock.sendMessage(jid, { text: `${message} [${' '.repeat(totalSteps)}]` });
            await sleep(delayPerStep / 2);
        } else {
             await sock.sendMessage(jid, { text: `${message} ${currentProgress}` });
             await sleep(delayPerStep);
        }
    }
    console.log();
}

// Función de inicio con banner y carga animada (CINEMATOGRÁFICA)
async function startBotCinematic() {
    loadSentRecords();
    const sessionPath = './session';
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        browser: Browsers.macOS("Desktop"),
        logger: pino({ level: 'silent' })
    });
    global.sock = sock;

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on("connection.update", async (update) => {
        const { connection, qr, lastDisconnect } = update;

        if (qr) {
            log("📌 Escanea este QR con tu WhatsApp:");
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            console.log(`Conexión cerrada. Razón: ${statusCode}`);
            if (statusCode !== DisconnectReason.loggedOut) {
                console.log('Reconectando...');
                await startBotCinematic();
            } else {
                console.log('Sesión cerrada. Por favor, elimina la carpeta session e inicia de nuevo.');
            }
        } else if (connection === "open") {
            log("✅ Bot conectado a WhatsApp");
            if (sock.user && sock.user.id && isCreator(sock.user.id)) {
                const creatorJid = sock.user.id;
                
                for (let line of cinematicBannerLines) {
                    printColorLine(line);
                    await typeWriterEffect(sock, creatorJid, line, 70);
                    await sleep(300);
                }
                
                await sleep(500);
                await typeWriterEffect(sock, creatorJid, "\nIniciando sistema central...", 60);

                await loadingAnimation(sock, creatorJid, "Cargando módulos esenciales", 10, 150);
                await sleep(500);
                await loadingAnimation(sock, creatorJid, "Estableciendo protocolos de seguridad", 10, 150);
                await sleep(500);
                await loadingAnimation(sock, creatorJid, "Sincronizando base de datos", 10, 150);
                await sleep(500);

                await typeWriterEffect(sock, creatorJid, "✅ Sistema listo. Acceso al Dashboard del Creador activado.", 60);
                await sleep(1000);
                
                await sendFuturisticMenu(sock, creatorJid);
            } else {
                console.log("Bot conectado, esperando escaneo del creador o reconexión.");
            }
        }
    });

    cron.schedule('0 8 * * *', async () => {
        const groupJid = 'TU_JID_DE_GRUPO@g.us';
        const message = '¡Buenos días! Este es un recordatorio diario. ¡Que tengas un gran día!';
        try {
            await sock.sendMessage(groupJid, { text: message });
            log(`Mensaje diario enviado a [${groupJid}]`);
        } catch (e) {
            logError(`Error al enviar mensaje programado: ${e.message}`);
        }
    });

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
        if (type === "notify") {
            const m = messages[0];

            if (m.message?.protocolMessage?.type === 'REVOKE') {
                const deletedMsgKey = m.message.protocolMessage.key;
                const senderJid = deletedMsgKey.remoteJid;
                const participantJid = deletedMsgKey.participant || senderJid;
                const senderName = m.pushName || participantJid.split('@')[0];
                log(`🗑️ ALERTA: Mensaje eliminado por ${senderName} en [${senderJid}].`);
                return;
            }

            if (!m.key.fromMe) {
                const senderJid = m.key.remoteJid;
                const isGroup = senderJid.endsWith('@g.us');
                const messageText = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
                const senderParticipant = m.key.participant || m.key.remoteJid;
                const senderName = m.pushName || senderParticipant.split('@')[0];

                if (isWordFilterEnabled) {
                    for (const word of OFFENSIVE_WORDS) {
                        if (messageText.toLowerCase().includes(word.toLowerCase())) {
                            await sock.sendMessage(senderJid, { text: `⚠️ Por favor, mantén un lenguaje respetuoso. El uso de palabras ofensivas no está permitido.` });
                            log(`😠 Alerta: Palabra ofensiva detectada de ${senderName} en [${senderJid}]`);
                            return;
                        }
                    }
                }

                if (isAntiLinkEnabled && isGroup && messageText.match(/(https?:\/\/[^\s]+)/gi)) {
                    try {
                        const groupMetadata = await sock.groupMetadata(senderJid);
                        const senderIsAdmin = groupMetadata.participants.find(p => p.id === senderParticipant)?.admin !== null;

                        if (!senderIsAdmin) {
                            await sock.sendMessage(senderJid, { delete: m.key });
                            await sock.groupParticipantsUpdate(senderJid, [senderParticipant], 'remove');
                            log(`🚫 Anti-Link: Mensaje con enlace de ${senderName} eliminado en [${senderJid}]. Usuario expulsado.`);
                        } else {
                            log(`ℹ️ Anti-Link: Enlace ignorado, el remitente es un administrador.`);
                        }
                    } catch (e) {
                        logError(`Error en Anti-Link: ${e.message}`);
                    }
                    return;
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
                        log(`🎟️ Ticket: Se abrió un ticket para [${senderJid}]`);
                    }
                } else if (messageText.toLowerCase().trim() === '!cerrar' && tickets[senderJid] && tickets[senderJid].status === 'open' && !isGroup) {
                    tickets[senderJid].status = 'closed';
                    await sock.sendMessage(senderJid, { text: "Su ticket ha sido cerrado. ¡Gracias por usar nuestro servicio!" });
                    log(`🎟️ Ticket: Se cerró un ticket para [${senderJid}]`);
                } else if (messageText.toLowerCase().trim() === '!cerrar' && !tickets[senderJid] && !isGroup) {
                    await sock.sendMessage(senderJid, { text: "No tienes un ticket abierto para cerrar." });
                }
            }
        }
    });
}

startBotCinematic();
