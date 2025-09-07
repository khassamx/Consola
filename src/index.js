const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys');
const readline = require('readline');
const pino = require('pino');
const cron = require('node-cron');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const os = require('os');
const chalk = require('chalk');

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

const rainbowColors = [chalk.red, chalk.yellow, chalk.green, chalk.cyan, chalk.blue, chalk.magenta];

function rainbowText(text) {
  return text.split('').map((c, i) => rainbowColors[i % rainbowColors.length](c)).join('');
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

// Función principal para dibujar la animación
function drawFrame() {
  console.clear();

  // Mensaje parpadeante arcoíris
  const welcomeMessage = welcomeFrames[Math.floor(cycle / 2) % welcomeFrames.length];
  console.log(rainbowText(welcomeMessage.padEnd(width/2 + welcomeMessage.length/2, ' ').padStart(width, ' ')) + "\n");

  // Mover nubes y estrellas
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

  // Suelo
  console.log('_'.repeat(width));

  // Espacio para QR o mensaje de estado
  console.log("\n".repeat(2));
  if (qrCodeData) {
      console.log(rainbowText("📌 Escanea este QR con tu WhatsApp:"));
      qrcode.generate(qrCodeData, { small: true });
  } else if (botIsReady) {
      console.log(rainbowText("✅ Bot listo. Esperando nuevos mensajes..."));
  } else {
      console.log(rainbowText("⏳ Esperando el código QR..."));
  }

  // Actualizar posición y frames
  pos++;
  if (pos > width - halconFrames[0].length) pos = 0;
  frameIndex = (frameIndex + 1) % halconFrames.length;
  verticalPos += direction;
  if (verticalPos >= height - 5 || verticalPos <= 2) direction *= -1;
  cycle++;
}

// Iniciar la animación
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
            // Aquí puedes llamar a tu menú si es necesario
        }
    });

    conn.ev.on("messages.upsert", async ({ messages, type }) => {
        if (type === "notify" && conn) {
            const m = messages[0];
            // Tu lógica para manejar mensajes aquí
        }
    });
}

// Nueva función principal que controla el flujo de inicio
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
                rl.question(`\n${chalk.hex('#FFD700')('¿Deseas empezar? (Y/n):')} `, async (answer) => {
                    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
                        log(null, '📌 Escaneando código QR...');
                        // La función de animación ya se encarga de mostrar el QR
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