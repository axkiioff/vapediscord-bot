import { Guild, TextChannel, EmbedBuilder, Colors } from "discord.js";
import { getGuildSettings } from "./db.js";

interface JoinRecord {
  userId: string;
  timestamp: number;
}

const joinTracker = new Map<string, JoinRecord[]>();
const JOIN_WINDOW_MS = 10_000;
const RAID_THRESHOLD = 8;

export function trackJoin(guild: Guild, userId: string): boolean {
  const now = Date.now();
  const records = joinTracker.get(guild.id) ?? [];
  records.push({ userId, timestamp: now });

  const recent = records.filter((r) => now - r.timestamp < JOIN_WINDOW_MS);
  joinTracker.set(guild.id, recent);

  return recent.length >= RAID_THRESHOLD;
}

export async function sendRaidAlert(
  guild: Guild,
  description: string,
  joinCount?: number
) {
  const settings = getGuildSettings(guild.id);
  const channelId = settings?.staff_channel_id;
  if (!channelId) return;

  const channel = guild.channels.cache.get(channelId) as TextChannel | undefined;
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor(Colors.Red)
    .setTitle("⚠️ Raid Alert")
    .setDescription(description)
    .setTimestamp();

  if (joinCount !== undefined) {
    embed.addFields({ name: "Joins in last 10s", value: `${joinCount}`, inline: true });
  }

  await channel.send({ embeds: [embed] }).catch(() => null);
}

export async function sendStaffAlert(
  guild: Guild,
  title: string,
  description: string,
  color: number = Colors.Orange
) {
  const settings = getGuildSettings(guild.id);
  const channelId = settings?.staff_channel_id;
  if (!channelId) return;

  const channel = guild.channels.cache.get(channelId) as TextChannel | undefined;
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();

  await channel.send({ embeds: [embed] }).catch(() => null);
}
