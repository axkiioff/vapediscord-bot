import {
  Events,
  Interaction,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Colors,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  TextChannel,
  ChannelType,
} from "discord.js";
import { getGuildSettings } from "../lib/db.js";

export const name = Events.InteractionCreate;

export async function execute(interaction: Interaction) {
  // ── Slash commands ──────────────────────────────────────────────
  if (interaction.isChatInputCommand()) {
    const client = interaction.client as any;
    const command = client.commands?.get(interaction.commandName);

    if (!command) {
      return interaction.reply({ content: "Unknown command.", ephemeral: true });
    }

    try {
      await command.execute(interaction as ChatInputCommandInteraction);
    } catch (err) {
      console.error(`Error running /${interaction.commandName}:`, err);
      const embed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setDescription("Something went wrong running that command.");
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [embed], ephemeral: true }).catch(() => null);
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true }).catch(() => null);
      }
    }
    return;
  }

  // ── Button: Place Order ──────────────────────────────────────────
  if (interaction.isButton() && interaction.customId === "place_order_btn") {
    const modal = new ModalBuilder()
      .setCustomId("place_order_modal")
      .setTitle("Place an Order");

    const usernameInput = new TextInputBuilder()
      .setCustomId("roblox_username")
      .setLabel("Your Roblox Username")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("e.g. Builderman")
      .setRequired(true);

    const gameLinkInput = new TextInputBuilder()
      .setCustomId("game_link")
      .setLabel("Game Link / Asset ID")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("https://www.roblox.com/games/...")
      .setRequired(true);

    const detailsInput = new TextInputBuilder()
      .setCustomId("order_details")
      .setLabel("Order Details")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("Describe what you need uncopylocker to do...")
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(usernameInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(gameLinkInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(detailsInput)
    );

    await interaction.showModal(modal);
    return;
  }

  // ── Modal submit: Place Order ────────────────────────────────────
  if (interaction.isModalSubmit() && interaction.customId === "place_order_modal") {
    const robloxUsername = interaction.fields.getTextInputValue("roblox_username");
    const gameLink = interaction.fields.getTextInputValue("game_link");
    const details = interaction.fields.getTextInputValue("order_details");

    const settings = getGuildSettings(interaction.guildId!);
    const logChannelId = settings.ticket_logs_channel_id as string | undefined;

    const orderEmbed = new EmbedBuilder()
      .setColor(0xff8c00)
      .setTitle("New Order Submitted")
      .addFields(
        { name: "Discord", value: `<@${interaction.user.id}>`, inline: true },
        { name: "Roblox Username", value: robloxUsername, inline: true },
        { name: "Game Link", value: gameLink },
        { name: "Order Details", value: details }
      )
      .setTimestamp();

    // Log to ticket logs channel if set
    if (logChannelId) {
      const logChannel = interaction.guild?.channels.cache.get(logChannelId) as
        | TextChannel
        | undefined;
      if (logChannel) {
        await logChannel.send({ embeds: [orderEmbed] }).catch(() => null);
      }
    }

    // Confirm to the user
    const confirmEmbed = new EmbedBuilder()
      .setColor(Colors.Green)
      .setDescription(
        "Your order has been submitted! One of our uncopylockers will reach out to you shortly."
      );

    await interaction.reply({ embeds: [confirmEmbed], ephemeral: true });
    return;
  }
}
