import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  Colors,
  ChannelType,
  TextChannel,
} from "discord.js";
import { ensureGuild, setGuildSetting, getDailyStaffStats, getMonthlyStaffStats } from "../lib/db.js";
import { buildDailyEmbed, buildMonthlyEmbed } from "../lib/reports.js";

export const data = new SlashCommandBuilder()
  .setName("freport")
  .setDescription("Staff report settings and manual triggers")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand((sub) =>
    sub
      .setName("setchannel")
      .setDescription("Set the channel where daily & monthly staff reports are posted")
      .addChannelOption((opt) =>
        opt
          .setName("channel")
          .setDescription("The report channel")
          .setRequired(true)
          .addChannelTypes(ChannelType.GuildText)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("setstaffrole")
      .setDescription("Set which role counts as staff for activity tracking")
      .addRoleOption((opt) =>
        opt.setName("role").setDescription("The staff role").setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("sendnow")
      .setDescription("Manually send the daily or monthly report right now")
      .addStringOption((opt) =>
        opt
          .setName("type")
          .setDescription("Which report to send")
          .setRequired(true)
          .addChoices(
            { name: "Daily", value: "daily" },
            { name: "Monthly", value: "monthly" }
          )
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId!;
  const guild = interaction.guild!;
  ensureGuild(guildId);

  const sub = interaction.options.getSubcommand();

  if (sub === "setchannel") {
    const channel = interaction.options.getChannel("channel", true);
    setGuildSetting(guildId, "report_channel_id", channel.id);

    const embed = new EmbedBuilder()
      .setColor(Colors.Green)
      .setDescription(
        `Staff reports will be posted to <#${channel.id}> daily at midnight UTC and monthly on the 1st.`
      );
    return interaction.reply({ embeds: [embed] });
  }

  if (sub === "setstaffrole") {
    const role = interaction.options.getRole("role", true);
    setGuildSetting(guildId, "staff_role_id", role.id);

    const embed = new EmbedBuilder()
      .setColor(Colors.Green)
      .setDescription(
        `Staff role set to <@&${role.id}>. Members with this role will have their activity tracked.`
      );
    return interaction.reply({ embeds: [embed] });
  }

  if (sub === "sendnow") {
    const type = interaction.options.getString("type", true);
    const resolveName = (id: string) => {
      const member = guild.members.cache.get(id);
      return member?.displayName ?? `<@${id}>`;
    };

    await interaction.deferReply();

    let embed: EmbedBuilder;
    if (type === "daily") {
      const entries = getDailyStaffStats(guildId);
      embed = buildDailyEmbed(entries, resolveName);
    } else {
      const entries = getMonthlyStaffStats(guildId);
      embed = buildMonthlyEmbed(entries, resolveName);
    }

    await interaction.editReply({ embeds: [embed] });
  }
}
