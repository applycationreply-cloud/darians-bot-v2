import {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} from "discord.js";
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { createEmbed } from "../../utils/embeds.js";
import {
    createSelectMenu,
} from "../../utils/components.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CATEGORY_SELECT_ID = "help-category-select";
const ALL_COMMANDS_ID = "help-all-commands";
const BUG_REPORT_BUTTON_ID = "help-bug-report";
const HELP_MENU_TIMEOUT_MS = 5 * 60 * 1000;

const CATEGORY_ICONS = {
    Core: "ℹ️",
    Moderation: "🛡️",
    Economy: "💰",
    Fun: "🎮",
    Leveling: "📊",
    Utility: "🔧",
    Ticket: "🎫",
    Welcome: "👋",
    Giveaway: "🎉",
    Counter: "🔢",
    Tools: "🛠️",
    Search: "🔍",
    Reaction_Roles: "🎭",
    Community: "👥",
    Birthday: "🎂",
    Config: "⚙️",
};





export async function createInitialHelpMenu(client) {
    const commandsPath = path.join(__dirname, "../../commands");
    const categoryDirs = (
        await fs.readdir(commandsPath, { withFileTypes: true })
    )
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name)
        .sort();

    const options = [
        {
            label: "📋 Alle Befehle",
            description: "Zeige alle verfügbaren Befehle mit Seiten",
            value: ALL_COMMANDS_ID,
        },
        ...categoryDirs.map((category) => {
            const categoryName =
                category.charAt(0).toUpperCase() +
                category.slice(1).toLowerCase();
            const icon = CATEGORY_ICONS[categoryName] || "🔍";
            return {
                label: `${icon} ${categoryName}`,
                description: `Zeigt die Befehle der Kategorie ${categoryName} an`,
                value: category,
            };
        }),
    ];

    const botName = client?.user?.username || "Bot";
    const embed = createEmbed({ 
        title: `🤖 ${botName} Hilfezentrum`,
        description: "Dein vielseitiger Discord-Bot für Moderation, Wirtschaft, Spaß und Serververwaltung.",
        color: 'primary'
    });

    embed.addFields(
        {
            name: "🛡️ **Moderation**",
            value: "Servermoderation, Benutzerverwaltung und Durchsetzungstools",
            inline: true
        },
        {
            name: "💰 **Economy**",
            value: "Währungssystem, Shops und virtuelle Wirtschaft",
            inline: true
        },
        {
            name: "🎮 **Fun**",
            value: "Spiele, Unterhaltung und interaktive Befehle",
            inline: true
        },
        {
            name: "📊 **Leveling**",
            value: "Benutzerlevel, XP-System und Fortschrittsverfolgung",
            inline: true
        },
        {
            name: "🎫 **Tickets**",
            value: "Support-Ticket-System für Serververwaltung",
            inline: true
        },
        {
            name: "🎉 **Giveaways**",
            value: "Automatisierte Giveaway-Verwaltung und Verteilung",
            inline: true
        },
        {
            name: "👋 **Welcome**",
            value: "Mitgliederbegrüßung und Onboarding",
            inline: true
        },
        {
            name: "🎂 **Birthdays**",
            value: "Geburtstagsüberwachung und Feierfunktionen",
            inline: true
        },
        {
            name: "👥 **Community**",
            value: "Community-Tools, Bewerbungen und Mitgliedereinbindung",
            inline: true
        },
        {
            name: "⚙️ **Config**",
            value: "Server- und Bot-Konfigurationsverwaltung",
            inline: true
        },
        {
            name: "🔢 **Counter**",
            value: "Live-Zählerkanal-Erstellung und Steuerung",
            inline: true
        },
        {
            name: "🎙️ **Join to Create**",
            value: "Dynamische Sprachkanalerstellung und -verwaltung",
            inline: true
        },
        {
            name: "🎭 **Reaction Roles**",
            value: "Selbstzuweisbare Rollen mit Reaktionsrollen",
            inline: true
        },
        {
            name: "✅ **Verification**",
            value: "Mitgliederverifizierung und Zugangskontrolle",
            inline: true
        },
        {
            name: "🔧 **Utilities**",
            value: "Nützliche Werkzeuge und Serverhilfen",
            inline: true
        }
    );

    embed.setFooter({ 
        text: "Titan Bot" 
    });
    embed.setTimestamp();

    const bugReportButton = new ButtonBuilder()
        .setCustomId(BUG_REPORT_BUTTON_ID)
        .setLabel("Fehler melden")
        .setStyle(ButtonStyle.Danger);

    const supportButton = new ButtonBuilder()
        .setLabel("Support-Server")
        .setURL("https://discord.gg/QnWNz2dKCE")
        .setStyle(ButtonStyle.Link);

    const touchpointButton = new ButtonBuilder()
        .setLabel("Mehr erfahren")
        .setURL("https://www.youtube.com/@TouchDisc")
        .setStyle(ButtonStyle.Link);

    const selectRow = createSelectMenu(
        CATEGORY_SELECT_ID,
        "Wähle, um die Befehle anzuzeigen",
        options,
    );

    const buttonRow = new ActionRowBuilder().addComponents([
        bugReportButton,
        supportButton,
        touchpointButton,
    ]);

    return {
        embeds: [embed],
        components: [buttonRow, selectRow],
    };
}

export default {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Zeigt das Hilfemenü mit allen verfügbaren Befehlen an"),

    async execute(interaction, guildConfig, client) {
        
        const { MessageFlags } = await import('discord.js');
        await InteractionHelper.safeDefer(interaction);
        
        const { embeds, components } = await createInitialHelpMenu(client);

        await InteractionHelper.safeEditReply(interaction, {
            embeds,
            components,
        });

        setTimeout(async () => {
            try {
                const closedEmbed = createEmbed({
                    title: "Hilfemenü geschlossen",
                    description: "Das Hilfemenü wurde geschlossen. Verwende /help erneut.",
                    color: "secondary",
                });

                await InteractionHelper.safeEditReply(interaction, {
                    embeds: [closedEmbed],
                    components: [],
                });
            } catch (error) {
                
            }
        }, HELP_MENU_TIMEOUT_MS);
    },
};


