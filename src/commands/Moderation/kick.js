import { SlashCommandBuilder, PermissionFlagsBits, PermissionsBitField, ChannelType } from 'discord.js';
import { createEmbed, errorEmbed, successEmbed, infoEmbed, warningEmbed } from '../../utils/embeds.js';
import { logModerationAction } from '../../utils/moderation.js';
import { logger } from '../../utils/logger.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { TitanBotError, ErrorTypes } from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Entferne einen Benutzer vom Server")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("Der Benutzer, der gekickt werden soll")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("Grund für den Kick"),
    )
.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  category: "moderation",

  async execute(interaction, config, client) {
    try {
      
      if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
        throw new TitanBotError(
          "User lacks permission",
          ErrorTypes.PERMISSION,
          "Du hast keine Berechtigung, Mitglieder zu kicken."
        );
      }

      const targetUser = interaction.options.getUser("target");
      const member = interaction.options.getMember("target");
      const reason = interaction.options.getString("reason") || "Kein Grund angegeben";

      
      if (targetUser.id === interaction.user.id) {
        throw new TitanBotError(
          "Cannot kick self",
          ErrorTypes.VALIDATION,
          "Du kannst dich selbst nicht kicken."
        );
      }

      
      if (targetUser.id === client.user.id) {
        throw new TitanBotError(
          "Cannot kick bot",
          ErrorTypes.VALIDATION,
          "Du kannst den Bot nicht kicken."
        );
      }

      
      if (!member) {
        throw new TitanBotError(
          "Target not found",
          ErrorTypes.USER_INPUT,
          "Der Benutzer ist nicht auf diesem Server.",
          { subtype: 'user_not_found' }
        );
      }

      
      if (interaction.member.roles.highest.position <= member.roles.highest.position) {
        throw new TitanBotError(
          "Cannot kick user",
          ErrorTypes.PERMISSION,
          "Du kannst einen Benutzer mit einer gleichen oder höheren Rolle nicht kicken."
        );
      }

      
      if (!member.kickable) {
        throw new TitanBotError(
          "Bot cannot kick",
          ErrorTypes.PERMISSION,
          "Ich kann diesen Benutzer nicht kicken. Überprüfe meine Rollenposition."
        );
      }

      
      await member.kick(reason);

      
      const caseId = await logModerationAction({
        client,
        guild: interaction.guild,
        event: {
          action: "Member Kicked",
          target: `${targetUser.tag} (${targetUser.id})`,
          executor: `${interaction.user.tag} (${interaction.user.id})`,
          reason,
          metadata: {
            userId: targetUser.id,
            moderatorId: interaction.user.id
          }
        }
      });

      
      await InteractionHelper.universalReply(interaction, {
        embeds: [
          successEmbed(
            `👢 **${targetUser.tag} gekickt**`,
            `**Grund:** ${reason}\n**Case ID:** #${caseId}`,
          ),
        ],
      });
    } catch (error) {
      logger.error('Kick command error:', error);
      const errorEmbed_default = errorEmbed(
        "Es ist ein Fehler beim Kicken des Benutzers aufgetreten.",
        error.message || "Konnte den Benutzer nicht kicken"
      );
      await InteractionHelper.universalReply(interaction, { embeds: [errorEmbed_default] });
    }
  }
};



