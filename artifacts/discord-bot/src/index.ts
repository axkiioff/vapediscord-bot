import {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
} from "discord.js";
import { pathToFileURL } from "url";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { startReportScheduler } from "./lib/reports.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [Partials.Message, Partials.Channel],
}) as Client & { commands: Collection<string, any> };

client.commands = new Collection();

const commandsDir = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsDir)
  .filter((f) => f.endsWith(".ts") || f.endsWith(".js"));

for (const file of commandFiles) {
  const mod = await import(
    pathToFileURL(path.join(commandsDir, file)).href
  );
  if (mod.data && mod.execute) {
    client.commands.set(mod.data.name, mod);
  }
}

const eventsDir = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsDir)
  .filter((f) => f.endsWith(".ts") || f.endsWith(".js"));

for (const file of eventFiles) {
  const mod = await import(
    pathToFileURL(path.join(eventsDir, file)).href
  );
  if (mod.once) {
    client.once(mod.name, (...args: any[]) => mod.execute(...args));
  } else {
    client.on(mod.name, (...args: any[]) => mod.execute(...args));
  }
}

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error("DISCORD_BOT_TOKEN is not set.");
  process.exit(1);
}

client.once("ready", () => {
  startReportScheduler(client);
});

await client.login(token);
