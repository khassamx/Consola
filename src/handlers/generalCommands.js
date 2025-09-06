const { isAntiSpamEnabled, ANTI_SPAM_THRESHOLD } = require('../config');

// Mapa para guardar el último mensaje de cada usuario y prevenir spam
const lastMessageTimestamps = new Map();

// Función que verifica si un mensaje es spam
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

// Función que maneja los comandos generales del bot
const handleGeneralCommands = async (sock, m, messageText) => {
    const senderJid = m.key.remoteJid;
    const command = messageText.toLowerCase().trim();

    if (isAntiSpamEnabled && isSpam(senderJid)) {
        return;
    }

    switch (command) {
        case '~menu':
        case '!ayuda':
        case '!help':
            // El menú principal ahora se maneja en el archivo futuristicMenu.js
            await sock.sendMessage(senderJid, { text: 'Usa `~menu` para ver el menú principal.' });
            break;
        case '!estado':
            // Este comando es solo para el creador
            break;
        case '!dado':
            const randomNumber = Math.floor(Math.random() * 6) + 1;
            await sock.sendMessage(senderJid, { text: `🎲 Lanzaste un dado y salió: *${randomNumber}*` });
            break;
        case '!8ball':
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
    }
};

module.exports = {
    handleGeneralCommands,
    isSpam
};
