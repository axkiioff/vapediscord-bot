import {
  GuildMember,
  PermissionFlagsBits,
  PermissionResolvable,
} from "discord.js";
import { getUserPermissions, getRolePermissions } from "./db.js";

export const VALID_DISCORD_PERMS: Record<string, PermissionResolvable> = {
  administrator: PermissionFlagsBits.Administrator,
  ban_members: PermissionFlagsBits.BanMembers,
  kick_members: PermissionFlagsBits.KickMembers,
  manage_channels: PermissionFlagsBits.ManageChannels,
  manage_roles: PermissionFlagsBits.ManageRoles,
  manage_messages: PermissionFlagsBits.ManageMessages,
  manage_guild: PermissionFlagsBits.ManageGuild,
  mention_everyone: PermissionFlagsBits.MentionEveryone,
  moderate_members: PermissionFlagsBits.ModerateMembers,
  mute_members: PermissionFlagsBits.MuteMembers,
  deafen_members: PermissionFlagsBits.DeafenMembers,
  move_members: PermissionFlagsBits.MoveMembers,
  send_messages: PermissionFlagsBits.SendMessages,
  read_message_history: PermissionFlagsBits.ReadMessageHistory,
  view_channel: PermissionFlagsBits.ViewChannel,
  embed_links: PermissionFlagsBits.EmbedLinks,
  attach_files: PermissionFlagsBits.AttachFiles,
  use_application_commands: PermissionFlagsBits.UseApplicationCommands,
};

export function isValidPermission(perm: string): boolean {
  return perm in VALID_DISCORD_PERMS;
}

export function hasCustomPermission(
  member: GuildMember,
  permission: string
): boolean {
  const guildId = member.guild.id;
  const userId = member.id;

  const userPerms = getUserPermissions(guildId, userId);
  if (userPerms.includes(permission)) return true;

  for (const role of member.roles.cache.values()) {
    const rolePerms = getRolePermissions(guildId, role.id);
    if (rolePerms.includes(permission)) return true;
  }

  return false;
}
