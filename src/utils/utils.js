const { getFormattedDateTime } = require('./welcomeMessage');
const { getChatHistory, addChatRecord } = require('./persistence');
const { CREATOR_JID } = require('../config');

// Maneja los mensajes entrantes y los almacena en el historial
const handleIncomingMessage = async (m, sock) => {
    if (!m.key.fromMe) {
        const messageId = m.key.id;
        const senderJid = m.key.remoteJid;
        const participantJid = m.key.participant || senderJid;
        const senderName = m.pushName || participantJid.split('@')[0];
        const messageType = Object.keys(m.message)[0];
        const messageText = m.message?.conversation || m.message?.extendedTextMessage?.text || '';

        const record = {
            id: messageId,
            from: senderJid,
            participant: participantJid,
            name: senderName,
            type: messageType,
            message: messageText,
            timestamp: getFormattedDateTime()
        };

        addChatRecord(record);

        if (senderJid === CREATOR_JID && messageText === '.cc') {
            await displayFullChatHistory(sock, senderJid);
        }
    }
};

const displayFullChatHistory = async (sock, jid) => {
    const history = getChatHistory();
    let historyText = '📜 *Historial de Chat Completo*\n\n';
    history.forEach(record => {
        historyText += `*De:* ${record.name}\n`;
        historyText += `*Mensaje:* ${record.message}\n`;
        historyText += `*Tipo:* ${record.type}\n`;
        historyText += `*Fecha:* ${record.timestamp.date} - *Hora:* ${record.timestamp.time}\n`;
        historyText += '---------------------------\n';
    });
    await sock.sendMessage(jid, { text: historyText });
};

module.exports = {
    handleIncomingMessage
};
