import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  Colors,
} from "discord.js";
import {
  ensureGuild,
  getGuildSettings,
  getAllProtections,
  getBlacklistedWords,
  getAllRateLimits,
  getAllUserPermissions,
  getAllRolePermissions,
} from "../lib/db.js";

export const data = new SlashCommandBuilder()
  .setName("settings")
  .setDescription("View all bot settings for this server")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId!;
  ensureGuild(guildId);

  const settings = getGuildSettings(guildId);
  const protections = getAllProtections(guildId);
  const words = getBlacklistedWords(guildId);
  const rateLimits = getAllRateLimits(guildId);
  const userPerms = getAllUserPermissions(guildId);
  const rolePerms = getAllRolePermissions(guildId);

  const FEATURE_LABELS: Record<string, string> = {
    antilink: "Anti-Link",
    anti_create_channel: "Anti Create Channel",
    anti_delete_channel: "Anti Delete Channel",
    anti_ban: "Anti Ban",
    anti_kick: "Anti Kick",
    anti_create_role: "Anti Create Role",
    anti_delete_role: "Anti Delete Role",
  };

  const protectionLines = Object.entries(FEATURE_LABELS).map(([key, label]) => {
    const row = protections.find((p) => p.feature === key);
    const status = row?.enabled ? "✅ ON" : "❌ OFF";
    return `${status} — ${label}`;
  });

  const rateLimitLines =
    rateLimits.length > 0
      ? rateLimits.map(
          (r) =>
            `**${r.action.replace(/_/g, " ")}** — max ${r.limit_count} per 10min (${r.limit_target})`
        )
      : ["None set"];

  const wordLine =
    words.length > 0
      ? words.map((w) => `\`${w}\``).join(", ")
      : "None";

  const staffChannelLine = settings?.staff_channel_id
    ? `<#${settings.staff_channel_id}>`
    : "Not set — use `/setstaffchannel`";

  const prefixLine = settings?.prefix ?? "/";

  const userPermLines =
    userPerms.length > 0
      ? [...new Set(userPerms.map((u) => `<@${u.user_id}>`))]
          .slice(0, 10)
          .join(", ")
      : "None";

  const rolePermLines =
    rolePerms.length > 0
      ? [...new Set(rolePerms.map((r) => `<@&${r.role_id}>`))]
          .slice(0, 10)
          .join(", ")
      : "None";

  const embed = new EmbedBuilder()
    .setColor(Colors.Blurple)
    .setTitle(`Settings — ${interaction.guild!.name}`)
    .addFields(
      { name: "Prefix", value: prefixLine, inline: true },
      { name: "Staff Channel", value: staffChannelLine, inline: true },
      { name: "\u200b", value: "\u200b", inline: false },
      { name: "Protections", value: protectionLines.join("\n"), inline: false },
      { name: "Rate Limits", value: rateLimitLines.join("\n"), inline: false },
      { name: "Blacklisted Words", value: wordLine, inline: false },
      { name: "Users with custom perms", value: userPermLines, inline: true },
      { name: "Roles with custom perms", value: rolePermLines, inline: true }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
