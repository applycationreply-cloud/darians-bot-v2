import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { createEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { getColor } from '../../config/bot.js';

function formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts = [];
    if (days) parts.push(`${days}d`);
    if (hours) parts.push(`${hours}h`);
    if (minutes) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);
    return parts.join(' ');
}

export default {
    data: new SlashCommandBuilder()
        .setName('uptime')
        .setDescription('Zeigt an, wie lange der Bot bereits online ist')
        .setDMPermission(false),
    category: 'Core',

    async execute(interaction) {
        const deferSuccess = await InteractionHelper.safeDefer(interaction, { flags: MessageFlags.Ephemeral });
        if (!deferSuccess) return;

        try {
            const client = interaction.client;
            const botUptimeMs = client.uptime ?? 0;
            const processUptimeMs = Math.floor(process.uptime() * 1000);

            const embed = createEmbed({
                title: 'Uptime',
                description:
                    `• Bot online: **${formatDuration(botUptimeMs)}**\n` +
                    `• Prozesslaufzeit: **${formatDuration(processUptimeMs)}**`,
                color: 'info',
            });
            embed.setColor(getColor('info'));

            await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
        } catch (error) {
            await InteractionHelper.safeEditReply(interaction, {
                embeds: [createEmbed({ title: 'Systemfehler', description: 'Konnte die Uptime nicht ermitteln.', color: 'error' })],
            });
            throw error;
        }
    },
};
import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { createEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';

import { InteractionHelper } from '../../utils/interactionHelper.js';
export default {
    data: new SlashCommandBuilder()
    .setName("uptime")
    .setDescription("Check how long the bot has been online"),

  async execute(interaction) {
    try {
      await InteractionHelper.safeDefer(interaction);
      
      let totalSeconds = interaction.client.uptime / 1000;
      let days = Math.floor(totalSeconds / 86400);
      totalSeconds %= 86400;
      let hours = Math.floor(totalSeconds / 3600);
      totalSeconds %= 3600;
      let minutes = Math.floor(totalSeconds / 60);
      let seconds = Math.floor(totalSeconds % 60);

      const uptimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;

      await InteractionHelper.safeEditReply(interaction, {
        embeds: [createEmbed({ 
          title: "⏱️ System Uptime", 
          description: `\`\`\`${uptimeStr}\`\`\`` 
        })],
      });
    } catch (error) {
      logger.error('Uptime command error:', error);
      
      try {
        return await InteractionHelper.safeEditReply(interaction, {
          embeds: [createEmbed({ title: 'System Error', description: 'Could not compute uptime.', color: 'error' })],
          flags: MessageFlags.Ephemeral,
        });
      } catch (replyError) {
        logger.error('Failed to send error reply:', replyError);
      }
    }
  },
};




