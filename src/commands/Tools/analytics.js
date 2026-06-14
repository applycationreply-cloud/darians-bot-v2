import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { createEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { logger } from '../../utils/logger.js';

export default {
    data: new SlashCommandBuilder()
        .setName('analytics')
        .setDescription('Zeige Analyse-Statistiken des Servers')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    category: 'Tools',

    async execute(interaction) {
        const deferSuccess = await InteractionHelper.safeDefer(interaction);
        if (!deferSuccess) return;

        try {
            const guild = interaction.guild;
            const client = interaction.client;

            // Member Statistics
            const members = await guild.members.fetch();
            const users = members.filter(m => !m.user.bot).size;
            const bots = members.filter(m => m.user.bot).size;
            const onlineMembers = members.filter(m => m.presence?.status === 'online').size;
            const idleMembers = members.filter(m => m.presence?.status === 'idle').size;
            const dndMembers = members.filter(m => m.presence?.status === 'dnd').size;

            // Channel Statistics
            const channels = guild.channels.cache;
            const textChannels = channels.filter(c => c.isTextBased()).size;
            const voiceChannels = channels.filter(c => c.isVoiceBased()).size;
            const categories = channels.filter(c => c.isCategory()).size;

            // Role Statistics
            const roles = guild.roles.cache;
            const customRoles = roles.size - 1; // Exclude @everyone

            // Message Activity (sample from last 24h in first 5 text channels)
            let messageCount = 0;
            const sampleChannels = channels.filter(c => c.isTextBased()).first(5) || [];
            
            for (const channel of sampleChannels) {
                try {
                    const messages = await channel.messages.fetch({ limit: 100 });
                    const recent = messages.filter(m => {
                        const age = Date.now() - m.createdTimestamp;
                        return age < 24 * 60 * 60 * 1000; // Last 24h
                    });
                    messageCount += recent.size;
                } catch (e) {
                    // Channel access denied
                }
            }

            // Server Age
            const createdDaysAgo = Math.floor((Date.now() - guild.createdTimestamp) / (1000 * 60 * 60 * 24));

            // Create embeds
            const memberEmbed = createEmbed({
                title: '👥 Mitglieder-Statistiken',
                description:
                    `• **Gesamt:** ${members.size}\n` +
                    `• **Benutzer:** ${users}\n` +
                    `• **Bots:** ${bots}\n` +
                    `• **Online:** ${onlineMembers}\n` +
                    `• **Abwesend:** ${idleMembers}\n` +
                    `• **Bitte nicht stören:** ${dndMembers}`,
                color: 'info'
            });

            const channelEmbed = createEmbed({
                title: '📢 Kanal-Statistiken',
                description:
                    `• **Text-Kanäle:** ${textChannels}\n` +
                    `• **Sprach-Kanäle:** ${voiceChannels}\n` +
                    `• **Kategorien:** ${categories}\n` +
                    `• **Gesamt-Kanäle:** ${channels.size}`,
                color: 'info'
            });

            const activityEmbed = createEmbed({
                title: '📊 Aktivitäts-Statistiken',
                description:
                    `• **Rollen:** ${customRoles}\n` +
                    `• **Nachrichten (24h):** ~${messageCount}\n` +
                    `• **Server-Alter:** ${createdDaysAgo} Tage\n` +
                    `• **Gründungsdatum:** <t:${Math.floor(guild.createdTimestamp / 1000)}:D>`,
                color: 'info'
            });

            const boostEmbed = createEmbed({
                title: '⭐ Server-Boosts',
                description:
                    `• **Boost-Level:** ${guild.premiumTier}\n` +
                    `• **Boosts:** ${guild.premiumSubscriptionCount}\n` +
                    `• **Max. Bitrate:** ${guild.maximumBitrate / 1000}kbps`,
                color: 'info'
            });

            // Add header
            memberEmbed.setAuthor({
                name: `${guild.name} Analytics`,
                iconURL: guild.iconURL({ dynamic: true })
            });

            await InteractionHelper.safeEditReply(interaction, {
                embeds: [memberEmbed, channelEmbed, activityEmbed, boostEmbed]
            });
        } catch (error) {
            logger.error('Analytics command error:', error);
            await InteractionHelper.safeEditReply(interaction, {
                embeds: [createEmbed({
                    title: '❌ Fehler',
                    description: 'Konnte Analysen nicht abrufen. Bitte versuche es später erneut.',
                    color: 'error'
                })]
            });
            throw error;
        }
    }
};
