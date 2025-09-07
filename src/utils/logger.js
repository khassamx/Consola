const { CREATOR_JID, isRemoteConsoleEnabled } = require('../config');

// Función para enviar mensajes de log a la consola remota de WhatsApp
const sendRemoteLog = async (sock, message) => {
    // Si la consola remota está activada y tenemos un sock válido
    if (isRemoteConsoleEnabled && sock) {
        try {
            // Se usa CREATOR_JID directamente para enviar el mensaje
            await sock.sendMessage(CREATOR_JID, { text: `[LOG] ${message}` });
        } catch (error) {
            console.error('❌ Error al enviar log a la consola remota:', error);
        }
    }
};

const log = (sock, ...args) => {
    const message = args.map(a => 
        typeof a === "object" ? JSON.stringify(a, null, 2) : a
    ).join(" ");

    console.log(`[${new Date().toISOString()}] ${message}`);
    sendRemoteLog(sock, message);
};

const logError = (sock, ...args) => {
    const message = args.map(a => 
        typeof a === "object" ? JSON.stringify(a, null, 2) : a
    ).join(" ");
    
    console.error(`[${new Date().toISOString()}] ERROR: ${message}`);
    sendRemoteLog(sock, `ERROR: ${message}`);
};

module.exports = {
    log,
    logError
};