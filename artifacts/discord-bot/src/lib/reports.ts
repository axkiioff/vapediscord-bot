import {
  Client,
  TextChannel,
  EmbedBuilder,
  Colors,
} from "discord.js";
import {
  getGuildSettings,
  getDailyStaffStats,
  getMonthlyStaffStats,
  getLastDailyReport,
  setLastDailyReport,
  getLastMonthlyReport,
  setLastMonthlyReport,
  StaffEntry,
} from "./db.js";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function monthKey() {
  return new Date().toISOString().slice(0, 7);
}

function modLine(mods: StaffEntry["mods"]): string {
  return `W:${mods.W} M:${mods.M} K:${mods.K} B:${mods.B} C:${mods.C}`;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export function buildDailyEmbed(
  entries: StaffEntry[],
  resolveName: (id: string) => string
): EmbedBuilder {
  const top = entries[0];
  const lines = entries.slice(0, 10).map((e, i) => {
    const medal = MEDALS[i] ?? `${i + 1}.`;
    const name = resolveName(e.userId);
    return `${medal} **${name}** — score ${e.score} | ${modLine(e.mods)}`;
  });

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("📋 Daily Staff Report")
    .setTimestamp();

  if (top) {
    embed.setDescription(
      `⭐ **Staff of the day: ${resolveName(top.userId)}** (score ${top.score})\n\n${lines.join("\n")}`
    );
  } else {
    embed.setDescription("No staff activity recorded today.");
  }

  return embed;
}

export function buildMonthlyEmbed(
  entries: StaffEntry[],
  resolveName: (id: string) => string
): EmbedBuilder {
  const top = entries[0];
  const lines = entries.slice(0, 10).map((e, i) => {
    const medal = MEDALS[i] ?? `${i + 1}.`;
    const name = resolveName(e.userId);
    return `${medal} **${name}** — score ${e.score} | ${modLine(e.mods)}`;
  });

  const embed = new EmbedBuilder()
    .setColor(0xfaa61a)
    .setTitle("📊 Monthly Staff Report")
    .setTimestamp();

  if (top) {
    embed.setDescription(
      `⭐ **Staff of the month: ${resolveName(top.userId)}** (score ${top.score})\n\n${lines.join("\n")}`
    );
  } else {
    embed.setDescription("No staff activity recorded this month.");
  }

  return embed;
}

export function getPromoStatus(score: number): {
  emoji: string;
  label: string;
  note: string;
} {
  if (score >= 200) {
    return { emoji: "🟢", label: "Promotion candidate", note: "outstanding activity this period." };
  }
  if (score >= 80) {
    return { emoji: "⚪", label: "Stable", note: "active but not standout; continue monitoring." };
  }
  if (score >= 20) {
    return { emoji: "🟡", label: "Needs improvement", note: "below typical promotion thresholds." };
  }
  return { emoji: "🔴", label: "Not recommended", note: "very low recent activity." };
}

export function startReportScheduler(client: Client) {
  setInterval(async () => {
    const now = new Date();
    const today = todayKey();
    const month = monthKey();
    const hour = now.getUTCHours();
    const minute = now.getUTCMinutes();
    const dayOfMonth = now.getUTCDate();

    for (const guild of client.guilds.cache.values()) {
      const settings = getGuildSettings(guild.id);
      const channelId = settings.report_channel_id;
      if (!channelId) continue;

      const channel = guild.channels.cache.get(channelId) as TextChannel | undefined;
      if (!channel) continue;

      const resolveName = (id: string) => {
        const member = guild.members.cache.get(id);
        return member?.displayName ?? `<@${id}>`;
      };

      // Daily report at midnight UTC (00:00)
      if (hour === 0 && minute === 0 && getLastDailyReport(guild.id) !== today) {
        const entries = getDailyStaffStats(guild.id);
        const embed = buildDailyEmbed(entries, resolveName);
        await channel.send({ embeds: [embed] }).catch(() => null);
        setLastDailyReport(guild.id, today);
      }

      // Monthly report on 1st of month at 00:05 UTC
      if (dayOfMonth === 1 && hour === 0 && minute === 5 && getLastMonthlyReport(guild.id) !== month) {
        const entries = getMonthlyStaffStats(guild.id);
        const embed = buildMonthlyEmbed(entries, resolveName);
        await channel.send({ embeds: [embed] }).catch(() => null);
        setLastMonthlyReport(guild.id, month);
      }
    }
  }, 60_000);

  console.log("Report scheduler started.");
}
