import { Events, Message, EmbedBuilder, Colors } from "discord.js";
import {
  isProtectionEnabled,
  getBlacklistedWords,
  getGuildSettings,
  recordStaffMessage,
} from "../lib/db.js";

const LINK_REGEX = /(https?:\/\/|discord\.gg\/|www\.)\S+/i;

export const name = Events.MessageCreate;

export async function execute(message: Message) {
  if (message.author.bot || !message.guild) return;

  const guildId = message.guild.id;
  const settings = getGuildSettings(guildId);

  // Track staff messages for activity scoring
  if (settings.staff_role_id) {
    const member = message.member;
    if (member?.roles.cache.has(settings.staff_role_id)) {
      recordStaffMessage(guildId, message.author.id);
    }
  }

  // Anti-link
  if (isProtectionEnabled(guildId, "antilink")) {
    if (LINK_REGEX.test(message.content)) {
      const member = message.member;
      if (member && !member.permissions.has("ManageMessages")) {
        await message.delete().catch(() => null);
        const embed = new EmbedBuilder()
          .setColor(Colors.Red)
          .setDescription(`<@${message.author.id}> Links are not allowed here.`);
        const warn = await message.channel
          .send({ embeds: [embed] })
          .catch(() => null);
        if (warn) setTimeout(() => warn.delete().catch(() => null), 5000);
        return;
      }
    }
  }

  // Blacklisted words
  const blacklist = getBlacklistedWords(guildId);
  if (blacklist.length > 0) {
    const lower = message.content.toLowerCase();
    const matched = blacklist.find((w) => lower.includes(w));
    if (matched) {
      await message.delete().catch(() => null);
      const embed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setDescription(`<@${message.author.id}> That word isn't allowed here.`);
      const warn = await message.channel
        .send({ embeds: [embed] })
        .catch(() => null);
      if (warn) setTimeout(() => warn.delete().catch(() => null), 5000);
    }
  }
}
