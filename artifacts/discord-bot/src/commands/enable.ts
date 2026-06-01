import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  Colors,
} from "discord.js";
import { ensureGuild, setProtection } from "../lib/db.js";

const FEATURES = [
  "antilink",
  "anti_create_channel",
  "anti_delete_channel",
  "anti_ban",
  "anti_kick",
  "anti_create_role",
  "anti_delete_role",
];

const FEATURE_LABELS: Record<string, string> = {
  antilink: "Anti-Link",
  anti_create_channel: "Anti Create Channel",
  anti_delete_channel: "Anti Delete Channel",
  anti_ban: "Anti Ban",
  anti_kick: "Anti Kick",
  anti_create_role: "Anti Create Role",
  anti_delete_role: "Anti Delete Role",
};

const builder = new SlashCommandBuilder()
  .setName("enable")
  .setDescription("Enable a protection feature")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

for (const feat of FEATURES) {
  builder.addSubcommand((sub) =>
    sub.setName(feat).setDescription(`Enable ${FEATURE_LABELS[feat]}`)
  );
}

export const data = builder;

export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId!;
  ensureGuild(guildId);

  const feature = interaction.options.getSubcommand();
  setProtection(guildId, feature, true);

  const label = FEATURE_LABELS[feature] ?? feature;

  const embed = new EmbedBuilder()
    .setColor(Colors.Green)
    .setDescription(`**${label}** has been enabled.`);

  await interaction.reply({ embeds: [embed] });
}
