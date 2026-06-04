import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  Colors,
  ChannelType,
} from "discord.js";
import { ensureGuild, setGuildSetting } from "../lib/db.js";

const CHANNEL_TYPES = [
  { name: "Ticket Logs", value: "ticket_logs_channel_id", category: false },
  { name: "Ticket Category (folder for tickets)", value: "ticket_category_id", category: true },
  { name: "Staff Alerts", value: "staff_channel_id", category: false },
  { name: "Reports (daily/monthly)", value: "report_channel_id", category: false },
];

export const data = new SlashCommandBuilder()
  .setName("setchannel")
  .setDescription("Set a channel or category for a specific bot feature")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addStringOption((opt) =>
    opt
      .setName("type")
      .setDescription("What this channel is used for")
      .setRequired(true)
      .addChoices(
        ...CHANNEL_TYPES.map((t) => ({ name: t.name, value: t.value }))
      )
  )
  .addChannelOption((opt) =>
    opt
      .setName("channel")
      .setDescription("The channel or category to assign")
      .setRequired(true)
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildCategory)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId!;
  ensureGuild(guildId);

  const type = interaction.options.getString("type", true);
  const channel = interaction.options.getChannel("channel", true);
  const label = CHANNEL_TYPES.find((t) => t.value === type)?.name ?? type;

  setGuildSetting(guildId, type, channel.id);

  const embed = new EmbedBuilder()
    .setColor(Colors.Green)
    .setDescription(`**${label}** set to <#${channel.id}>`);

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
