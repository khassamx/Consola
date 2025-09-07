const { remoteConsoleJid, isRemoteConsoleEnabled } = require('../config');

// Función para enviar mensajes de log a la consola remota de WhatsApp
const sendRemoteLog = async (sock, message) => {
    if (isRemoteConsoleEnabled && sock && remoteConsoleJid) {
        try {
            await sock.sendMessage(remoteConsoleJid, { text: `[LOG] ${message}` });
        } catch (error) {
            console.error('Error al enviar log a la consola remota:', error);
        }
    }
};

const log = (message) => {
    console.log(message);
    if (global.sock) {
        sendRemoteLog(global.sock, message);
    }
};

const logError = (message) => {
    console.error(message);
    if (global.sock) {
        sendRemoteLog(global.sock, message);
    }
};

module.exports = {
    log,
    logError
};