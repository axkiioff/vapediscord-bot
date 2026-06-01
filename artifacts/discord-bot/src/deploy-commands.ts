import { REST, Routes } from "discord.js";
import { pathToFileURL } from "url";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error("DISCORD_BOT_TOKEN not set.");
  process.exit(1);
}

const commands: any[] = [];
const commandsDir = path.join(__dirname, "commands");
const files = fs.readdirSync(commandsDir).filter((f) => f.endsWith(".ts") || f.endsWith(".js"));

for (const file of files) {
  const mod = await import(pathToFileURL(path.join(commandsDir, file)).href);
  if (mod.data) {
    commands.push(mod.data.toJSON());
  }
}

const rest = new REST().setToken(token);

console.log(`Deploying ${commands.length} slash commands globally...`);

const clientId = process.env.DISCORD_CLIENT_ID;
if (!clientId) {
  console.log("No DISCORD_CLIENT_ID set — fetching from token...");
  const me = await rest.get(Routes.user()) as any;
  console.log(`Client ID: ${me.id}`);
  await rest.put(Routes.applicationCommands(me.id), { body: commands });
} else {
  await rest.put(Routes.applicationCommands(clientId), { body: commands });
}

console.log("Slash commands deployed successfully.");
