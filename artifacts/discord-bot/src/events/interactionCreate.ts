import {
  Events,
  Interaction,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Colors,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
  ChannelType,
  PermissionFlagsBits,
  OverwriteType,
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

  // ── Button: Place Order → open ticket channel ──────────────────
  if (interaction.isButton() && interaction.customId === "place_order_btn") {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild!;
    const user = interaction.user;
    const settings = getGuildSettings(guild.id);

    // Check if user already has an open ticket
    const existing = guild.channels.cache.find(
      (ch) =>
        ch.type === ChannelType.GuildText &&
        ch.name === `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, "")}`
    );

    if (existing) {
      return interaction.editReply({
        content: `You already have an open ticket: <#${existing.id}>`,
      });
    }

    // Build permission overwrites
    const overwrites: any[] = [
      {
        id: guild.roles.everyone.id,
        type: OverwriteType.Role,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: user.id,
        type: OverwriteType.Member,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      },
    ];

    // Add staff role if configured
    const staffRoleId = settings.staff_role_id as string | undefined;
    if (staffRoleId) {
      overwrites.push({
        id: staffRoleId,
        type: OverwriteType.Role,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageMessages,
        ],
      });
    }

    // Category (optional)
    const categoryId = (settings as any).ticket_category_id as string | undefined;
    const safeUsername = user.username.toLowerCase().replace(/[^a-z0-9]/g, "");

    let ticketChannel: TextChannel;
    try {
      ticketChannel = (await guild.channels.create({
        name: `ticket-${safeUsername}`,
        type: ChannelType.GuildText,
        parent: categoryId ?? null,
        permissionOverwrites: overwrites,
        topic: `Order ticket for ${user.tag}`,
      })) as TextChannel;
    } catch (err) {
      console.error("Failed to create ticket channel:", err);
      return interaction.editReply({
        content: "Failed to create a ticket channel. Make sure I have **Manage Channels** permission.",
      });
    }

    // Welcome embed inside the ticket
    const welcomeEmbed = new EmbedBuilder()
      .setColor(0xff8c00)
      .setTitle("🎫 Order Ticket")
      .setDescription(
        `Hey <@${user.id}>, welcome to your ticket!\n\n` +
        `Please describe your order and a staff member will assist you shortly.\n\n` +
        `**What to include:**\n` +
        `> • Your Roblox username\n` +
        `> • Game link / Asset ID\n` +
        `> • What you need uncopylocker to do`
      )
      .setFooter({ text: "AK Uncopylocked Services" })
      .setTimestamp();

    const closeRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("close_ticket_btn")
        .setLabel("Close Ticket")
        .setEmoji("🔒")
        .setStyle(ButtonStyle.Danger)
    );

    await ticketChannel.send({
      content: `<@${user.id}>${staffRoleId ? ` | <@&${staffRoleId}>` : ""}`,
      embeds: [welcomeEmbed],
      components: [closeRow],
    });

    // Log to ticket logs channel if set
    const logChannelId = (settings as any).ticket_logs_channel_id as string | undefined;
    if (logChannelId) {
      const logChannel = guild.channels.cache.get(logChannelId) as TextChannel | undefined;
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor(Colors.Green)
          .setTitle("Ticket Opened")
          .addFields(
            { name: "User", value: `<@${user.id}> (${user.tag})`, inline: true },
            { name: "Channel", value: `<#${ticketChannel.id}>`, inline: true }
          )
          .setTimestamp();
        await logChannel.send({ embeds: [logEmbed] }).catch(() => null);
      }
    }

    return interaction.editReply({
      content: `Your ticket has been created: <#${ticketChannel.id}>`,
    });
  }

  // ── Button: Close Ticket ───────────────────────────────────────
  if (interaction.isButton() && interaction.customId === "close_ticket_btn") {
    const channel = interaction.channel as TextChannel;
    const guild = interaction.guild!;
    const settings = getGuildSettings(guild.id);

    // Confirm embed before deleting
    const confirmEmbed = new EmbedBuilder()
      .setColor(Colors.Red)
      .setDescription(`🔒 Ticket closed by <@${interaction.user.id}>. This channel will be deleted in 5 seconds.`);

    await interaction.reply({ embeds: [confirmEmbed] });

    // Log closure
    const logChannelId = (settings as any).ticket_logs_channel_id as string | undefined;
    if (logChannelId) {
      const logChannel = guild.channels.cache.get(logChannelId) as TextChannel | undefined;
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle("Ticket Closed")
          .addFields(
            { name: "Channel", value: channel.name, inline: true },
            { name: "Closed by", value: `<@${interaction.user.id}>`, inline: true }
          )
          .setTimestamp();
        await logChannel.send({ embeds: [logEmbed] }).catch(() => null);
      }
    }

    setTimeout(() => {
      channel.delete("Ticket closed").catch(() => null);
    }, 5000);
  }
}
