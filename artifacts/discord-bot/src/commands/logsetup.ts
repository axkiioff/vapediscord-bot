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
  .setName("logsetup")
  .setDescription("Set the channel where all server activity logs are sent")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addChannelOption((opt) =>
    opt
      .setName("channel")
      .setDescription("Channel to send logs to")
      .setRequired(true)
      .addChannelTypes(ChannelType.GuildText)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });
  const guildId = interaction.guildId!;
  ensureGuild(guildId);

  const channel = interaction.options.getChannel("channel", true);
  setGuildSetting(guildId, "log_channel_id", channel.id);

  const embed = new EmbedBuilder()
    .setColor(Colors.Green)
    .setTitle("📋 Log Channel Set")
    .setDescription(`All server activity will now be logged in <#${channel.id}>`)
    .addFields(
      { name: "Logged Events", value:
        "• 🗑️ Deleted messages\n" +
        "• ✏️ Edited messages\n" +
        "• 🔨 Bans & Unbans\n" +
        "• 👢 Kicks\n" +
        "• 📥 Member joins\n" +
        "• 📤 Member leaves\n" +
        "• 🔇 Mutes / Timeouts\n" +
        "• 📝 Nickname changes\n" +
        "• 🔑 Role changes"
      }
    )
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
