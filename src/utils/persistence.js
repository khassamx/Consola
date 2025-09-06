const fs = require('fs');
const { log, logError } = require('./logger');

const SENT_FILE = './sentUsers.json';
let sentUsers = [];

function loadSentRecords() {
    try {
        if (fs.existsSync(SENT_FILE)) {
            sentUsers = JSON.parse(fs.readFileSync(SENT_FILE, 'utf-8'));
            log(`Registros cargados: ${sentUsers.length} usuarios ya contactados.`);
        } else {
            log('No se encontraron registros previos. Se creará un nuevo archivo.');
        }
    } catch (err) {
        logError(`Error al leer el archivo de registros: ${err.message}`);
    }
}

function saveSentRecords() {
    try {
        fs.writeFileSync(SENT_FILE, JSON.stringify(sentUsers, null, 2));
    } catch (err) {
        logError(`Error al guardar los registros: ${err.message}`);
    }
}

function getSentUsers() {
    return sentUsers;
}

function addSentUser(jid) {
    sentUsers.push(jid);
    saveSentRecords();
}

module.exports = {
    loadSentRecords,
    saveSentRecords,
    getSentUsers,
    addSentUser
};
