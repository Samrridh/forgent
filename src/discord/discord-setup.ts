import { loadEnvConfig } from "@next/env";
import { createInterface } from "node:readline/promises";
import { once } from "node:events";
import { stdin, stdout } from "node:process";
import { ChannelType, Client, Events, GatewayIntentBits, PermissionFlagsBits } from "discord.js";
import { z } from "zod";

loadEnvConfig(process.cwd());
const token = process.env.DISCORD_BOT_TOKEN?.trim();
if (!token) {
  console.error("Add DISCORD_BOT_TOKEN to .env.local, then run npm run discord:setup again.");
  process.exit(1);
}
const prompt = createInterface({ input: stdin, output: stdout });
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
async function choose<T>(label: string, options: { label: string; value: T }[]): Promise<T> {
  if (!options.length) throw new Error(`No ${label.toLowerCase()} available.`);
  console.log(`\n${label}`);
  options.forEach((option, index) => console.log(`  ${index + 1}. ${option.label}`));
  while (true) {
    const answer = await prompt.question("Choose a number: ");
    const index = Number(answer.trim()) - 1;
    if (Number.isInteger(index) && index >= 0 && index < options.length) return options[index].value;
    console.log("Enter one of the listed numbers.");
  }
}
async function main() {
  const ready = once(client, Events.ClientReady);
  await client.login(token);
  await ready;
  const guilds = [...client.guilds.cache.values()];
  if (!guilds.length) {
    const appId = client.user?.id;
    if (appId) console.log(`Invite this bot to your test server: https://discord.com/oauth2/authorize?client_id=${appId}&scope=bot%20applications.commands&permissions=68608`);
    throw new Error("No servers found. Invite the bot, then run this command again.");
  }
  const guild = await choose("Choose a Discord server", guilds.map(g => ({ label: g.name, value: g })));
  await guild.channels.fetch();
  const channels = [...guild.channels.cache.values()].filter(c => c?.type === ChannelType.GuildText);
  const support = await choose("Choose the support channel", channels.map(c => ({ label: `#${c.name}`, value: c })));
  const privateChannels = channels.filter(c => {
    const permissions = c.permissionsFor(guild.roles.everyone);
    return c.id !== support.id && permissions !== null && !permissions.has(PermissionFlagsBits.ViewChannel);
  });
  const staff = await choose("Choose a private staff channel", privateChannels.map(c => ({ label: `#${c.name}`, value: c })));
  let response: Response;
  try {
    const baseUrl = (process.env.FORGENT_BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
    response = await fetch(`${baseUrl}/api/console/keys`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "Discord support bot" }), signal: AbortSignal.timeout(15000) });
  } catch { throw new Error("Cannot reach Forgent. Start the local app or check FORGENT_BASE_URL, then try again."); }
  if (!response.ok) throw new Error(`Could not create a Forgent API key (HTTP ${response.status}).`);
  const { secret } = z.object({ secret: z.string().min(1) }).parse(await response.json());
  process.env.DISCORD_GUILD_ID = guild.id;
  process.env.DISCORD_SUPPORT_CHANNEL_ID = support.id;
  process.env.DISCORD_STAFF_CHANNEL_ID = staff.id;
  process.env.DISCORD_AGENT_ID = "knowledge-support";
  process.env.FORGENT_API_KEY = secret;
  console.log(`\nStarting Knowledge Support in ${guild.name} / #${support.name}. Handoffs go to #${staff.name}.`);
  client.destroy(); prompt.close();
  await import("./discord-bot");
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Discord setup failed."); client.destroy(); prompt.close(); process.exitCode = 1; });
