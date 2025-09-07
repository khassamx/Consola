const { groupCommandsEnabled, isAntiLinkEnabled, isWordFilterEnabled, isAntiSpamEnabled, isAntiPrefixEnabled } = require('../config');

const sendFuturisticMenu = async (sock, jid) => {
    const sections = [
        {
            title: "⚙️ AJUSTES DEL BOT",
            rows: [
                {
                    title: "Comandos de Grupo",
                    rowId: "1",
                    description: `Estado: ${groupCommandsEnabled ? 'ACTIVO' : 'INACTIVO'}`
                },
                {
                    title: "Anti-Link",
                    rowId: "2",
                    description: `Estado: ${isAntiLinkEnabled ? 'ACTIVO' : 'INACTIVO'}`
                },
                {
                    title: "Filtro de Palabras",
                    rowId: "3",
                    description: `Estado: ${isWordFilterEnabled ? 'ACTIVO' : 'INACTIVO'}`
                },
                {
                    title: "Anti-Spam",
                    rowId: "4",
                    description: `Estado: ${isAntiSpamEnabled ? 'ACTIVO' : 'INACTIVO'}`
                },
                {
                    title: "Anti-Prefijo",
                    rowId: "5",
                    description: `Estado: ${isAntiPrefixEnabled ? 'ACTIVO' : 'INACTIVO'}`
                }
            ]
        }
    ];

    const listMessage = {
        text: "Menú de Configuración Avanzada",
        footer: "Selecciona una opción para ver más detalles.",
        buttonText: "Ver Opciones",
        sections
    };

    await sock.sendMessage(jid, listMessage);
};

const sendFuturisticSection = async (sock, jid, sectionId) => {
    let text = "";
    let footer = "Escribe otro número para regresar al menú principal.";
    
    switch (sectionId) {
        case "1":
            text = `
            *🟢 Comandos de Grupo*

            Permite habilitar o deshabilitar comandos en grupos.
            
            *Estado Actual:* ${groupCommandsEnabled ? 'ACTIVO' : 'INACTIVO'}
            
            *Comandos:*
            🟢 .on ➤ Habilita los comandos en grupos
            🔴 .off ➤ Deshabilita los comandos en grupos
            `;
            break;
        case "2":
            text = `
            *🟢 Anti-Link*

            Detecta y elimina mensajes que contienen enlaces de invitación a grupos de WhatsApp.
            
            *Estado Actual:* ${isAntiLinkEnabled ? 'ACTIVO' : 'INACTIVO'}
            
            *Comandos:*
            🟢 .antilink on ➤ Habilita el Anti-Link
            🔴 .antilink off ➤ Deshabilita el Anti-Link
            `;
            break;
        case "3":
            text = `
            *🟢 Filtro de Palabras*

            Evita que los usuarios envíen mensajes con palabras ofensivas o no deseadas.
            
            *Estado Actual:* ${isWordFilterEnabled ? 'ACTIVO' : 'INACTIVO'}
            
            *Comandos:*
            🟢 .wordfilter on ➤ Habilita el Filtro de Palabras
            🔴 .wordfilter off ➤ Deshabilita el Filtro de Palabras
            `;
            break;
        case "4":
            text = `
            *🟢 Anti-Spam*

            Detecta y bloquea a los usuarios que envían muchos mensajes en un corto período de tiempo.
            
            *Estado Actual:* ${isAntiSpamEnabled ? 'ACTIVO' : 'INACTIVO'}
            
            *Comandos:*
            🟢 .antispam on ➤ Habilita el Anti-Spam
            🔴 .antispam off ➤ Deshabilita el Anti-Spam
            `;
            break;
        case "5":
            text = `
            *🟢 Anti-Prefijo*

            Expulsa a los usuarios que tienen un número con un prefijo telefónico no permitido (por ejemplo, números de Medio Oriente).
            
            *Estado Actual:* ${isAntiPrefixEnabled ? 'ACTIVO' : 'INACTIVO'}
            
            *Comandos:*
            🟢 .antiprefix on ➤ Habilita el Anti-Prefijo
            🔴 .antiprefix off ➤ Deshabilita el Anti-Prefijo
            `;
            break;
        default:
            text = "Opción no válida. Por favor, selecciona una de las opciones del menú principal.";
            footer = "Puedes volver a escribir .menu para ver las opciones.";
    }

    const message = {
        text: text,
        footer: footer,
    };

    await sock.sendMessage(jid, message);
};

module.exports = {
    sendFuturisticMenu,
    sendFuturisticSection
};