import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  Colors,
} from "discord.js";
import { ensureGuild, setRateLimit } from "../lib/db.js";

const ACTIONS = ["create_channel", "create_role", "ban", "kick"];

const ACTION_LABELS: Record<string, string> = {
  create_channel: "Create Channel",
  create_role: "Create Role",
  ban: "Ban",
  kick: "Kick",
};

const builder = new SlashCommandBuilder()
  .setName("setlimit")
  .setDescription("Set a rate limit on an action — exceeding it auto-mutes the user")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

for (const action of ACTIONS) {
  builder.addSubcommand((sub) =>
    sub
      .setName(action)
      .setDescription(`Set limit for ${ACTION_LABELS[action]}`)
      .addIntegerOption((opt) =>
        opt
          .setName("count")
          .setDescription("Max allowed per 10 minutes (e.g. 1 means only 1 allowed)")
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(100)
      )
      .addStringOption((opt) =>
        opt
          .setName("applies_to")
          .setDescription("Who does this limit apply to?")
          .setRequired(true)
          .addChoices(
            { name: "Everyone", value: "everyone" },
            { name: "Admins only", value: "admin" },
            { name: "Owner only", value: "owner" }
          )
      )
  );
}

export const data = builder;

export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId!;
  ensureGuild(guildId);

  const action = interaction.options.getSubcommand();
  const count = interaction.options.getInteger("count", true);
  const appliesTo = interaction.options.getString("applies_to", true);

  setRateLimit(guildId, action, count, appliesTo);

  const label = ACTION_LABELS[action] ?? action;
  const targetLabel =
    appliesTo === "everyone"
      ? "everyone"
      : appliesTo === "admin"
      ? "admins"
      : "the server owner";

  const embed = new EmbedBuilder()
    .setColor(Colors.Blurple)
    .setTitle("Rate Limit Set")
    .setDescription(
      `**${label}** — max **${count}** per 10 minutes for **${targetLabel}**.\nAnyone who goes over that gets muted for 30 days.`
    );

  await interaction.reply({ embeds: [embed] });
}
