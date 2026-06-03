import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "../../data");
const dbPath = path.join(dataDir, "bot.json");

fs.mkdirSync(dataDir, { recursive: true });

export interface ModStats {
  W: number;
  M: number;
  K: number;
  B: number;
  C: number;
}

interface DB {
  guilds: Record<string, GuildRecord>;
}

interface GuildRecord {
  staff_channel_id?: string;
  report_channel_id?: string;
  staff_role_id?: string;
  prefix?: string;
  last_daily_report?: string;
  last_monthly_report?: string;
  protections: Record<string, boolean>;
  blacklisted_words: string[];
  rate_limits: Record<string, { limit_count: number; limit_target: string }>;
  action_counts: Record<string, { count: number; window_start: number }>;
  user_permissions: Record<string, string[]>;
  role_permissions: Record<string, string[]>;
  staff_messages: Record<string, Record<string, number>>;
  staff_mods: Record<string, Record<string, ModStats>>;
}

function load(): DB {
  if (!fs.existsSync(dbPath)) return { guilds: {} };
  try {
    return JSON.parse(fs.readFileSync(dbPath, "utf-8"));
  } catch {
    return { guilds: {} };
  }
}

function save(db: DB) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

function getGuild(db: DB, guildId: string): GuildRecord {
  if (!db.guilds[guildId]) {
    db.guilds[guildId] = {
      protections: {},
      blacklisted_words: [],
      rate_limits: {},
      action_counts: {},
      user_permissions: {},
      role_permissions: {},
      staff_messages: {},
      staff_mods: {},
    };
  }
  const g = db.guilds[guildId];
  if (!g.staff_messages) g.staff_messages = {};
  if (!g.staff_mods) g.staff_mods = {};
  return g;
}

export function ensureGuild(guildId: string) {
  const db = load();
  getGuild(db, guildId);
  save(db);
}

export function getGuildSettings(guildId: string) {
  const db = load();
  return getGuild(db, guildId);
}

export function setGuildSetting(guildId: string, key: string, value: string) {
  const db = load();
  const guild = getGuild(db, guildId);
  (guild as any)[key] = value;
  save(db);
}

export function isProtectionEnabled(guildId: string, feature: string): boolean {
  const db = load();
  const guild = getGuild(db, guildId);
  return guild.protections[feature] === true;
}

export function setProtection(guildId: string, feature: string, enabled: boolean) {
  const db = load();
  const guild = getGuild(db, guildId);
  guild.protections[feature] = enabled;
  save(db);
}

export function getAllProtections(guildId: string) {
  const db = load();
  const guild = getGuild(db, guildId);
  return Object.entries(guild.protections).map(([feature, enabled]) => ({
    feature,
    enabled: enabled ? 1 : 0,
  }));
}

export function getBlacklistedWords(guildId: string): string[] {
  const db = load();
  return getGuild(db, guildId).blacklisted_words;
}

export function addBlacklistedWord(guildId: string, word: string) {
  const db = load();
  const guild = getGuild(db, guildId);
  const w = word.toLowerCase();
  if (!guild.blacklisted_words.includes(w)) {
    guild.blacklisted_words.push(w);
    save(db);
  }
}

export function removeBlacklistedWord(guildId: string, word: string) {
  const db = load();
  const guild = getGuild(db, guildId);
  guild.blacklisted_words = guild.blacklisted_words.filter(
    (w) => w !== word.toLowerCase()
  );
  save(db);
}

export function getRateLimit(
  guildId: string,
  action: string
): { limit_count: number; limit_target: string } | null {
  const db = load();
  return getGuild(db, guildId).rate_limits[action] ?? null;
}

export function setRateLimit(
  guildId: string,
  action: string,
  limitCount: number,
  limitTarget: string
) {
  const db = load();
  const guild = getGuild(db, guildId);
  guild.rate_limits[action] = { limit_count: limitCount, limit_target: limitTarget };
  save(db);
}

export function getAllRateLimits(guildId: string) {
  const db = load();
  const guild = getGuild(db, guildId);
  return Object.entries(guild.rate_limits).map(([action, val]) => ({
    action,
    limit_count: val.limit_count,
    limit_target: val.limit_target,
  }));
}

const WINDOW_MS = 10 * 60 * 1000;

export function trackAction(guildId: string, userId: string, action: string): number {
  const db = load();
  const guild = getGuild(db, guildId);
  const key = `${userId}:${action}`;
  const now = Date.now();
  const entry = guild.action_counts[key];

  if (!entry || now - entry.window_start > WINDOW_MS) {
    guild.action_counts[key] = { count: 1, window_start: now };
    save(db);
    return 1;
  }

  entry.count += 1;
  save(db);
  return entry.count;
}

export function resetActionCount(guildId: string, userId: string, action: string) {
  const db = load();
  const guild = getGuild(db, guildId);
  delete guild.action_counts[`${userId}:${action}`];
  save(db);
}

export function getUserPermissions(guildId: string, userId: string): string[] {
  const db = load();
  return getGuild(db, guildId).user_permissions[userId] ?? [];
}

export function addUserPermission(guildId: string, userId: string, permission: string) {
  const db = load();
  const guild = getGuild(db, guildId);
  if (!guild.user_permissions[userId]) guild.user_permissions[userId] = [];
  if (!guild.user_permissions[userId].includes(permission)) {
    guild.user_permissions[userId].push(permission);
    save(db);
  }
}

export function removeUserPermission(guildId: string, userId: string, permission: string) {
  const db = load();
  const guild = getGuild(db, guildId);
  if (guild.user_permissions[userId]) {
    guild.user_permissions[userId] = guild.user_permissions[userId].filter(
      (p) => p !== permission
    );
    save(db);
  }
}

