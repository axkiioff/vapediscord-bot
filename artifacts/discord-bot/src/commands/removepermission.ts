import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  Colors,
} from "discord.js";
import {
  ensureGuild,
  removeUserPermission,
  removeRolePermission,
} from "../lib/db.js";
import { VALID_DISCORD_PERMS, isValidPermission } from "../lib/permissions.js";

export const data = new SlashCommandBuilder()
  .setName("removepermission")
  .setDescription("Remove a permission from a user or role")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand((sub) =>
    sub
      .setName("user")
      .setDescription("Remove permission from a user")
      .addUserOption((opt) =>
        opt.setName("target").setDescription("The user").setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName("permission")
          .setDescription("Permission to remove")
          .setRequired(true)
          .addChoices(
            ...Object.keys(VALID_DISCORD_PERMS).map((p) => ({
              name: p.replace(/_/g, " "),
              value: p,
            }))
          )
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("role")
      .setDescription("Remove permission from a role")
      .addRoleOption((opt) =>
        opt.setName("target").setDescription("The role").setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName("permission")
          .setDescription("Permission to remove")
          .setRequired(true)
          .addChoices(
            ...Object.keys(VALID_DISCORD_PERMS).map((p) => ({
              name: p.replace(/_/g, " "),
              value: p,
            }))
          )
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId!;
  ensureGuild(guildId);

  const sub = interaction.options.getSubcommand();
  const permission = interaction.options.getString("permission", true);

  if (!isValidPermission(permission)) {
    return interaction.reply({
      content: "That's not a valid permission.",
      ephemeral: true,
    });
  }

  if (sub === "user") {
    const user = interaction.options.getUser("target", true);
    removeUserPermission(guildId, user.id, permission);

    const embed = new EmbedBuilder()
      .setColor(Colors.Orange)
      .setDescription(
        `Removed \`${permission.replace(/_/g, " ")}\` from <@${user.id}>`
      );
    return interaction.reply({ embeds: [embed] });
  }

  if (sub === "role") {
    const role = interaction.options.getRole("target", true);
    removeRolePermission(guildId, role.id, permission);

    const embed = new EmbedBuilder()
      .setColor(Colors.Orange)
      .setDescription(
        `Removed \`${permission.replace(/_/g, " ")}\` from <@&${role.id}>`
      );
    return interaction.reply({ embeds: [embed] });
  }
}
