const { CREATOR_JID } = require('../config');

// Variable global para la conexión, se asignará desde index.js
let sock = null;
let remoteChatId = CREATOR_JID;

function setSocket(socket) {
    sock = socket;
}

const sendRemoteLog = async (message) => {
    if (!sock || !remoteChatId) {
        console.warn('Consola remota no definida, log local:', message);
        return;
    }
    try {
        await sock.sendMessage(remoteChatId, { text: message });
    } catch (err) {
        console.error('Error al enviar log remoto:', err);
    }
};

const log = (source, message) => {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ${source ? `[${source}]` : ''} ${message}`;
    console.log(formattedMessage);
    sendRemoteLog(formattedMessage);
};

const logError = (source, error) => {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ${source ? `[${source}]` : ''} ❌ ERROR: ${error}`;
    console.error(formattedMessage);
    sendRemoteLog(formattedMessage);
};

module.exports = { log, logError, setSocket };