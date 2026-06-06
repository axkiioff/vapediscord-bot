import { Events, Message, PartialMessage, EmbedBuilder } from "discord.js";
import { sendLog } from "../lib/logger.js";

export const name = Events.MessageUpdate;

export async function execute(
  oldMessage: Message | PartialMessage,
  newMessage: Message | PartialMessage
) {
  if (!newMessage.guild || newMessage.author?.bot) return;
  if (oldMessage.content === newMessage.content) return;

  const before = oldMessage.content ?? "*Content unavailable*";
  const after = newMessage.content ?? "*Content unavailable*";

  const embed = new EmbedBuilder()
    .setColor(0xf39c12)
    .setTitle("✏️  Message Edited")
    .setURL(newMessage.url)
    .addFields(
      { name: "Author", value: `<@${newMessage.author!.id}> (${newMessage.author!.tag})`, inline: true },
      { name: "Channel", value: `<#${newMessage.channel.id}>`, inline: true },
      { name: "Before", value: before.length > 512 ? before.slice(0, 509) + "..." : before || "*Empty*" },
      { name: "After", value: after.length > 512 ? after.slice(0, 509) + "..." : after || "*Empty*" }
    )
    .setTimestamp();

  await sendLog(newMessage.guild, embed);
}
