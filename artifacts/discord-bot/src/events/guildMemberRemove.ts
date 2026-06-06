import { Events, GuildMember, PartialGuildMember, EmbedBuilder, AuditLogEvent } from "discord.js";
import { sendLog } from "../lib/logger.js";

export const name = Events.GuildMemberRemove;

export async function execute(member: GuildMember | PartialGuildMember) {
  const { guild, user } = member;
  if (!user) return;

  // Check audit log to tell if this was a kick
  let wasKicked = false;
  let moderator = "Unknown";
  let reason = "No reason provided";
  try {
    const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberKick, limit: 1 });
    const entry = logs.entries.first();
    if (entry && entry.target?.id === user.id && Date.now() - entry.createdTimestamp < 5000) {
      wasKicked = true;
      moderator = entry.executor ? `<@${entry.executor.id}> (${entry.executor.tag})` : "Unknown";
      reason = entry.reason ?? reason;
    }
  } catch {}

  const embed = wasKicked
    ? new EmbedBuilder()
        .setColor(0xe67e22)
        .setTitle("👢  Member Kicked")
        .setThumbnail(user.displayAvatarURL())
        .addFields(
          { name: "User", value: `<@${user.id}> (${user.tag})`, inline: true },
          { name: "Moderator", value: moderator, inline: true },
          { name: "Reason", value: reason }
        )
        .setTimestamp()
    : new EmbedBuilder()
        .setColor(0x95a5a6)
        .setTitle("📤  Member Left")
        .setThumbnail(user.displayAvatarURL())
        .addFields(
          { name: "User", value: `<@${user.id}> (${user.tag})`, inline: true },
          { name: "Roles", value: member.roles?.cache?.size > 1
            ? [...(member.roles?.cache?.values() ?? [])]
                .filter((r) => r.id !== guild.roles.everyone.id)
                .map((r) => `<@&${r.id}>`)
                .join(", ") || "None"
            : "None", inline: true }
        )
        .setTimestamp();

  await sendLog(guild, embed);
}
