import { Events, GuildBan, EmbedBuilder, AuditLogEvent } from "discord.js";
import { sendLog } from "../lib/logger.js";

export const name = Events.GuildBanRemove;

export async function execute(ban: GuildBan) {
  const { guild, user } = ban;

  let moderator = "Unknown";
  try {
    const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanRemove, limit: 1 });
    const entry = logs.entries.first();
    if (entry && entry.target?.id === user.id && Date.now() - entry.createdTimestamp < 5000) {
      moderator = entry.executor ? `<@${entry.executor.id}> (${entry.executor.tag})` : "Unknown";
    }
  } catch {}

  const embed = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle("✅  Member Unbanned")
    .setThumbnail(user.displayAvatarURL())
    .addFields(
      { name: "User", value: `<@${user.id}> (${user.tag})`, inline: true },
      { name: "Unbanned by", value: moderator, inline: true }
    )
    .setTimestamp();

  await sendLog(guild, embed);
}
