import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  Colors,
} from "discord.js";
import {
  ensureGuild,
  addUserPermission,
  addRolePermission,
} from "../lib/db.js";
import { VALID_DISCORD_PERMS, isValidPermission } from "../lib/permissions.js";

export const data = new SlashCommandBuilder()
  .setName("addpermission")
  .setDescription("Grant a permission to a user or role")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand((sub) =>
    sub
      .setName("user")
      .setDescription("Add permission to a user")
      .addUserOption((opt) =>
        opt.setName("target").setDescription("The user").setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName("permission")
          .setDescription("Permission to grant")
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
      .setDescription("Add permission to a role")
      .addRoleOption((opt) =>
        opt.setName("target").setDescription("The role").setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName("permission")
          .setDescription("Permission to grant")
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
    addUserPermission(guildId, user.id, permission);

    const embed = new EmbedBuilder()
      .setColor(Colors.Green)
      .setDescription(
        `Granted \`${permission.replace(/_/g, " ")}\` to <@${user.id}>`
      );
    return interaction.reply({ embeds: [embed] });
  }

  if (sub === "role") {
    const role = interaction.options.getRole("target", true);
    addRolePermission(guildId, role.id, permission);

    const embed = new EmbedBuilder()
      .setColor(Colors.Green)
      .setDescription(
        `Granted \`${permission.replace(/_/g, " ")}\` to <@&${role.id}>`
      );
    return interaction.reply({ embeds: [embed] });
  }
}
