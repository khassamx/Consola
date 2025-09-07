// AÑADIDO: isWelcomeMessageEnabled y ANTI_SPAM_THRESHOLD
let isWelcomeMessageEnabled = false; 
const ANTI_SPAM_THRESHOLD = 2000;
const CREATOR_JID = '595984495031@s.whatsapp.net'; 
let groupCommandsEnabled = true;
let isAntiLinkEnabled = true;
let isWordFilterEnabled = true;
let isAntiSpamEnabled = false;
let isAntiPrefixEnabled = true;
const arabicPrefixes = [
    '20', '212', '213', '216', '218', '222', '249', '961', '962', '963', '964', '965', 
    '966', '967', '968', '970', '971', '973', '974'
];
const botVersion = '1.2.0';
let botMode = 'activo';
const OFFENSIVE_WORDS = ['puta', 'mierda', 'gilipollas', 'cabrón', 'estúpido', 'pendejo', 'imbécil', 'idiota', 'culiao', 'conchetumare'];
const GROUP_WELCOME_MESSAGE = (name) => {
    const now = new Date();
    const weekday = now.toLocaleString('es-ES', { weekday: 'long' });
    const date = now.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    const time = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    return `
👋 ¡Bienvenido/a, ${name}!
Me uno al grupo el ${weekday}, ${date} a las ${time}.
Por favor, lee las reglas y si tienes alguna duda, usa ~menu para ver mis comandos.`
};

// NUEVO: Estados de los comandos
const COMMAND_STATUS = {
    'dado': true,
    '8ball': true,
    'abrir': true,
    'cerrar': true,
    'tag': true,
    'kick': true,
    'promover': true,
    'limpiar': true,
    'anuncio': true
};

const isRemoteConsoleEnabled = true;
const remoteConsoleJid = '595984495031@s.whatsapp.net';

module.exports = {
    CREATOR_JID,
    groupCommandsEnabled,
    isAntiLinkEnabled,
    isWordFilterEnabled,
    isWelcomeMessageEnabled,
    isAntiSpamEnabled,
    isAntiPrefixEnabled,
    arabicPrefixes,
    botVersion,
    botMode,
    OFFENSIVE_WORDS,
    GROUP_WELCOME_MESSAGE,
    COMMAND_STATUS,
    isRemoteConsoleEnabled,
    remoteConsoleJid
};