const { CREATOR_JID, isAntiLinkEnabled, isWordFilterEnabled, isWelcomeMessageEnabled, botMode, COMMAND_STATUS } = require('../config');
const { sendWelcomeMessageWithPersistence } = require('../utils/welcomeMessage');
const { getSentUsers } = require('../utils/persistence');
const { log, logError } = require('../utils/logger');


const handleCreatorCommands = async (sock, m, messageText) => {
    const senderJid = m.key.remoteJid;
    const isGroup = senderJid.endsWith('@g.us');
    const command = messageText.toLowerCase().trim();
    const args = messageText.trim().split(' ');

    if (senderJid !== CREATOR_JID) {
        return false;
    }

    const mentionedJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

    switch (true) {
        case command.startsWith('.toggle '):
            const commandName = args[1];
            const status = args[2];
            if (!commandName || !status || !(status === 'on' || status === 'off')) {
                await sock.sendMessage(senderJid, { text: "Uso incorrecto. Formato: `.toggle [comando] [on/off]`" });
                return true;
            }
            if (COMMAND_STATUS.hasOwnProperty(commandName)) {
                COMMAND_STATUS[commandName] = status === 'on';
                await sock.sendMessage(senderJid, { text: `✅ El comando *${commandName}* ahora está *${status.toUpperCase()}*.` });
            } else {
                await sock.sendMessage(senderJid, { text: `❌ El comando *${commandName}* no existe o no se puede controlar.` });
            }
            return true;

        case command === '.on':
            groupCommandsEnabled = true;
            await sock.sendMessage(senderJid, { text: '✅ Comandos de grupo activados.' });
            return true;
        case command === '.off':
            groupCommandsEnabled = false;
            await sock.sendMessage(senderJid, { text: '❌ Comandos de grupo desactivados.' });
            return true;
        case command.startsWith('.e '):
            const parts = messageText.split(' ');
            const targetNumber = parts[1].replace(/\D/g, '');
            const targetJid = `${targetNumber}@s.whatsapp.net`;
            const msgBody = parts.slice(2).join(' ');
            if (targetJid && msgBody) {
                try {
                    await sock.sendMessage(targetJid, { text: msgBody });
                    log(sock, `Mensaje enviado a ${targetJid} desde el comando .e`);
                    await sock.sendMessage(senderJid, { text: `✅ Mensaje enviado a ${targetNumber}` });
                } catch (e) {
                    logError(sock, `Error al enviar mensaje con .e: ${e.message}`);
                    await sock.sendMessage(senderJid, { text: `❌ No se pudo enviar el mensaje a ${targetNumber}.` });
                }
            } else {
                await sock.sendMessage(senderJid, { text: "Uso incorrecto del comando. Formato: .e número mensaje" });
            }
            return true;
        case command.startsWith('.modo '):
            const mode = command.split(' ')[1];
            if (['activo', 'silencioso', 'fiesta'].includes(mode)) {
                botMode = mode;
                await sock.sendMessage(senderJid, { text: `✅ Modo del bot cambiado a: *${mode.charAt(0).toUpperCase() + mode.slice(1)}*.` });
            } else {
                await sock.sendMessage(senderJid, { text: 'Uso incorrecto. Modos disponibles: `activo`, `silencioso`, `fiesta`.' });
            }
            return true;
        case command.startsWith('.filtro-palabras '):
            const filterStatus = command.split(' ')[1];
            if (filterStatus === 'on') {
                isWordFilterEnabled = true;
                await sock.sendMessage(senderJid, { text: '✅ Filtro de palabras activado.' });
            } else if (filterStatus === 'off') {
                isWordFilterEnabled = false;
                await sock.sendMessage(senderJid, { text: '❌ Filtro de palabras desactivado.' });
            } else {
                await sock.sendMessage(senderJid, { text: 'Uso incorrecto. Formato: `.filtro-palabras [on/off]`' });
            }
            return true;
        case command.startsWith('.bloquear-links '):
            const linkStatus = command.split(' ')[1];
            if (linkStatus === 'on') {
                isAntiLinkEnabled = true;
                await sock.sendMessage(senderJid, { text: '✅ Bloqueo de enlaces activado.' });
            } else if (linkStatus === 'off') {
                isAntiLinkEnabled = false;
                await sock.sendMessage(senderJid, { text: '❌ Bloqueo de enlaces desactivado.' });
            } else {
                await sock.sendMessage(senderJid, { text: 'Uso incorrecto. Formato: `.bloquear-links [on/off]`' });
            }
            return true;
        case command.startsWith('.bloquear-prefijos '):
            const prefixStatus = command.split(' ')[1];
            if (prefixStatus === 'on') {
                isAntiPrefixEnabled = true;
                await sock.sendMessage(senderJid, { text: '✅ Filtro de prefijos activado.' });
            } else if (prefixStatus === 'off') {
                isAntiPrefixEnabled = false;
                await sock.sendMessage(senderJid, { text: '❌ Filtro de prefijos desactivado.' });
            } else {
                await sock.sendMessage(senderJid, { text: 'Uso incorrecto. Formato: `.bloquear-prefijos [on/off]`' });
            }
            return true;
        case isGroup && command.startsWith('.kick') && mentionedJid !== undefined:
            if (!COMMAND_STATUS['kick']) {
                await sock.sendMessage(senderJid, { text: '❌ El comando `.kick` está desactivado.' });
                return true;
            }
            await sock.groupParticipantsUpdate(senderJid, [mentionedJid], 'remove');
            log(sock, `Miembro ${mentionedJid} expulsado por el creador.`);
            await sock.sendMessage(senderJid, { text: `👢 El usuario *${mentionedJid.split('@')[0]}* ha sido expulsado del grupo.` });
            return true;
        case isGroup && command.startsWith('.promover') && mentionedJid !== undefined:
            if (!COMMAND_STATUS['promover']) {
                await sock.sendMessage(senderJid, { text: '❌ El comando `.promover` está desactivado.' });
                return true;
            }
            await sock.groupParticipantsUpdate(senderJid, [mentionedJid], 'promote');
            log(sock, `Miembro ${mentionedJid} promovido a admin.`);
            await sock.sendMessage(senderJid, { text: `⭐ El usuario *${mentionedJid.split('@')[0]}* ha sido promovido a administrador.` });
            return true;
        case isGroup && command.startsWith('.limpiar '):
            if (!COMMAND_STATUS['limpiar']) {
                await sock.sendMessage(senderJid, { text: '❌ El comando `.limpiar` está desactivado.' });
                return true;
            }
            const numMessages = parseInt(command.split(' ')[1], 10);
            if (isNaN(numMessages) || numMessages <= 0) {
                await sock.sendMessage(senderJid, { text: "Uso incorrecto. Formato: `.limpiar [número de mensajes]`" });
                return true;
            }
            const messages = await sock.fetchMessages(senderJid, { count: numMessages });
            const messageKeys = messages.map(msg => msg.key);
            await sock.deleteMessages(senderJid, messageKeys);
            await sock.sendMessage(senderJid, { text: `✅ Se eliminaron los últimos *${numMessages}* mensajes de este chat.` });
            return true;
        case isGroup && command.startsWith('.anuncio '):
            if (!COMMAND_STATUS['anuncio']) {
                await sock.sendMessage(senderJid, { text: '❌ El comando `.anuncio` está desactivado.' });
                return true;
            }
            const groups = await sock.groupFetchAllParticipating();
            for (const group of Object.values(groups)) {
                await sock.sendMessage(group.id, { text: `📢 *ANUNCIO DEL CREADOR:*\n\n${announcement}` });
            }
            await sock.sendMessage(senderJid, { text: `✅ Anuncio enviado a *${Object.keys(groups).length}* grupos.` });
            return true;
        case command.startsWith('.bienvenida'):
            if (!COMMAND_STATUS['bienvenida']) {
                await sock.sendMessage(senderJid, { text: '❌ El comando `.bienvenida` está desactivado.' });
                return true;
            }
            if (args[1] === 'on') {
                isWelcomeMessageEnabled = true;
                await sock.sendMessage(senderJid, { text: '✅ Mensaje de bienvenida activado.' });
            } else if (args[1] === 'off') {
                isWelcomeMessageEnabled = false;
                await sock.sendMessage(senderJid, { text: '❌ Mensaje de bienvenida desactivado.' });
            } else if (args[1] === 'lista') {
                const allGroups = await sock.groupFetchAllParticipating();
                let listMessage = "Lista de Grupos:\n\n";
                Object.values(allGroups).forEach((group, index) => {
                    listMessage += `${index + 1}. ${group.subject}\n`;
                });
                await sock.sendMessage(senderJid, { text: listMessage });
            } else if (args[1] === 'privados') {
                const sentCount = getSentUsers().length;
                await sock.sendMessage(senderJid, { text: `Se han enviado ${sentCount} mensajes de bienvenida en privado hasta ahora.` });
            } else {
                await sock.sendMessage(senderJid, { text: 'Uso incorrecto. Formato: `.bienvenida [on/off/lista/privados]`' });
            }
            return true;
        case command.startsWith('.spam'):
            if (!COMMAND_STATUS['spam']) {
                await sock.sendMessage(senderJid, { text: '❌ El comando `.spam` está desactivado.' });
                return true;
            }
            const groupList = await sock.groupFetchAllParticipating();
            const groupIndex = parseInt(args[1], 10) - 1;
            const customMessage = args.slice(2).join(' ');

            if (isNaN(groupIndex) || !Object.values(groupList)[groupIndex] || !customMessage) {
                await sock.sendMessage(senderJid, { text: 'Uso incorrecto. Formato: `.spam [número de grupo] [mensaje]`' });
                return true;
            }
            
            const targetGroup = Object.values(groupList)[groupIndex];
            const participants = targetGroup.participants;

            if (isWelcomeMessageEnabled) {
                await sock.sendMessage(senderJid, { text: `📢 Enviando mensaje a los miembros de *${targetGroup.subject}*...` });
                for (const participant of participants) {
                    await sendWelcomeMessageWithPersistence(sock, participant.id, targetGroup.subject, customMessage);
                }
                await sock.sendMessage(senderJid, { text: `✅ Mensaje de spam enviado a todos los miembros de *${targetGroup.subject}*.` });
            } else {
                await sock.sendMessage(senderJid, { text: '❌ El sistema de bienvenida está desactivado. Usa `.bienvenida on` para activarlo.' });
            }
            return true;
        case isGroup && command.startsWith('.tag '):
            if (!COMMAND_STATUS['tag']) {
                await sock.sendMessage(senderJid, { text: '❌ El comando `.tag` está desactivado.' });
                return true;
            }
            const textToTag = messageText.slice(5).trim();
            if (!textToTag) {
                await sock.sendMessage(senderJid, { text: "Uso incorrecto. Formato: `.tag [mensaje]`" });
                return true;
            }

            try {
                const groupMetadata = await sock.groupMetadata(senderJid);
                const participants = groupMetadata.participants.map(p => p.id);
                const mentionText = `📢 *MENCIÓN GENERAL:*\n\n${textToTag}`;
                
                await sock.sendMessage(senderJid, {
                    text: mentionText,
                    mentions: participants
                });
                
                log(sock, `Comando .tag ejecutado en [${senderJid}] por el creador.`);
            } catch (error) {
                logError(sock, `Error al ejecutar .tag: ${error.message}`);
                await sock.sendMessage(senderJid, { text: '❌ Ocurrió un error al intentar mencionar a todos.' });
            }
            return true;
        default:
            return false;
    }
};

module.exports = {
    handleCreatorCommands
};