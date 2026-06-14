import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { createEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import appConfig from '../../config/application.js';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

const OWNER_USERNAME = 'f01g';
const OWNER_USER_ID = '1333821781731184656';
const ENV_FILE_PATH = path.resolve(process.cwd(), '.env');

function getAllowedGuildsFromEnv(content) {
  const lines = content.split(/\r?\n/);
  const line = lines.find(line => line.trim().startsWith('ALLOWED_GUILDS='));
  if (!line) return [];
  return line
    .split('=')[1]
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

async function readAllowedGuilds() {
  try {
    const content = await readFile(ENV_FILE_PATH, 'utf8');
    return getAllowedGuildsFromEnv(content);
  } catch (error) {
    return [];
  }
}

async function writeAllowedGuilds(guildIds) {
  const normalized = guildIds.join(',');
  let content = '';

  try {
    content = await readFile(ENV_FILE_PATH, 'utf8');
  } catch (error) {
    content = '';
  }

  const lines = content.split(/\r?\n/);
  let found = false;
  const updatedLines = lines.map((line) => {
    if (line.trim().startsWith('ALLOWED_GUILDS=')) {
      found = true;
      return `ALLOWED_GUILDS=${normalized}`;
    }
    return line;
  });

  if (!found) {
    if (updatedLines.length && updatedLines[updatedLines.length - 1].trim() !== '') {
      updatedLines.push('');
    }
    updatedLines.push(`ALLOWED_GUILDS=${normalized}`);
  }

  await writeFile(ENV_FILE_PATH, updatedLines.join('\n'), 'utf8');
}

function isAuthorizedOwner(interaction) {
  return interaction.user?.id === OWNER_USER_ID && interaction.user?.username === OWNER_USERNAME;
}

function getCurrentAllowedGuilds() {
  return Array.isArray(appConfig.bot.allowedGuilds) ? appConfig.bot.allowedGuilds : [];
}

function updateRuntimeAllowedGuilds(guilds) {
  if (!Array.isArray(appConfig.bot.allowedGuilds)) {
    appConfig.bot.allowedGuilds = [];
  }
  appConfig.bot.allowedGuilds.length = 0;
  appConfig.bot.allowedGuilds.push(...guilds);
  process.env.ALLOWED_GUILDS = guilds.join(',');
}

export default {
  data: new SlashCommandBuilder()
    .setName('allowedguilds')
    .setDescription('Verwalte erlaubte Server für den Bot')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('add')
        .setDescription('Füge eine erlaubte Guild-ID hinzu')
        .addStringOption((option) =>
          option
            .setName('guildid')
            .setDescription('Die Server-ID, die erlaubt werden soll')
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove')
        .setDescription('Entferne eine erlaubte Guild-ID')
        .addStringOption((option) =>
          option
            .setName('guildid')
            .setDescription('Die Server-ID, die entfernt werden soll')
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('list').setDescription('Zeige alle erlaubten Guild-IDs'),
    ),

  async execute(interaction) {
    await InteractionHelper.safeDefer(interaction, { flags: MessageFlags.Ephemeral });

    if (!isAuthorizedOwner(interaction)) {
      return InteractionHelper.safeEditReply(interaction, {
        embeds: [
          createEmbed({
            title: 'Zugriff verweigert',
            description: 'Du bist nicht berechtigt, diese Einstellungen zu ändern.',
            color: 'error',
          }),
        ],
      });
    }

    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.options.getString('guildid', false)?.trim();

    try {
      let allowedGuilds = await readAllowedGuilds();

      if (subcommand === 'add') {
        if (!guildId) {
          throw new Error('guildid fehlt');
        }
        if (allowedGuilds.includes(guildId)) {
          return InteractionHelper.safeEditReply(interaction, {
            embeds: [
              createEmbed({
                title: 'Bereits erlaubt',
                description: `Guild-ID \`${guildId}\` ist bereits in der Allowlist.`,
                color: 'warning',
              }),
            ],
          });
        }

        allowedGuilds.push(guildId);
        await writeAllowedGuilds(allowedGuilds);
        updateRuntimeAllowedGuilds(allowedGuilds);

        return InteractionHelper.safeEditReply(interaction, {
          embeds: [
            createEmbed({
              title: 'Guild erlaubt',
              description: `Guild-ID \`${guildId}\` wurde zur Allowlist hinzugefügt.`,
              color: 'success',
            }),
          ],
        });
      }

      if (subcommand === 'remove') {
        if (!guildId) {
          throw new Error('guildid fehlt');
        }

        if (!allowedGuilds.includes(guildId)) {
          return InteractionHelper.safeEditReply(interaction, {
            embeds: [
              createEmbed({
                title: 'Nicht gefunden',
                description: `Guild-ID \`${guildId}\` war nicht in der Allowlist enthalten.`,
                color: 'warning',
              }),
            ],
          });
        }

        allowedGuilds = allowedGuilds.filter((id) => id !== guildId);
        await writeAllowedGuilds(allowedGuilds);
        updateRuntimeAllowedGuilds(allowedGuilds);

        return InteractionHelper.safeEditReply(interaction, {
          embeds: [
            createEmbed({
              title: 'Guild entfernt',
              description: `Guild-ID \`${guildId}\` wurde aus der Allowlist entfernt.`,
              color: 'success',
            }),
          ],
        });
      }

      const listText = allowedGuilds.length > 0 ? allowedGuilds.map((id) => `• ${id}`).join('\n') : 'Keine Guild-IDs sind aktuell erlaubt.';
      return InteractionHelper.safeEditReply(interaction, {
        embeds: [
          createEmbed({
            title: 'Erlaubte Guild-IDs',
            description: listText,
            color: 'info',
          }),
        ],
      });
    } catch (error) {
      await InteractionHelper.safeEditReply(interaction, {
        embeds: [
          createEmbed({
            title: 'Fehler',
            description: 'Die Allowlist konnte nicht aktualisiert werden. Bitte prüfe die Server-Logs.',
            color: 'error',
          }),
        ],
      });
      throw error;
    }
  },
};
