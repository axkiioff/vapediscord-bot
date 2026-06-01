import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  Colors,
} from "discord.js";
import { ensureGuild, setProtection } from "../lib/db.js";

const FEATURES = [
  { value: "antilink", name: "Anti-Link" },
  { value: "anti_create_channel", name: "Anti Create Channel" },
  { value: "anti_delete_channel", name: "Anti Delete Channel" },
  { value: "anti_ban", name: "Anti Ban" },
  { value: "anti_kick", name: "Anti Kick" },
  { value: "anti_create_role", name: "Anti Create Role" },
  { value: "anti_delete_role", name: "Anti Delete Role" },
];

export const data = new SlashCommandBuilder()
  .setName("disable")
  .setDescription("Disable a protection feature")
  .addStringOption((opt) =>
    opt
      .setName("feature")
      .setDescription("Which protection to disable")
      .setRequired(true)
      .addChoices(...FEATURES.map((f) => ({ name: f.name, value: f.value })))
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId!;
  ensureGuild(guildId);

  const feature = interaction.options.getString("feature", true);
  const label = FEATURES.find((f) => f.value === feature)?.name ?? feature;

  setProtection(guildId, feature, false);

  const embed = new EmbedBuilder()
    .setColor(Colors.Red)
    .setDescription(`**${label}** has been disabled.`);

  await interaction.reply({ embeds: [embed] });
}
