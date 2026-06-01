import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  Colors,
  ChannelType,
} from "discord.js";
import { ensureGuild, setGuildSetting } from "../lib/db.js";

export const data = new SlashCommandBuilder()
  .setName("setstaffchannel")
  .setDescription("Set the channel where staff alerts will be sent")
  .addChannelOption((opt) =>
    opt
      .setName("channel")
      .setDescription("The staff alert channel")
      .setRequired(true)
      .addChannelTypes(ChannelType.GuildText)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId!;
  ensureGuild(guildId);

  const channel = interaction.options.getChannel("channel", true);
  setGuildSetting(guildId, "staff_channel_id", channel.id);

  const embed = new EmbedBuilder()
    .setColor(Colors.Green)
    .setDescription(`Staff alerts will now be sent to <#${channel.id}>`);

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
