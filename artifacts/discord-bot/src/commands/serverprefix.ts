import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  Colors,
} from "discord.js";
import { getGuildSettings, setGuildSetting, ensureGuild } from "../lib/db.js";

export const data = new SlashCommandBuilder()
  .setName("serverprefix")
  .setDescription("Set the bot prefix for this server")
  .addStringOption((opt) =>
    opt
      .setName("prefix")
      .setDescription("The new prefix (e.g. !, ?, $)")
      .setRequired(true)
      .setMaxLength(5)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId!;
  ensureGuild(guildId);

  const prefix = interaction.options.getString("prefix", true);
  setGuildSetting(guildId, "prefix", prefix);

  const embed = new EmbedBuilder()
    .setColor(Colors.Green)
    .setDescription(`Server prefix updated to \`${prefix}\``);

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
