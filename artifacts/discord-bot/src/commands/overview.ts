import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  Colors,
} from "discord.js";
import { ensureGuild, getGuildSettings, getMonthlyStaffStats } from "../lib/db.js";
import { getPromoStatus } from "../lib/reports.js";

export const data = new SlashCommandBuilder()
  .setName("overview")
  .setDescription("View the promotion overview and activity status for all staff this month")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addUserOption((opt) =>
    opt
      .setName("member")
      .setDescription("Check a specific staff member's detailed stats")
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId!;
  const guild = interaction.guild!;
  ensureGuild(guildId);
  await interaction.deferReply();

  const settings = getGuildSettings(guildId);
  const staffRoleId = settings.staff_role_id;

  const targetUser = interaction.options.getUser("member");

  // Fetch all members if staff role is set
  if (staffRoleId) {
    await guild.members.fetch().catch(() => null);
  }

  const monthlyStats = getMonthlyStaffStats(guildId);

  // Specific member detail view
  if (targetUser) {
    const entry = monthlyStats.find((e) => e.userId === targetUser.id);
    const member = guild.members.cache.get(targetUser.id);
    const name = member?.displayName ?? targetUser.username;

    const score = entry?.score ?? 0;
    const mods = entry?.mods ?? { W: 0, M: 0, K: 0, B: 0, C: 0 };
    const messages = entry?.messages ?? 0;
    const status = getPromoStatus(score);

    const embed = new EmbedBuilder()
      .setColor(Colors.Blurple)
      .setTitle(`Staff Overview — ${name}`)
      .setDescription(`${status.emoji} **${status.label}** — ${status.note}`)
      .addFields(
        { name: "Monthly Score", value: `${score}`, inline: true },
        { name: "Messages", value: `${messages}`, inline: true },
        { name: "\u200b", value: "\u200b", inline: true },
        { name: "Warns (W)", value: `${mods.W}`, inline: true },
        { name: "Mutes (M)", value: `${mods.M}`, inline: true },
        { name: "Kicks (K)", value: `${mods.K}`, inline: true },
        { name: "Bans (B)", value: `${mods.B}`, inline: true },
        { name: "Cmds (C)", value: `${mods.C}`, inline: true },
      )
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }

  // Full server promotion overview
  let staffMembers: { id: string; name: string }[] = [];

  if (staffRoleId) {
    const role = guild.roles.cache.get(staffRoleId);
    if (role) {
      staffMembers = role.members.map((m) => ({ id: m.id, name: m.displayName }));
    }
  } else {
    // Fall back to anyone who has recorded activity
    staffMembers = monthlyStats.map((e) => {
      const member = guild.members.cache.get(e.userId);
      return { id: e.userId, name: member?.displayName ?? `<@${e.userId}>` };
    });
  }

  if (staffMembers.length === 0) {
    return interaction.editReply(
      "No staff members found. Use `/freport setstaffrole` to set your staff role."
    );
  }

  // Build ranked list with status
  const ranked = staffMembers
    .map((s) => {
      const entry = monthlyStats.find((e) => e.userId === s.id);
      const score = entry?.score ?? 0;
      return { ...s, score, status: getPromoStatus(score) };
    })
    .sort((a, b) => b.score - a.score);

  const lines = ranked.map(
    (s) => `• **${s.name}** — ${s.status.emoji} ${s.status.label} — ${s.status.note}`
  );

  // Split into chunks of 20 lines max (Discord embed limit)
  const chunkSize = 20;
  const chunks: string[][] = [];
  for (let i = 0; i < lines.length; i += chunkSize) {
    chunks.push(lines.slice(i, i + chunkSize));
  }

  const embeds = chunks.map((chunk, i) => {
    const embed = new EmbedBuilder()
      .setColor(Colors.Blurple)
      .setTimestamp();

    if (i === 0) {
      embed.setTitle("📋 Promotion Overview");
    }

    embed.setDescription(chunk.join("\n"));
    return embed;
  });

  await interaction.editReply({ embeds: embeds.slice(0, 10) });
}
