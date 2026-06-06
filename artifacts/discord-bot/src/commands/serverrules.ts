import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  ChannelType,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("serverrules")
  .setDescription("Post the server rules in a channel")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addChannelOption((opt) =>
    opt
      .setName("channel")
      .setDescription("Channel to post the rules in")
      .setRequired(true)
      .addChannelTypes(ChannelType.GuildText)
  );

const BLUE = 0x5865f2;
const RED = 0xe74c3c;
const ORANGE = 0xff8c00;

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const channelOption = interaction.options.getChannel("channel", true);
  const targetChannel = interaction.guild!.channels.cache.get(channelOption.id) as any;

  if (!targetChannel) {
    return interaction.editReply({ content: "Channel not found." });
  }

  // ── Intro ─────────────────────────────────────────────────────
  const introEmbed = new EmbedBuilder()
    .setColor(ORANGE)
    .setTitle("📜  AK UNCOPYLOCKED  |  SERVER RULES")
    .setDescription(
      "Welcome to **AK Uncopylocked** — the trusted hub for Roblox development, open source assets, and uncopylocked resources.\n\n" +
      "By remaining in this server, you agree to abide by the directives outlined below.\n" +
      "**Ignorance of these rules is not an excusable offense.**"
    );

  // ── Section I: Code of Conduct ────────────────────────────────
  const section1 = new EmbedBuilder()
    .setColor(BLUE)
    .setTitle("⚖️  SECTION I: CODE OF CONDUCT")
    .addFields(
      {
        name: "1.1  Mutual Respect",
        value:
          "Do not engage in harassment, toxicity, cyberbullying, or targeted hate speech. " +
          "Maintain a professional demeanor when interacting with developers and community members.",
      },
      {
        name: "1.2  Profile and Identity",
        value:
          "Your Discord status, nickname, avatar, and banner must remain **Safe For Work (SFW)**. " +
          "Explicit, offensive, or highly controversial profiles will result in an immediate kick/ban.",
      },
      {
        name: "1.3  Drama and Politics",
        value:
          "Keep personal grievances, community drama, and political/religious debates out of public channels. " +
          "Take personal conflicts to DMs.",
      },
      {
        name: "1.4  Staff Compliance",
        value:
          "Staff directives are final. Arguing with, mini-modding, or disrespecting the Administration team " +
          "will result in immediate escalation of punishments.",
      }
    );

  // ── Section II: Content Rules ─────────────────────────────────
  const section2 = new EmbedBuilder()
    .setColor(BLUE)
    .setTitle("🔞  SECTION II: CONTENT RULES")
    .addFields(
      {
        name: "2.1  NSFW Content  🔴 PERMANENT BAN",
        value:
          "Sending, sharing, or linking **any** NSFW, explicit, or sexually suggestive content is strictly prohibited " +
          "and will result in an **immediate permanent ban** with no appeal.",
      },
      {
        name: "2.2  Scam & Phishing Links  🔴 PERMANENT BAN",
        value:
          "Distributing scam links, phishing URLs, malware, or fraudulent content of any kind will result in an " +
          "**immediate permanent ban** and will be reported to Discord Trust & Safety.",
      },
      {
        name: "2.3  Spam & Flooding",
        value:
          "Do not spam messages, emojis, mentions, or attachments. Repeated offenses will result in a mute, then a ban.",
      },
      {
        name: "2.4  Self-Promotion",
        value:
          "Advertising servers, social media, or services outside of designated promotion channels is not allowed. " +
          "Unsolicited DM advertising will result in a ban.",
      },
      {
        name: "2.5  Impersonation",
        value:
          "Impersonating staff members, content creators, or other members is forbidden and will result in an immediate ban.",
      }
    );

  // ── Section III: Services & Orders ───────────────────────────
  const section3 = new EmbedBuilder()
    .setColor(BLUE)
    .setTitle("🛒  SECTION III: SERVICES & ORDERS")
    .addFields(
      {
        name: "3.1  Order Conduct",
        value:
          "Be respectful and clear when placing orders. Provide accurate information. " +
          "Rushing, demanding, or being rude to staff may result in your order being cancelled.",
      },
      {
        name: "3.2  Chargebacks & Fraud  🔴 PERMANENT BAN",
        value:
          "Filing false chargebacks or attempting to defraud our services will result in a **permanent ban** " +
          "and potential legal action.",
      },
      {
        name: "3.3  No Stolen Assets",
        value:
          "Do not request services for games or assets that you do not own or have no rights to. " +
          "We do not assist with unauthorized use of others' intellectual property.",
      }
    );

  // ── Footer ────────────────────────────────────────────────────
  const footerEmbed = new EmbedBuilder()
    .setColor(RED)
    .setDescription(
      "⚠️ **Rules are subject to change without notice.** Staff reserve the right to take action at their discretion, " +
      "even for behavior not explicitly listed above.\n\n" +
      "By participating in this server, you acknowledge and accept all rules listed above."
    )
    .setFooter({ text: "AK Uncopylocked — Administration Team" })
    .setTimestamp();

  await targetChannel.send({ embeds: [introEmbed] });
  await targetChannel.send({ embeds: [section1] });
  await targetChannel.send({ embeds: [section2] });
  await targetChannel.send({ embeds: [section3] });
  await targetChannel.send({ embeds: [footerEmbed] });

  await interaction.editReply({ content: `Server rules posted in <#${channelOption.id}>` });
}
