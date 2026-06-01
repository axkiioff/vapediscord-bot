import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  Colors,
  ChannelType,
  TextChannel,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("unlock")
  .setDescription("Unlock a channel so members can send messages again")
  .addChannelOption((opt) =>
    opt
      .setName("channel")
      .setDescription("Channel to unlock (defaults to current)")
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
    SendMessages: null,
  });

  const embed = new EmbedBuilder()
    .setColor(Colors.Green)
    .setDescription(`🔓 <#${channel.id}> has been unlocked.`);

  await interaction.reply({ embeds: [embed] });
}
