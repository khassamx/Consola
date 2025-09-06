const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, '..', '..', 'logs', 'bot.log');
const errorFilePath = path.join(__dirname, '..', '..', 'logs', 'error.log');

function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [INFO] ${message}\n`;
    console.log(logMessage);
    fs.appendFileSync(logFilePath, logMessage, 'utf8');
}

function logError(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [ERROR] ${message}\n`;
    console.error(logMessage);
    fs.appendFileSync(errorFilePath, logMessage, 'utf8');
}

module.exports = {
    log,
    logError
};
