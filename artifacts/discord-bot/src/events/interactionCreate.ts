import {
  Events,
  Interaction,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Colors,
} from "discord.js";

export const name = Events.InteractionCreate;

export async function execute(interaction: Interaction) {
  if (!interaction.isChatInputCommand()) return;

  const client = interaction.client as any;
  const command = client.commands?.get(interaction.commandName);

  if (!command) {
    return interaction.reply({
      content: "Unknown command.",
      ephemeral: true,
    });
  }

  try {
    await command.execute(interaction as ChatInputCommandInteraction);
  } catch (err) {
    console.error(`Error running /${interaction.commandName}:`, err);

    const embed = new EmbedBuilder()
      .setColor(Colors.Red)
      .setDescription("Something went wrong while running that command.");

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ embeds: [embed], ephemeral: true }).catch(() => null);
    } else {
      await interaction.reply({ embeds: [embed], ephemeral: true }).catch(() => null);
    }
  }
}
