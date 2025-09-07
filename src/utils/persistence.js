const fs = require('fs');
const path = require('path');
const { log, logError } = require('./logger');

const sentUsersFilePath = path.join(__dirname, '..', '..', 'data', 'sent_users.json');

let sentUsers = new Set();

const ensureDataDirectoryExists = () => {
    const dir = path.dirname(sentUsersFilePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

const loadSentRecords = (sock) => {
    ensureDataDirectoryExists();
    if (fs.existsSync(sentUsersFilePath)) {
        try {
            const data = fs.readFileSync(sentUsersFilePath, 'utf8');
            const userArray = JSON.parse(data);
            sentUsers = new Set(userArray);
            log(sock, `✅ Registros de usuarios cargados: ${sentUsers.size} entradas.`);
        } catch (error) {
            logError(sock, `Error al cargar registros de usuarios: ${error.message}`);
        }
    } else {
        log(sock, 'ℹ️ No se encontraron registros de usuarios. Se creará un nuevo archivo.');
    }
};

const saveSentRecords = (sock) => {
    ensureDataDirectoryExists();
    try {
        const userArray = Array.from(sentUsers);
        fs.writeFileSync(sentUsersFilePath, JSON.stringify(userArray, null, 2), 'utf8');
        log(sock, '✅ Registros de usuarios guardados con éxito.');
    } catch (error) {
        logError(sock, `Error al guardar registros de usuarios: ${error.message}`);
    }
};

const addSentUser = (sock, jid) => {
    if (!sentUsers.has(jid)) {
        sentUsers.add(jid);
        log(sock, `✅ Usuario ${jid} añadido a la lista de registros.`);
        saveSentRecords(sock);
        return true;
    }
    return false;
};

const hasSentToUser = (jid) => {
    return sentUsers.has(jid);
};

const getSentUsers = () => {
    return Array.from(sentUsers);
};

module.exports = {
    loadSentRecords,
    addSentUser,
    hasSentToUser,
    getSentUsers,
    saveSentRecords
};