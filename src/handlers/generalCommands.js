const { isAntiSpamEnabled, ANTI_SPAM_THRESHOLD, COMMAND_STATUS } = require('../config');
const { log, logError } = require('../utils/logger');

const lastMessageTimestamps = new Map();

const isSpam = (senderJid) => {
    const now = Date.now();
    const lastMessageTime = lastMessageTimestamps.get(senderJid) || 0;
    const timeElapsed = now - lastMessageTime;

    if (timeElapsed < ANTI_SPAM_THRESHOLD) {
        return true;
    }

    lastMessageTimestamps.set(senderJid, now);
    return false;
};

const handleGeneralCommands = async (sock, m, messageText) => {
    const senderJid = m.key.remoteJid;
    const command = messageText.toLowerCase().trim();

    if (isAntiSpamEnabled && isSpam(senderJid)) {
        return;
    }

    switch (command) {
        case '!dado':
            if (!COMMAND_STATUS['dado']) return;
            const randomNumber = Math.floor(Math.random() * 6) + 1;
            await sock.sendMessage(senderJid, { text: `🎲 Lanzaste un dado y salió: *${randomNumber}*` });
            break;
        case '!8ball':
            if (!COMMAND_STATUS['8ball']) return;
            const responses = [
                'Sí, definitivamente.',
                'Es muy probable.',
                'Puedes contar con ello.',
                'Sin duda.',
                'Probablemente no.',
                'Lo dudo mucho.',
                'Mis fuentes dicen que no.',
                'Mejor no te digo ahora.',
                'Concéntrate y pregunta de nuevo.'
            ];
            const response = responses[Math.floor(Math.random() * responses.length)];
            await sock.sendMessage(senderJid, { text: `🎱 La bola mágica dice: *"${response}"*` });
            break;
        case '!abrir':
            if (!COMMAND_STATUS['abrir']) return;
            // La lógica de tickets está en index.js, pero la verificación se hace aquí.
            break;
        case '!cerrar':
            if (!COMMAND_STATUS['cerrar']) return;
            // La lógica de tickets está en index.js, pero la verificación se hace aquí.
            break;
        default:
            // No hacer nada si el comando no está en la lista.
            break;
    }
};

module.exports = {
    handleGeneralCommands,
    isSpam
};