import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  Colors,
  ChannelType,
  TextChannel,
  OverwriteType,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("lock")
  .setDescription("Lock a channel so members cannot send messages")
  .addChannelOption((opt) =>
    opt
      .setName("channel")
      .setDescription("Channel to lock (defaults to current)")
      .addChannelTypes(ChannelType.GuildText)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

export async function execute(interaction: ChatInputCommandInteraction) {
  const channel =
    (interaction.options.getChannel("channel") as TextChannel) ??
    (interaction.channel as TextChannel);

  if (!channel) {
    return interaction.reply({ content: "Could not find the channel.", ephemeral: true });
  }

  const everyone = interaction.guild!.roles.everyone;

  await channel.permissionOverwrites.edit(everyone, {
    SendMessages: false,
  });

  const embed = new EmbedBuilder()
    .setColor(Colors.Red)
    .setDescription(`🔒 <#${channel.id}> has been locked.`);

  await interaction.reply({ embeds: [embed] });
}
