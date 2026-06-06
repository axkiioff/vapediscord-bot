import { Events, GuildBan, EmbedBuilder, AuditLogEvent } from "discord.js";
import { sendLog } from "../lib/logger.js";

export const name = Events.GuildBanAdd;

export async function execute(ban: GuildBan) {
  const { guild, user } = ban;

  // Fetch audit log to get the moderator
  let moderator = "Unknown";
  let reason = ban.reason ?? "No reason provided";
  try {
    const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 1 });
    const entry = logs.entries.first();
    if (entry && entry.target?.id === user.id && Date.now() - entry.createdTimestamp < 5000) {
      moderator = entry.executor ? `<@${entry.executor.id}> (${entry.executor.tag})` : "Unknown";
      reason = entry.reason ?? reason;
    }
  } catch {}

  const embed = new EmbedBuilder()
    .setColor(0xe74c3c)
    .setTitle("🔨  Member Banned")
    .setThumbnail(user.displayAvatarURL())
    .addFields(
      { name: "User", value: `<@${user.id}> (${user.tag})`, inline: true },
      { name: "Moderator", value: moderator, inline: true },
      { name: "Reason", value: reason }
    )
    .setTimestamp();

  await sendLog(guild, embed);
}
