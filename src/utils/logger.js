const { CREATOR_JID, isRemoteConsoleEnabled } = require('../config');

// Función para enviar mensajes de log a la consola remota de WhatsApp
const sendRemoteLog = async (sock, message) => {
    // Se verifica si la consola remota está activada y si el objeto sock es válido.
    if (isRemoteConsoleEnabled && sock) {
        try {
            // Se usa el JID fijo del creador para enviar el mensaje.
            // Esto asegura que el mensaje tenga un destino válido incluso si el bot
            // no ha terminado de autenticarse.
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