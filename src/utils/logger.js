const CREATOR_JID = '595982846939@s.whatsapp.net';
const OFFENSIVE_WORDS = ['puta', 'mierda', 'carajo', 'pendejo', 'imbecil', 'cabron'];
const isAntiLinkEnabled = true;
const isWordFilterEnabled = true;
const isAntiSpamEnabled = false;
const isAntiPrefixEnabled = false;
const arabicPrefixes = ['212', '966', '967', '968', '970', '971', '972', '973', '974', '975', '976', '977', '978', '979', '980']; // Ejemplo de prefijos para filtrar
const botMode = 'public'; // 'public' o 'private'
const botVersion = '1.0.0';
const isCreator = (jid) => jid === CREATOR_JID;
const groupCommandsEnabled = true; // Variable añadida aquí

module.exports = {
  CREATOR_JID,
  OFFENSIVE_WORDS,
  isAntiLinkEnabled,
  isWordFilterEnabled,
  isAntiSpamEnabled,
  botMode,
  botVersion,
  isAntiPrefixEnabled,
  arabicPrefixes,
  isCreator,
  groupCommandsEnabled
};