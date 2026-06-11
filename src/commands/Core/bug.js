import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import { createEmbed } from '../../utils/embeds.js';

import { InteractionHelper } from '../../utils/interactionHelper.js';
export default {
    data: new SlashCommandBuilder()
        .setName("bug")
        .setDescription("Meldet einen Fehler oder ein Problem mit dem Bot"),

    async execute(interaction) {
        const githubButton = new ButtonBuilder()
            .setLabel('🐛 Melde einen Fehler')
            .setStyle(ButtonStyle.Link)
            .setURL('https://discord.gg/x8uVW3wK34');

        const row = new ActionRowBuilder().addComponents(githubButton);

        const bugReportEmbed = createEmbed({
            title: '🐛 Fehler melden',
            description: 'Hast du einen Fehler gefunden? Bitte melde ihn auf unserer GitHub-Issue-Seite!\n\n' +
            '**Bitte gib beim Melden eines Fehlers folgendes an:**\n' +
            '• 📝 Eine detaillierte Beschreibung des Problems\n' +
            '• 📋 Schritte zur Reproduktion\n' +
            '• 📸 Screenshots, falls vorhanden\n' +
            '• 💻 Deine Bot-Version und Umgebung\n\n' +
            'Das hilft uns, Probleme schneller und effizienter zu beheben!',
            color: 'error'
        })
            .setTimestamp();

        await InteractionHelper.safeReply(interaction, {
            embeds: [bugReportEmbed],
            components: [row],
        });
    },
};




