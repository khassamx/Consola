const { COMMAND_STATUS } = require('../config');

/**
 * Envía el menú de comandos para los usuarios.
 * @param {import('@whiskeysockets/baileys').WASocket} sock
 * @param {string} senderJid
 */
const sendUserMenu = async (sock, senderJid) => {
    const commandsList = {
        'dado': 'Lanza un dado (número del 1 al 6).',
        '8ball': 'Responde a tus preguntas con la bola 8 mágica.',
        'abrir': 'Abre un ticket de soporte.',
        'cerrar': 'Cierra un ticket de soporte.',
        'menu': 'Muestra este menú de comandos.'
    };

    let menuMessage = `
📜 *MENÚ DE COMANDOS*
_Estos son los comandos que puedes usar:_

${Object.entries(commandsList)
        .map(([command, description]) => {
            const status = COMMAND_STATUS[command] ? '✅' : '❌';
            return `*${status} !${command}*: ${description}`;
        })
        .join('\n')}

_Nota: Los tickets de soporte son solo en chat privado._
`;

    try {
        await sock.sendMessage(senderJid, { text: menuMessage });
    } catch (error) {
        console.error('Error al enviar el menú de usuario:', error);
    }
};

module.exports = {
    sendUserMenu
};