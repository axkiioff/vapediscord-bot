import {
  Events,
  AuditLogEvent,
  Guild,
  GuildAuditLogsEntry,
  GuildMember,
  Colors,
} from "discord.js";
import {
  isProtectionEnabled,
  getRateLimit,
  trackAction,
  resetActionCount,
  ensureGuild,
  getGuildSettings,
  recordStaffMod,
  ModStats,
} from "../lib/db.js";
import { sendStaffAlert } from "../lib/raid.js";

const MUTE_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

async function muteUser(guild: Guild, userId: string, reason: string) {
  const member =
    guild.members.cache.get(userId) ??
    (await guild.members.fetch(userId).catch(() => null));
  if (!member) return;
  if (member.isCommunicationDisabled()) return;

  await member
    .disableCommunicationUntil(Date.now() + MUTE_DURATION_MS, reason)
    .catch(() => null);

  await sendStaffAlert(
    guild,
    "User Auto-Muted",
    `<@${userId}> was muted for 30 days.\n**Reason:** ${reason}`,
    Colors.Red
  );
}

function isOwnerOrAdmin(member: GuildMember): boolean {
  return (
    member.id === member.guild.ownerId ||
    member.permissions.has("Administrator")
  );
}

export const name = Events.GuildAuditLogEntryCreate;

export async function execute(entry: GuildAuditLogsEntry, guild: Guild) {
  ensureGuild(guild.id);

  const executorId = entry.executorId;
  if (!executorId) return;

  const executor =
    guild.members.cache.get(executorId) ??
    (await guild.members.fetch(executorId).catch(() => null));
  if (!executor) return;

  if (executor.id === guild.client.user?.id) return;

  const action = entry.action;
  const settings = getGuildSettings(guild.id);
  const staffRoleId = settings.staff_role_id;

  // Map audit actions to staff mod tracking
  const modTypeMap: Partial<Record<AuditLogEvent, keyof ModStats>> = {
    [AuditLogEvent.MemberBanAdd]: "B",
    [AuditLogEvent.MemberKick]: "K",
    [AuditLogEvent.MemberUpdate]: "M",
  };

  if (staffRoleId && executor.roles.cache.has(staffRoleId)) {
    const modType = modTypeMap[action as AuditLogEvent];
    if (modType) {
      recordStaffMod(guild.id, executorId, modType);
    }
  }

  const mappings: {
    auditAction: AuditLogEvent;
    feature: string;
    rateLimitKey: string;
    alertTitle: string;
  }[] = [
    {
      auditAction: AuditLogEvent.ChannelCreate,
      feature: "anti_create_channel",
      rateLimitKey: "create_channel",
      alertTitle: "Channel Created",
    },
    {
      auditAction: AuditLogEvent.ChannelDelete,
      feature: "anti_delete_channel",
      rateLimitKey: "create_channel",
      alertTitle: "Channel Deleted",
    },
    {
      auditAction: AuditLogEvent.MemberBanAdd,
      feature: "anti_ban",
      rateLimitKey: "ban",
      alertTitle: "Member Banned",
    },
    {
      auditAction: AuditLogEvent.MemberKick,
      feature: "anti_kick",
      rateLimitKey: "kick",
      alertTitle: "Member Kicked",
    },
    {
      auditAction: AuditLogEvent.RoleCreate,
      feature: "anti_create_role",
      rateLimitKey: "create_role",
      alertTitle: "Role Created",
    },
    {
      auditAction: AuditLogEvent.RoleDelete,
      feature: "anti_delete_role",
      rateLimitKey: "create_role",
      alertTitle: "Role Deleted",
    },
  ];

  for (const mapping of mappings) {
    if (action !== mapping.auditAction) continue;

    if (isProtectionEnabled(guild.id, mapping.feature)) {
      await sendStaffAlert(
        guild,
        `⚠️ ${mapping.alertTitle}`,
        `<@${executorId}> performed this action. Feature \`${mapping.feature}\` is enabled.`,
        Colors.Orange
      );
    }

    const rl = getRateLimit(guild.id, mapping.rateLimitKey);
    if (!rl) continue;

    const shouldCheck =
      rl.limit_target === "everyone" ||
      (rl.limit_target === "admin" && isOwnerOrAdmin(executor)) ||
      (rl.limit_target === "owner" && executor.id === guild.ownerId);

    if (!shouldCheck) continue;

    const count = trackAction(guild.id, executorId, mapping.rateLimitKey);

    if (count > rl.limit_count) {
      resetActionCount(guild.id, executorId, mapping.rateLimitKey);
      await muteUser(
        guild,
        executorId,
        `Exceeded rate limit for ${mapping.rateLimitKey.replace(/_/g, " ")} (limit: ${rl.limit_count} per 10min)`
      );
    }

    break;
  }
}
