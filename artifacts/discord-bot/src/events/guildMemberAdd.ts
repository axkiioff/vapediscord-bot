import { Events, GuildMember } from "discord.js";
import { trackJoin, sendRaidAlert } from "../lib/raid.js";
import { ensureGuild } from "../lib/db.js";

export const name = Events.GuildMemberAdd;

export async function execute(member: GuildMember) {
  const { guild } = member;
  ensureGuild(guild.id);

  const isRaid = trackJoin(guild, member.id);
  if (isRaid) {
    await sendRaidAlert(
      guild,
      `Possible raid detected — multiple accounts joined in a short window. <@${member.id}> was the latest join.`,
    );
  }
}
