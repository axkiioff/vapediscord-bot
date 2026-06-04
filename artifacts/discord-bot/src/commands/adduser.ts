import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  Colors,
  TextChannel,
  OverwriteType,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("adduser")
  .setDescription("Add a user to this ticket channel")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .addUserOption((opt) =>
    opt.setName("user").setDescription("User to add to the ticket").setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const channel = interaction.channel as TextChannel;
  const target = interaction.options.getUser("user", true);

  if (!channel || !channel.name.startsWith("ticket-")) {
    return interaction.editReply({ content: "This command can only be used inside a ticket channel." });
  }

  try {
    await channel.permissionOverwrites.edit(target.id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
    });

    const embed = new EmbedBuilder()
      .setColor(Colors.Green)
      .setDescription(`<@${target.id}> has been added to this ticket.`);

    await channel.send({ embeds: [embed] });
    await interaction.editReply({ content: `Added <@${target.id}> to the ticket.` });
  } catch (err) {
    console.error("adduser error:", err);
    await interaction.editReply({ content: "Failed to add user. Make sure I have Manage Channels permission." });
  }
}
