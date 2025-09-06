const fs = require('fs');
const path = require('path');
const { log, logError } = require('./logger');

const sentUsersFilePath = path.join(__dirname, '..', '..', 'data', 'sentUsers.json');
const chatHistoryPath = path.join(__dirname, '..', '..', 'data', 'historial.json');

let sentUsers = [];
let chatHistory = [];

function loadSentRecords() {
    try {
        if (fs.existsSync(sentUsersFilePath)) {
            const data = fs.readFileSync(sentUsersFilePath, 'utf8');
            sentUsers = JSON.parse(data);
            log(`✅ Registros de usuarios enviados cargados: ${sentUsers.length} usuarios.`);
        } else {
            fs.mkdirSync(path.dirname(sentUsersFilePath), { recursive: true });
            fs.writeFileSync(sentUsersFilePath, '[]', 'utf8');
            log('✅ Archivo sentUsers.json creado.');
        }
    } catch (e) {
        logError(`❌ Error al cargar sentUsers.json: ${e.message}`);
        sentUsers = [];
    }
}

function saveSentRecords() {
    try {
        fs.writeFileSync(sentUsersFilePath, JSON.stringify(sentUsers, null, 2), 'utf8');
        log('💾 Registros de usuarios guardados.');
    } catch (e) {
        logError(`❌ Error al guardar sentUsers.json: ${e.message}`);
    }
}

function getSentUsers() {
    return sentUsers;
}

function addSentUser(jid) {
    if (!sentUsers.includes(jid)) {
        sentUsers.push(jid);
        saveSentRecords();
    }
}

function loadChatHistory() {
    try {
        if (fs.existsSync(chatHistoryPath)) {
            const data = fs.readFileSync(chatHistoryPath, 'utf8');
            chatHistory = JSON.parse(data);
            log(`✅ Historial de chat cargado: ${chatHistory.length} registros.`);
        } else {
            fs.mkdirSync(path.dirname(chatHistoryPath), { recursive: true });
            fs.writeFileSync(chatHistoryPath, '[]', 'utf8');
            log('✅ Archivo historial.json creado.');
        }
    } catch (e) {
        logError(`❌ Error al cargar historial.json: ${e.message}`);
        chatHistory = [];
    }
}

function saveChatHistory() {
    try {
        fs.writeFileSync(chatHistoryPath, JSON.stringify(chatHistory, null, 2), 'utf8');
        log('💾 Historial de chat guardado.');
    } catch (e) {
        logError(`❌ Error al guardar historial.json: ${e.message}`);
    }
}

function getChatHistory() {
    return chatHistory;
}

function addChatRecord(record) {
    chatHistory.push(record);
    saveChatHistory();
}

module.exports = {
    loadSentRecords,
    saveSentRecords,
    getSentUsers,
    addSentUser,
    loadChatHistory,
    saveChatHistory,
    getChatHistory,
    addChatRecord
};
