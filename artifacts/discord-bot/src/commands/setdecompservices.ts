import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("setdecompservices")
  .setDescription("Post the AK Uncopylocked order panel in a channel")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addChannelOption((opt) =>
    opt
      .setName("channel")
      .setDescription("Channel to post the panel in")
      .setRequired(true)
      .addChannelTypes(ChannelType.GuildText)
  )
  .addStringOption((opt) =>
    opt
      .setName("description")
      .setDescription('Custom description (default: "Click the button below to place an order!")')
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  // Acknowledge Discord immediately — prevents it retrying and sending duplicates
  await interaction.deferReply({ ephemeral: true });

  const channel = interaction.options.getChannel("channel", true);
  const customDesc = interaction.options.getString("description");

  const desc =
    customDesc ??
    "Click the button below to place an order!\nOne of our experienced uncopylockers will address it.";

  const embed = new EmbedBuilder()
    .setColor(0xff8c00)
    .setTitle("Place an Order!")
    .setDescription(desc)
    .setFooter({ text: "AK Uncopylocked Services" });

  const button = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("place_order_btn")
      .setLabel("Place Order!")
      .setEmoji("✉️")
      .setStyle(ButtonStyle.Success)
  );

  const targetChannel = interaction.guild!.channels.cache.get(channel.id) as any;
  if (!targetChannel) {
    return interaction.editReply({ content: "Channel not found." });
  }

  await targetChannel.send({ embeds: [embed], components: [button] });

  await interaction.editReply({
    content: `Order panel posted in <#${channel.id}>`,
  });
}
