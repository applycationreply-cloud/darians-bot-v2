const TRANSLATION_MAP = new Map([
  ['Manage', 'Verwalte'],
  ['Configure', 'Konfiguriere'],
  ['Set up', 'Richte ein'],
  ['Set', 'Setze'],
  ['View', 'Zeige'],
  ['Open', 'Öffne'],
  ['Create', 'Erstelle'],
  ['Delete', 'Lösche'],
  ['Remove', 'Entferne'],
  ['Add', 'Füge hinzu'],
  ['Amount', 'Betrag'],
  ['User', 'Benutzer'],
  ['user', 'Benutzer'],
  ['Member', 'Mitglied'],
  ['member', 'Mitglied'],
  ['Channel', 'Kanal'],
  ['channel', 'Kanal'],
  ['Role', 'Rolle'],
  ['role', 'Rolle'],
  ['Message', 'Nachricht'],
  ['message', 'Nachricht'],
  ['Server', 'Server'],
  ['server', 'Server'],
  ['Welcome', 'Willkommen'],
  ['welcome', 'Willkommen'],
  ['Goodbye', 'Abschied'],
  ['goodbye', 'Abschied'],
  ['Verify', 'Verifiziere'],
  ['verify', 'verifiziere'],
  ['Verification', 'Verifizierung'],
  ['verification', 'Verifizierung'],
  ['Economy', 'Wirtschaft'],
  ['economy', 'Wirtschaft'],
  ['Inventory', 'Inventar'],
  ['inventory', 'Inventar'],
  ['Leaderboard', 'Bestenliste'],
  ['leaderboard', 'Bestenliste'],
  ['Rank', 'Rang'],
  ['rank', 'Rang'],
  ['Leveling', 'Leveling'],
  ['leveling', 'Leveling'],
  ['Ticket', 'Ticket'],
  ['Tickets', 'Tickets'],
  ['ticket', 'Ticket'],
  ['Channel', 'Kanal'],
  ['channel', 'Kanal'],
  ['Shop', 'Shop'],
  ['shop', 'Shop'],
  ['Daily', 'Täglich'],
  ['daily', 'täglich'],
  ['Amount', 'Betrag'],
  ['amount', 'Betrag'],
  ['Search', 'Suche'],
  ['search', 'Suche'],
  ['Role', 'Rolle'],
  ['role', 'Rolle'],
  ['Announcement', 'Ankündigung'],
  ['announcement', 'Ankündigung'],
  ['Activity', 'Aktivität'],
  ['activity', 'Aktivität'],
  ['Watch', 'Beobachte'],
  ['watch', 'beobachte'],
  ['Auto', 'Auto'],
  ['Automatic', 'Automatisch'],
  ['automatic', 'automatisch'],
  ['Dashboard', 'Dashboard'],
  ['dashboard', 'Dashboard'],
  ['Support', 'Support'],
  ['Help', 'Hilfe'],
  ['help', 'Hilfe'],
  ['Application', 'Anwendung'],
  ['application', 'Anwendung'],
  ['Settings', 'Einstellungen'],
  ['settings', 'Einstellungen'],
  ['Channel', 'Kanal'],
  ['channel', 'Kanal'],
  ['List', 'Liste'],
  ['list', 'Liste'],
  ['Member', 'Mitglied'],
  ['member', 'Mitglied'],
  ['Reason', 'Grund'],
  ['reason', 'Grund'],
  ['Profile', 'Profil'],
  ['profile', 'Profil'],
  ['Time', 'Zeit'],
  ['time', 'Zeit'],
  ['Location', 'Ort'],
  ['location', 'Ort']
]);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function translateToGerman(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return text;
  }

  let translated = text;

  for (const [from, to] of TRANSLATION_MAP.entries()) {
    const pattern = new RegExp(`\\b${escapeRegExp(from)}\\b`, 'g');
    translated = translated.replace(pattern, to);
  }

  const phraseReplacements = [
    ['Manage the', 'Verwalte das'],
    ['Manage', 'Verwalte'],
    ['Configure the', 'Konfiguriere das'],
    ['Configure', 'Konfiguriere'],
    ['Set up the', 'Richte das'],
    ['Set up', 'Richte ein'],
    ['Set the', 'Setze das'],
    ['Set', 'Setze'],
    ['View the', 'Zeige die'],
    ['View your', 'Zeige dein'],
    ['View', 'Zeige'],
    ['Open the', 'Öffne das'],
    ['Open', 'Öffne'],
    ['Create a', 'Erstelle ein'],
    ['Create', 'Erstelle'],
    ['Delete a', 'Lösche ein'],
    ['Delete', 'Lösche'],
    ['Remove a', 'Entferne ein'],
    ['Remove', 'Entferne'],
    ['Add a', 'Füge ein'],
    ['Add', 'Füge hinzu'],
    ['Amount to', 'Betrag für'],
    ['The', 'Der'],
    ['A', 'Ein'],
    ['An', 'Ein'],
    ['Show', 'Zeige'],
    ['Show the', 'Zeige das'],
    ['Show all', 'Zeige alle'],
    ['Manage', 'Verwalte'],
    ['Command', 'Befehl'],
    ['Commands', 'Befehle'],
    ['Server', 'Server'],
  ];

  for (const [from, to] of phraseReplacements) {
    translated = translated.replace(new RegExp(escapeRegExp(from), 'gi'), to);
  }

  return translated;
}

function translateOption(option) {
  if (!option || typeof option !== 'object') {
    return;
  }

  if (option.description && typeof option.description === 'string') {
    if (typeof option.setDescription === 'function') {
      option.setDescription(translateToGerman(option.description));
    } else {
      option.description = translateToGerman(option.description);
    }
  }

  if (Array.isArray(option.choices)) {
    option.choices = option.choices.map((choice) => {
      if (!choice || typeof choice !== 'object') return choice;
      return {
        ...choice,
        name: typeof choice.name === 'string' ? translateToGerman(choice.name) : choice.name,
      };
    });
  }

  if (Array.isArray(option.options)) {
    option.options.forEach(translateOption);
  }
}

export function translateCommandData(commandData) {
  if (!commandData || typeof commandData !== 'object') {
    return;
  }

  try {
    if (commandData.description && typeof commandData.setDescription === 'function') {
      commandData.setDescription(translateToGerman(commandData.description));
    }

    if (Array.isArray(commandData.options)) {
      commandData.options.forEach(translateOption);
    }
  } catch (error) {
    // Keep going if translation cannot be applied.
  }
}
