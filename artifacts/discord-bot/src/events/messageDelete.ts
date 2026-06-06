import { Events, Message, EmbedBuilder, PartialMessage } from "discord.js";
import { sendLog } from "../lib/logger.js";

export const name = Events.MessageDelete;

export async function execute(message: Message | PartialMessage) {
  if (!message.guild || message.author?.bot) return;

  const content = message.content ?? "*Message content unavailable*";
  const channel = message.channel;
  const author = message.author;

  const embed = new EmbedBuilder()
    .setColor(0xe74c3c)
    .setTitle("🗑️  Message Deleted")
    .addFields(
      { name: "Author", value: author ? `<@${author.id}> (${author.tag})` : "Unknown", inline: true },
      { name: "Channel", value: `<#${channel.id}>`, inline: true },
      { name: "Message", value: content.length > 1024 ? content.slice(0, 1021) + "..." : content || "*Empty*" }
    )
    .setTimestamp();

  await sendLog(message.guild, embed);
}
