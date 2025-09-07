const sendRemoteLog = async (sock, remoteChatId, message) => {
    if (!sock || !remoteChatId) {
        console.warn(`[Log] Consola remota no definida, log local: ${message}`);
        return;
    }
    try {
        await sock.sendMessage(remoteChatId, { text: message });
    } catch (err) {
        console.error(`[Error] Fallo al enviar log remoto: ${err.message}`);
    }
};

const log = (message, sock = null, remoteChatId = null) => {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ${message}`;
    console.log(formattedMessage);
    sendRemoteLog(sock, remoteChatId, formattedMessage);
};

const logError = (error, sock = null, remoteChatId = null) => {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ❌ ERROR: ${error}`;
    console.error(formattedMessage);
    sendRemoteLog(sock, remoteChatId, formattedMessage);
};

module.exports = { log, logError };