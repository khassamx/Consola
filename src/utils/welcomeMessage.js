const { isWelcomeMessageEnabled, GROUP_WELCOME_MESSAGE } = require('../config');
const { hasSentToUser, addSentUser } = require('./persistence');
const { log, logError } = require('./logger');

const sendWelcomeMessageWithPersistence = async (sock, jid, groupName, customMessage) => {
    if (!isWelcomeMessageEnabled) {
        return;
    }

    if (hasSentToUser(jid)) {
        log(sock, `ℹ️ No se envió el mensaje de bienvenida a ${jid} porque ya se ha enviado antes.`);
        return;
    }

    const welcomeMessage = customMessage || GROUP_WELCOME_MESSAGE(jid.split('@')[0]);

    try {
        await sock.sendMessage(jid, { text: welcomeMessage });
        log(sock, `✅ Mensaje de bienvenida enviado a ${jid} en el grupo ${groupName}.`);
        addSentUser(sock, jid);
    } catch (error) {
        logError(sock, `❌ Error al enviar mensaje de bienvenida a ${jid}: ${error.message}`);
    }
};

module.exports = {
    sendWelcomeMessageWithPersistence
};