export function getRolePermissions(guildId: string, roleId: string): string[] {
  const db = load();
  return getGuild(db, guildId).role_permissions[roleId] ?? [];
}

export function addRolePermission(guildId: string, roleId: string, permission: string) {
  const db = load();
  const guild = getGuild(db, guildId);
  if (!guild.role_permissions[roleId]) guild.role_permissions[roleId] = [];
  if (!guild.role_permissions[roleId].includes(permission)) {
    guild.role_permissions[roleId].push(permission);
    save(db);
  }
}

export function removeRolePermission(guildId: string, roleId: string, permission: string) {
  const db = load();
  const guild = getGuild(db, guildId);
  if (guild.role_permissions[roleId]) {
    guild.role_permissions[roleId] = guild.role_permissions[roleId].filter(
      (p) => p !== permission
    );
    save(db);
  }
}

export function getAllUserPermissions(guildId: string) {
  const db = load();
  const guild = getGuild(db, guildId);
  const result: { user_id: string; permission: string }[] = [];
  for (const [userId, perms] of Object.entries(guild.user_permissions)) {
    for (const permission of perms) {
      result.push({ user_id: userId, permission });
    }
  }
  return result;
}

export function getAllRolePermissions(guildId: string) {
  const db = load();
  const guild = getGuild(db, guildId);
  const result: { role_id: string; permission: string }[] = [];
  for (const [roleId, perms] of Object.entries(guild.role_permissions)) {
    for (const permission of perms) {
      result.push({ role_id: roleId, permission });
    }
  }
  return result;
}

// ─── Staff Tracking ───────────────────────────────────────────────────────────

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function monthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

export function recordStaffMessage(guildId: string, userId: string) {
  const db = load();
  const guild = getGuild(db, guildId);
  const day = todayKey();
  if (!guild.staff_messages[userId]) guild.staff_messages[userId] = {};
  guild.staff_messages[userId][day] = (guild.staff_messages[userId][day] ?? 0) + 1;
  save(db);
}

export function recordStaffMod(
  guildId: string,
  userId: string,
  type: keyof ModStats
) {
  const db = load();
  const guild = getGuild(db, guildId);
  const day = todayKey();
  if (!guild.staff_mods[userId]) guild.staff_mods[userId] = {};
  if (!guild.staff_mods[userId][day])
    guild.staff_mods[userId][day] = { W: 0, M: 0, K: 0, B: 0, C: 0 };
  guild.staff_mods[userId][day][type]++;
  save(db);
}

function sumMessages(data: Record<string, number>, prefix: string): number {
  return Object.entries(data)
    .filter(([k]) => k.startsWith(prefix))
    .reduce((acc, [, v]) => acc + v, 0);
}

function sumMods(
  data: Record<string, ModStats>,
  prefix: string
): ModStats {
  const result: ModStats = { W: 0, M: 0, K: 0, B: 0, C: 0 };
  for (const [k, v] of Object.entries(data)) {
    if (k.startsWith(prefix)) {
      result.W += v.W;
      result.M += v.M;
      result.K += v.K;
      result.B += v.B;
      result.C += v.C;
    }
  }
  return result;
}

function calcScore(messages: number, mods: ModStats): number {
  return (
    messages * 10 +
    mods.W * 2 +
    mods.M * 3 +
    mods.K * 3 +
    mods.B * 5 +
    mods.C * 1
  );
}

export interface StaffEntry {
  userId: string;
  score: number;
  messages: number;
  mods: ModStats;
}

export function getDailyStaffStats(guildId: string): StaffEntry[] {
  const db = load();
  const guild = getGuild(db, guildId);
  const day = todayKey();
  const userIds = new Set([
    ...Object.keys(guild.staff_messages),
    ...Object.keys(guild.staff_mods),
  ]);

  const entries: StaffEntry[] = [];
  for (const userId of userIds) {
    const messages = guild.staff_messages[userId]?.[day] ?? 0;
    const mods = guild.staff_mods[userId]?.[day]
      ? sumMods(guild.staff_mods[userId], day)
      : { W: 0, M: 0, K: 0, B: 0, C: 0 };
    const score = calcScore(messages, mods);
    if (score > 0) entries.push({ userId, score, messages, mods });
  }

  return entries.sort((a, b) => b.score - a.score);
}

export function getMonthlyStaffStats(guildId: string): StaffEntry[] {
  const db = load();
  const guild = getGuild(db, guildId);
  const month = monthKey();
  const userIds = new Set([
    ...Object.keys(guild.staff_messages),
    ...Object.keys(guild.staff_mods),
  ]);

  const entries: StaffEntry[] = [];
  for (const userId of userIds) {
    const messages = sumMessages(guild.staff_messages[userId] ?? {}, month);
    const mods = sumMods(guild.staff_mods[userId] ?? {}, month);
    const score = calcScore(messages, mods);
    if (score > 0) entries.push({ userId, score, messages, mods });
  }

  return entries.sort((a, b) => b.score - a.score);
}

export function getLastDailyReport(guildId: string): string {
  const db = load();
  return getGuild(db, guildId).last_daily_report ?? "";
}

export function setLastDailyReport(guildId: string, date: string) {
  const db = load();
  const guild = getGuild(db, guildId);
  guild.last_daily_report = date;
  save(db);
}

export function getLastMonthlyReport(guildId: string): string {
  const db = load();
  return getGuild(db, guildId).last_monthly_report ?? "";
}

export function setLastMonthlyReport(guildId: string, month: string) {
  const db = load();
  const guild = getGuild(db, guildId);
  guild.last_monthly_report = month;
  save(db);
}
