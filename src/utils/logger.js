const sendRemoteLog = async (sock, remoteChatId, message) => {
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

const log = (source, message, sock, remoteChatId) => {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ${source ? `[${source}]` : ''} ${message}`;
    console.log(formattedMessage);
    sendRemoteLog(sock, remoteChatId, formattedMessage);
};

const logError = (source, error, sock, remoteChatId) => {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ${source ? `[${source}]` : ''} ❌ ERROR: ${error}`;
    console.error(formattedMessage);
    sendRemoteLog(sock, remoteChatId, formattedMessage);
};

module.exports = { log, logError };