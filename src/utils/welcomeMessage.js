const { jidNormalizedUser } = require('@whiskeysockets/baileys');
const { log, logError } = require('./logger');
const { getSentUsers, addSentUser } = require('./persistence');
const { getFormattedDateTime } = require('./utils');

async function sendWelcomeMessageWithPersistence(sock, user, groupName) {
    const normalizedUser = jidNormalizedUser(user);
    if (!getSentUsers().includes(normalizedUser)) {
        try {
            const { date, time } = getFormattedDateTime();
            const message = `
Texto::::
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

function getFormattedDateTime() {
    const now = new Date();
    const date = now.toLocaleDateString();
    const time = now.toLocaleTimeString('en-US', { hour12: false }) + `.${now.getMilliseconds()}`;
    return { date, time };
}

module.exports = {
    sendWelcomeMessageWithPersistence
};
