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
const YELLOW = 0xf1c40f;

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const channelOption = interaction.options.getChannel("channel", true);
  const targetChannel = interaction.guild!.channels.cache.get(channelOption.id) as any;

  if (!targetChannel) {
    return interaction.editReply({ content: "Channel not found." });
  }

  // ── Intro ──────────────────────────────────────────────────────
  const introEmbed = new EmbedBuilder()
    .setColor(ORANGE)
    .setTitle("📜  ROBLOX SERVICE  |  SERVER RULES")
    .setDescription(
      "Welcome to **Roblox Service** — the trusted hub for Roblox development, open source assets, and uncopylocked resources.\n\n" +
      "By remaining in this server you agree to abide by the directives outlined below.\n" +
      "**Ignorance of these rules is not an excusable offense.**"
    );

  // ── Section I: Code of Conduct ─────────────────────────────────
  const section1 = new EmbedBuilder()
    .setColor(BLUE)
    .setTitle("⚖️  SECTION I: CODE OF CONDUCT")
    .addFields(
      {
        name: "1.1  Mutual Respect",
        value:
          "Do not engage in harassment, toxicity, cyberbullying, or targeted hate speech. " +
          "Maintain a professional demeanor when interacting with developers and community members. " +
          "Racism, homophobia, and any form of discrimination are strictly forbidden.",
      },
      {
        name: "1.2  Swearing & Language  🟡 WARN → MUTE → BAN",
        value:
          "Excessive swearing, slurs, or offensive language is **not allowed** in any public channel. " +
          "Keep conversations clean and respectful. First offence = warn, repeated = mute, continued = ban.",
      },
      {
        name: "1.3  Profile and Identity",
        value:
          "Your Discord status, nickname, avatar, and banner must remain **Safe For Work (SFW)**. " +
          "Explicit, offensive, or highly controversial profiles will result in an immediate kick/ban.",
      },
      {
        name: "1.4  Drama and Politics",
        value:
          "Keep personal grievances, community drama, and political/religious debates out of public channels. " +
          "Take personal conflicts to DMs. Starting drama will result in a mute or ban.",
      },
      {
        name: "1.5  Staff Compliance",
        value:
          "Staff directives are final. Arguing with, mini-modding, or disrespecting the Administration team " +
          "will result in immediate escalation of punishments.",
      },
      {
        name: "1.6  Threats & Doxxing  🔴 PERMANENT BAN",
        value:
          "Threatening other members, sharing personal information (doxxing), or attempting to harm anyone " +
          "inside or outside this server will result in an **immediate permanent ban** and report to Discord.",
      }
    );

  // ── Section II: Content & Chat Rules ───────────────────────────
  const section2 = new EmbedBuilder()
    .setColor(BLUE)
    .setTitle("💬  SECTION II: CONTENT & CHAT RULES")
    .addFields(
      {
        name: "2.1  Spam & Flooding  🟡 MUTE → BAN",
        value:
          "Do **not** spam messages, copy-paste walls of text, flood channels with emojis, send repeated messages, " +
          "or abuse reactions. This includes voice channel soundboarding. Offenders will be muted then banned.",
      },
      {
        name: "2.2  Mass Mentions",
        value:
          "Do not mass-ping members, roles, or use @everyone / @here without staff permission. " +
          "Abuse of mentions will result in a mute.",
      },
      {
        name: "2.3  NSFW Content  🔴 PERMANENT BAN",
        value:
          "Sending, sharing, or linking **any** NSFW, explicit, or sexually suggestive content anywhere in this server " +
          "is strictly prohibited and will result in an **immediate permanent ban** with no appeal.",
      },
      {
        name: "2.4  Scam & Phishing Links  🔴 PERMANENT BAN",
        value:
          "Distributing scam links, phishing URLs, malware, or fraudulent content of **any** kind will result in an " +
          "**immediate permanent ban** and will be reported to Discord Trust & Safety.",
      },
      {
        name: "2.5  Self-Promotion & Advertising",
        value:
          "Advertising Discord servers, social media, YouTube channels, or any services outside of designated " +
          "promotion channels is not allowed. Unsolicited DM advertising will result in a ban.",
      },
      {
        name: "2.6  Impersonation  🔴 BAN",
        value:
          "Impersonating staff members, content creators, or other members is forbidden and will result in an immediate ban.",
      },
      {
        name: "2.7  Controversial & Sensitive Topics",
        value:
          "Avoid discussing highly controversial topics such as real-world violence, political extremism, or religion " +
          "in public channels. This server is a development community — keep it on topic.",
      }
    );

  // ── Section III: Channel Usage ──────────────────────────────────
  const section3 = new EmbedBuilder()
    .setColor(YELLOW)
    .setTitle("📂  SECTION III: CHANNEL USAGE")
    .addFields(
      {
        name: "3.1  Stay On Topic",
        value:
          "Use each channel for its intended purpose. Off-topic conversations belong in general chat. " +
          "Posting irrelevant content in dev/showcase channels will result in message deletion.",
      },
      {
        name: "3.2  No Begging",
        value:
          "Do not beg for free services, Robux, game access, or assets. " +
          "Repeated begging will result in a mute.",
      },
      {
        name: "3.4  Alt Accounts & Ban Evasion",
        value:
          "Alt accounts are allowed as long as they are not used to evade an active ban or punishment. " +
          "**Ban evasion using an alt account will result in a permanent ban** on all accounts and the original ban being extended.",
      }
    );

  // ── Section IV: Services & Orders ──────────────────────────────
  const section4 = new EmbedBuilder()
    .setColor(ORANGE)
    .setTitle("🛒  SECTION IV: SERVICES & ORDERS")
    .addFields(
      {
        name: "4.1  Order Conduct",
        value:
          "Be respectful and clear when placing orders. Provide accurate information. " +
          "Rushing, demanding, or being rude to staff may result in your order being cancelled with no refund.",
      },
      {
        name: "4.2  Chargebacks & Fraud  🔴 PERMANENT BAN",
        value:
          "Filing false chargebacks or attempting to defraud our services will result in a **permanent ban** " +
          "and potential legal action.",
      },
      {
        name: "4.3  No Stolen Assets",
        value:
          "Do not request services for games or assets that you do not own or have no rights to. " +
          "We do not assist with unauthorized use of others' intellectual property.",
      },
      {
        name: "4.4  No Leaking",
        value:
          "Do not leak, redistribute, or resell uncopylocked assets obtained through this server without explicit permission. " +
          "Violations will result in a permanent ban.",
      }
    );

  // ── Punishment Ladder ───────────────────────────────────────────
  const punishEmbed = new EmbedBuilder()
    .setColor(RED)
    .setTitle("🔨  PUNISHMENT GUIDELINES")
    .setDescription("Staff will apply punishments based on severity and history. General ladder:")
    .addFields(
      { name: "1️⃣  Verbal Warning", value: "Minor first-time offences.", inline: true },
      { name: "2️⃣  Official Warn", value: "Logged strike on your account.", inline: true },
      { name: "3️⃣  Mute", value: "Temporary communication restriction.", inline: true },
      { name: "4️⃣  Kick", value: "Removed from server, can rejoin.", inline: true },
      { name: "5️⃣  Temp Ban", value: "Removed for a set period.", inline: true },
      { name: "6️⃣  Permanent Ban", value: "No appeal for severe violations.", inline: true }
    );

  // ── Footer ──────────────────────────────────────────────────────
  const footerEmbed = new EmbedBuilder()
    .setColor(RED)
    .setDescription(
      "⚠️ **Rules are subject to change without notice.**\n" +
      "Staff reserve the right to take action at their discretion, even for behaviour not explicitly listed above.\n\n" +
      "By participating in this server you acknowledge and accept **all** rules listed above.\n" +
      "**If you have questions about the rules, open a ticket.**"
    )
    .setFooter({ text: "Roblox Service — Administration Team" })
    .setTimestamp();

  await targetChannel.send({ embeds: [introEmbed] });
  await targetChannel.send({ embeds: [section1] });
  await targetChannel.send({ embeds: [section2] });
  await targetChannel.send({ embeds: [section3] });
  await targetChannel.send({ embeds: [section4] });
  await targetChannel.send({ embeds: [punishEmbed] });
  await targetChannel.send({ embeds: [footerEmbed] });

  await interaction.editReply({ content: `Server rules posted in <#${channelOption.id}> ✅` });
}
