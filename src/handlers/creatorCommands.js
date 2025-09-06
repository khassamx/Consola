const { CREATOR_JID, isAntiLinkEnabled, isWordFilterEnabled, isWelcomeMessageEnabled, botMode } = require('../config');
const { sendWelcomeMessageWithPersistence } = require('../utils/welcomeMessage');
const { getSentUsers } = require('../utils/persistence');

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
                    log(`Mensaje enviado a ${targetJid} desde el comando .e`);
                    await sock.sendMessage(senderJid, { text: `✅ Mensaje enviado a ${targetNumber}` });
                } catch (e) {
                    logError(`Error al enviar mensaje con .e: ${e.message}`);
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
        case isGroup && command.startsWith('.kick') && mentionedJid !== undefined:
            await sock.groupParticipantsUpdate(senderJid, [mentionedJid], 'remove');
            log(`Miembro ${mentionedJid} expulsado por el creador.`);
            await sock.sendMessage(senderJid, { text: `✅ Usuario expulsado.` });
            return true;
        case isGroup && command.startsWith('.promover') && mentionedJid !== undefined:
            await sock.groupParticipantsUpdate(senderJid, [mentionedJid], 'promote');
            log(`Miembro ${mentionedJid} promovido a admin.`);
            await sock.sendMessage(senderJid, { text: `✅ Usuario promovido a admin.` });
            return true;
        case isGroup && command.startsWith('.limpiar '):
            const numMessages = parseInt(command.split(' ')[1], 10);
            if (isNaN(numMessages) || numMessages <= 0) {
                await sock.sendMessage(senderJid, { text: "Uso incorrecto. Formato: `.limpiar [número de mensajes]`" });
                return true;
            }
            const messages = await sock.fetchMessages(senderJid, { count: numMessages });
            const messageKeys = messages.map(msg => msg.key);
            await sock.deleteMessages(senderJid, messageKeys);
            await sock.sendMessage(senderJid, { text: `✅ Se eliminaron los últimos ${numMessages} mensajes.` });
            return true;
        case isGroup && command.startsWith('.anuncio '):
            const announcement = messageText.split(' ').slice(1).join(' ');
            const groupsForAnnouncement = await sock.groupFetchAllParticipating();
            for (const group of Object.values(groupsForAnnouncement)) {
                await sock.sendMessage(group.id, { text: `📢 *ANUNCIO DEL CREADOR:*\n\n${announcement}` });
            }
            await sock.sendMessage(senderJid, { text: `✅ Anuncio enviado a ${Object.keys(groupsForAnnouncement).length} grupos.` });
            return true;
        case command.startsWith('.bienvenida'):
            if (args[1] === 'on') {
                isWelcomeMessageEnabled = true;
                await sock.sendMessage(senderJid, { text: '✅ Mensaje de bienvenida activado.' });
            } else if (args[1] === 'off') {
                isWelcomeMessageEnabled = false;
                await sock.sendMessage(senderJid, { text: '❌ Mensaje de bienvenida desactivado.' });
            } else if (args[1] === 'lista') {
                const groupsForList = await sock.groupFetchAllParticipating();
                let listMessage = "Lista de Grupos:\n\n";
                Object.values(groupsForList).forEach((group, index) => {
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
            const groupsForSpam = await sock.groupFetchAllParticipating();
            const groupList = Object.values(groupsForSpam);
            const groupIndex = parseInt(args[1], 10) - 1;
            const customMessage = args.slice(2).join(' ');

            if (isNaN(groupIndex) || !groupList[groupIndex] || !customMessage) {
                await sock.sendMessage(senderJid, { text: 'Uso incorrecto. Formato: `.spam [número de grupo] [mensaje]`' });
                return true;
            }
            
            const targetGroup = groupList[groupIndex];
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
        default:
            return false;
    }
};

module.exports = {
    handleCreatorCommands
};