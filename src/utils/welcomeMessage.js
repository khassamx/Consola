const { jidNormalizedUser } = require('@whiskeysockets/baileys');
const { log, logError } = require('./logger');
const { getSentUsers, addSentUser } = require('./persistence');

// Función de utilidad para obtener fecha y hora formateadas
function getFormattedDateTime() {
    const now = new Date();
    const date = now.toLocaleDateString();
    const time = now.toLocaleTimeString('en-US', { hour12: false }) + `.${now.getMilliseconds()}`;
    return { date, time };
}

async function sendWelcomeMessageWithPersistence(sock, user, groupName, customMessage = null) {
    const normalizedUser = jidNormalizedUser(user);
    if (!getSentUsers().includes(normalizedUser)) {
        try {
            const { date, time } = getFormattedDateTime();
            const message = customMessage || `
╔═══════════════════╗
║       🤖 SUBBOT       ║
╠═══════════════════╣
║ ¡Hola! Soy tu Subbot. ║
║ Puedes usar mis comandos: ║
║       .help           ║
╠═══════════════════╣
║ 👥 Grupo: ${groupName}
║ 📅 Fecha: ${date}
║ ⏰ Hora: ${time}
╚═══════════════════╝`;

            await sock.sendMessage(normalizedUser, { text: message });
            addSentUser(normalizedUser);
            log(`✅ Mensaje de bienvenida enviado a ${normalizedUser} del grupo ${groupName}`);
        } catch (error) {
            logError(`❌ Error enviando mensaje a ${normalizedUser}: ${error.message}`);
        }
    } else {
        log(`✅ Usuario ${normalizedUser} ya contactado. Omitiendo.`);
    }
}

module.exports = {
    sendWelcomeMessageWithPersistence
};