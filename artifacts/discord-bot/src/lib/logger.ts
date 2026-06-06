import { Guild, EmbedBuilder, TextChannel } from "discord.js";
import { getGuildSettings } from "./db.js";

export async function sendLog(guild: Guild, embed: EmbedBuilder) {
  const settings = getGuildSettings(guild.id);
  const logChannelId = (settings as any).log_channel_id as string | undefined;
  if (!logChannelId) return;

  const channel = guild.channels.cache.get(logChannelId) as TextChannel | undefined;
  if (!channel) return;

  await channel.send({ embeds: [embed] }).catch(() => null);
}
