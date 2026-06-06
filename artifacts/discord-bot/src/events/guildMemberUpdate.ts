import { Events, GuildMember, PartialGuildMember, EmbedBuilder, AuditLogEvent } from "discord.js";
import { sendLog } from "../lib/logger.js";

export const name = Events.GuildMemberUpdate;

export async function execute(
  oldMember: GuildMember | PartialGuildMember,
  newMember: GuildMember
) {
  const { guild } = newMember;

  // ── Nickname change ────────────────────────────────────────────
  if (oldMember.nickname !== newMember.nickname) {
    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle("📝  Nickname Changed")
      .addFields(
        { name: "User", value: `<@${newMember.id}> (${newMember.user.tag})`, inline: true },
        { name: "Before", value: oldMember.nickname ?? "*None*", inline: true },
        { name: "After", value: newMember.nickname ?? "*None*", inline: true }
      )
      .setTimestamp();
    await sendLog(guild, embed);
  }

  // ── Timeout (mute) ─────────────────────────────────────────────
  const wasTimedOut = oldMember.communicationDisabledUntil == null;
  const isTimedOut = newMember.communicationDisabledUntil != null;
  if (wasTimedOut && isTimedOut) {
    let moderator = "Unknown";
    let reason = "No reason provided";
    try {
      const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberUpdate, limit: 1 });
      const entry = logs.entries.first();
      if (entry && entry.target?.id === newMember.id && Date.now() - entry.createdTimestamp < 5000) {
        moderator = entry.executor ? `<@${entry.executor.id}> (${entry.executor.tag})` : "Unknown";
        reason = entry.reason ?? reason;
      }
    } catch {}

    const until = newMember.communicationDisabledUntil!;
    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle("🔇  Member Timed Out")
      .addFields(
        { name: "User", value: `<@${newMember.id}> (${newMember.user.tag})`, inline: true },
        { name: "Moderator", value: moderator, inline: true },
        { name: "Until", value: `<t:${Math.floor(until.getTime() / 1000)}:F>`, inline: true },
        { name: "Reason", value: reason }
      )
      .setTimestamp();
    await sendLog(guild, embed);
    return;
  }

  // ── Role added/removed ─────────────────────────────────────────
  const oldRoles = oldMember.roles?.cache;
  const newRoles = newMember.roles.cache;
  if (!oldRoles) return;

  const added = newRoles.filter((r) => !oldRoles.has(r.id));
  const removed = oldRoles.filter((r) => !newRoles.has(r.id));

  if (added.size === 0 && removed.size === 0) return;

  let moderator = "Unknown";
  try {
    const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberRoleUpdate, limit: 1 });
    const entry = logs.entries.first();
    if (entry && entry.target?.id === newMember.id && Date.now() - entry.createdTimestamp < 5000) {
      moderator = entry.executor ? `<@${entry.executor.id}> (${entry.executor.tag})` : "Unknown";
    }
  } catch {}

  const embed = new EmbedBuilder()
    .setColor(0x1abc9c)
    .setTitle("🔑  Member Roles Updated")
    .addFields(
      { name: "User", value: `<@${newMember.id}> (${newMember.user.tag})`, inline: true },
      { name: "By", value: moderator, inline: true }
    )
    .setTimestamp();

  if (added.size > 0) embed.addFields({ name: "✅ Roles Added", value: added.map((r) => `<@&${r.id}>`).join(", ") });
  if (removed.size > 0) embed.addFields({ name: "❌ Roles Removed", value: removed.map((r) => `<@&${r.id}>`).join(", ") });

  await sendLog(guild, embed);
}
