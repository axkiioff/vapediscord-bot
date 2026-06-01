import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  Colors,
} from "discord.js";
import {
  ensureGuild,
  addBlacklistedWord,
  removeBlacklistedWord,
  getBlacklistedWords,
} from "../lib/db.js";

export const data = new SlashCommandBuilder()
  .setName("blacklistwords")
  .setDescription("Manage blacklisted words")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .addSubcommand((sub) =>
    sub
      .setName("add")
      .setDescription("Add a word to the blacklist")
      .addStringOption((opt) =>
        opt.setName("word").setDescription("Word to blacklist").setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("remove")
      .setDescription("Remove a word from the blacklist")
      .addStringOption((opt) =>
        opt
          .setName("word")
          .setDescription("Word to remove")
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub.setName("list").setDescription("Show all blacklisted words")
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId!;
  ensureGuild(guildId);

  const sub = interaction.options.getSubcommand();

  if (sub === "add") {
    const word = interaction.options.getString("word", true).toLowerCase();
    addBlacklistedWord(guildId, word);

    const embed = new EmbedBuilder()
      .setColor(Colors.Red)
      .setDescription(`Added \`${word}\` to the blacklist.`);
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  if (sub === "remove") {
    const word = interaction.options.getString("word", true).toLowerCase();
    removeBlacklistedWord(guildId, word);

    const embed = new EmbedBuilder()
      .setColor(Colors.Orange)
      .setDescription(`Removed \`${word}\` from the blacklist.`);
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  if (sub === "list") {
    const words = getBlacklistedWords(guildId);
    const embed = new EmbedBuilder().setColor(Colors.Blurple).setTitle("Blacklisted Words");

    if (words.length === 0) {
      embed.setDescription("No words are blacklisted.");
    } else {
      embed.setDescription(words.map((w) => `\`${w}\``).join(", "));
    }

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
}
