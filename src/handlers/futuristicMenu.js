const { CREATOR_JID, isAntiSpamEnabled, ANTI_SPAM_THRESHOLD, isWelcomeMessageEnabled, botMode, isAntiLinkEnabled, isWordFilterEnabled } = require('../config');
const { getSentUsers } = require('../utils/persistence');

// Menú ultra futurista estilo terminal hacker animado
const sendFuturisticMenu = async (sock, jid) => {
    // Títulos animados
    const titles = [
        '🌌👑 DASHBOARD DEL CREADOR – HACKER MODE 👑🌌',
        '🌌⚡ CARGANDO MENÚ PRINCIPAL… ⚡🌌',
        '🌌✅ MENÚ LISTO PARA USO 👑🌌'
    ];

    for (let title of titles) {
        await sock.sendMessage(jid, { text: `\`\`\`${title}\`\`\`` });
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Efecto de “carga” con puntos suspensivos
    const loading = ['[■□□□□□□□□□]', '[■■■□□□□□□□]', '[■■■■■□□□□□]', '[■■■■■■■■□□]', '[■■■■■■■■■■]'];
    for (let frame of loading) {
        await sock.sendMessage(jid, { text: `Cargando menú ${frame}` });
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Menú principal con efecto de “scrolling línea por línea”
    const menuLines = [
        '🔹 NAVEGACIÓN PRINCIPAL:',
        '────────────────────────────',
        '1️⃣  ⚙️ Administración',
        '2️⃣  🎊 Bienvenida & Spam',
        '3️⃣  🛠️ Modulación & Seguridad',
        '4️⃣  ℹ️ Información / Ayuda',
        '0️⃣  ❌ Salir',
        '',
        '💡 Escribe el número de la sección que quieras abrir.'
    ];

    for (let line of menuLines) {
        await sock.sendMessage(jid, { text: line });
        await new Promise(resolve => setTimeout(resolve, 150));
    }
};

// Función para enviar secciones con efecto scrolling animado
const sendFuturisticSection = async (sock, jid, option) => {
    let lines = [];
    switch(option) {
        case '1':
            lines = [
                '┏━━━━━━━━━━━━━━━━━━━━━━┓',
                '┃ ⚙️ ADMINISTRACIÓN ┃',
                '┗━━━━━━━━━━━━━━━━━━━━━━┛',
                `🟢 .on / .off ➤ Comandos de grupo: ${groupCommandsEnabled ? 'ACTIVO' : 'INACTIVO'}`,
                `🟡 .modo [activo/silencioso/fiesta] ➤ Modo actual: ${botMode}`,
                '✉️ .e [número] [mensaje] ➤ Enviar mensaje a un número específico',
                '🗑️ .limpiar [número] ➤ Eliminar mensajes en el chat',
                '📢 .anuncio [mensaje] ➤ Enviar mensaje a todos los grupos'
            ];
            break;
        case '2':
            const sentCount = getSentUsers().length;
            lines = [
                '┏━━━━━━━━━━━━━━━━━━━━━━┓',
                '┃ 🎊 BIENVENIDA & SPAM ┃',
                '┗━━━━━━━━━━━━━━━━━━━━━━┛',
                `👋 .bienvenida [on/off] ➤ Sistema: ${isWelcomeMessageEnabled ? 'ACTIVO' : 'INACTIVO'}`,
                '📋 .bienvenida lista ➤ Ver lista de grupos',
                `📩 .bienvenida privados ➤ Mensajes enviados: ${sentCount}`,
                '⚡ .spam [número] [mensaje] ➤ Enviar mensaje a los miembros de un grupo'
            ];
            break;
        case '3':
            lines = [
                '┏━━━━━━━━━━━━━━━━━━━━━━┓',
                '┃ 🛠️ MODULACIÓN & SEGURIDAD ┃',
                '┗━━━━━━━━━━━━━━━━━━━━━━┛',
                `🚫 .filtro-palabras [on/off] ➤ Filtro: ${isWordFilterEnabled ? 'ACTIVO' : 'INACTIVO'}`,
                `🔗 .bloquear-links [on/off] ➤ Bloqueo: ${isAntiLinkEnabled ? 'ACTIVO' : 'INACTIVO'}`,
                `⚠️ .anti-spam [on/off] ➤ Sistema: ${isAntiSpamEnabled ? 'ACTIVO' : 'INACTIVO'}`,
                '👢 .kick [etiqueta] ➤ Expulsar un miembro',
                '⭐ .promover [etiqueta] ➤ Promover a un miembro a admin'
            ];
            break;
        case '4':
            lines = [
                'ℹ️ INFORMACIÓN / AYUDA',
                '────────────────────────',
                '💡 Este menú es exclusivo para el creador.',
                '💻 Usa los números para navegar por las secciones.',
                '🌐 Cada comando tiene su explicación detallada.'
            ];
            break;
        case '0':
            lines = ['❌ Cerrando menú. ¡Hasta luego, creador!'];
            break;
        default:
            lines = ['⚠️ Opción inválida. Escribe un número del 0 al 4.'];
            break;
    }

    for (let line of lines) {
        await sock.sendMessage(jid, { text: line });
        await new Promise(resolve => setTimeout(resolve, 150));
    }
};

const isCreator = (jid) => {
    return jid === CREATOR_JID;
};

module.exports = {
    sendFuturisticMenu,
    sendFuturisticSection,
    isCreator
};