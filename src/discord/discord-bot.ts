import { loadEnvConfig } from "@next/env";
import { Client, Events, GatewayIntentBits, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { ForgentDiscordGateway } from "./discord-gateway";
import { replyToDiscordHandoff, routeDiscordMention } from "./discord-workflow";

loadEnvConfig(process.cwd());
const required=["DISCORD_BOT_TOKEN","DISCORD_GUILD_ID","DISCORD_SUPPORT_CHANNEL_ID","DISCORD_STAFF_CHANNEL_ID","DISCORD_AGENT_ID","FORGENT_API_KEY"] as const;
const missing=required.filter(name=>!process.env[name]?.trim());
if(missing.length){console.error(`Missing configuration: ${missing.join(", ")}. Add these values to .env.local.`);process.exit(1);}
const token=process.env.DISCORD_BOT_TOKEN!;
const guildId=process.env.DISCORD_GUILD_ID!;
const supportChannelId=process.env.DISCORD_SUPPORT_CHANNEL_ID!;
const staffChannelId=process.env.DISCORD_STAFF_CHANNEL_ID!;
const agentId=process.env.DISCORD_AGENT_ID!;
if(supportChannelId===staffChannelId){console.error("Support and staff channels must be different.");process.exit(1);}
const gateway=new ForgentDiscordGateway(process.env.FORGENT_API_KEY!,process.env.FORGENT_BASE_URL || undefined);
const client=new Client({intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildMessages]});
const activeReplies=new Set<string>();
const activeMessages=new Set<string>();
const heartbeatDetails={guildId,supportChannelId,staffChannelId,agentId};
let heartbeatTimer:ReturnType<typeof setInterval>|undefined;
let configured=false;
async function heartbeat(){try{await gateway.heartbeat(heartbeatDetails);}catch{console.error("Cannot reach Forgent or the API key is invalid. Check the local app and key.");}}
client.once(Events.ClientReady,async ready=>{
 try{
  const guild=await ready.guilds.fetch(guildId);const staff=await guild.channels.fetch(staffChannelId);const support=await guild.channels.fetch(supportChannelId);
  if(!staff||!support||!staff.isTextBased()||!support.isTextBased()||!("send" in staff)||!("send" in support))throw new Error("Configured channels must be text channels in the configured server.");
  if("permissionsFor" in staff&&staff.permissionsFor(guild.roles.everyone)?.has(PermissionFlagsBits.ViewChannel))throw new Error("The staff channel must not be visible to @everyone.");
  await gateway.heartbeat(heartbeatDetails);
  const command=new SlashCommandBuilder().setName("reply").setDescription("Reply to a Forgent support handoff").setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages).addStringOption(option=>option.setName("ticket").setDescription("The full ticket ID").setRequired(true)).addStringOption(option=>option.setName("message").setDescription("Reply to the community member").setRequired(true).setMaxLength(1800));
  await guild.commands.create(command.toJSON());
  configured=true;
  heartbeatTimer=setInterval(()=>void heartbeat(),20000);
  console.log(`Forgent Discord bot connected as ${ready.user.tag}.`);
 }catch(error){console.error(`Bot setup failed: ${error instanceof Error?error.message:"unknown error"}`);await client.destroy();process.exitCode=1;}
});
client.on(Events.MessageCreate,async message=>{
 if(!configured||!client.user||message.author.bot||message.webhookId||message.guildId!==guildId||message.channelId!==supportChannelId||!message.mentions.users.has(client.user.id)||activeMessages.has(message.id))return;
 const question=message.content.replace(new RegExp(`<@!?${client.user.id}>`,"g"),"").trim();
 if(!question){await message.reply({content:"Mention me with a question about the knowledge base.",allowedMentions:{parse:[]}}).catch(()=>{});return;}
 activeMessages.add(message.id);
 try{
  await routeDiscordMention(gateway,agentId,question,{guildId,channelId:message.channelId,messageId:message.id,userId:message.author.id},async text=>{const staff=await client.channels.fetch(staffChannelId);if(!staff||!staff.isTextBased()||!("send" in staff))throw new Error("Staff channel unavailable.");await staff.send({content:text,allowedMentions:{parse:[]}});},async text=>{await message.reply({content:text,allowedMentions:{parse:[]}});});
 }catch(error){console.error(`Support request failed: ${error instanceof Error?error.message:"unknown error"}`);await message.reply({content:"I couldn’t complete this request. Please contact the support team.",allowedMentions:{parse:[]}}).catch(()=>{});}
 finally{activeMessages.delete(message.id);}
});
client.on(Events.InteractionCreate,async interaction=>{
 if(!configured||!interaction.isChatInputCommand()||interaction.commandName!=="reply")return;
 if(interaction.guildId!==guildId||interaction.channelId!==staffChannelId||!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)){await interaction.reply({content:"Use this command in the configured staff channel with Manage Messages permission.",flags:MessageFlags.Ephemeral});return;}
 const ticketId=interaction.options.getString("ticket",true);const reply=interaction.options.getString("message",true);
 if(activeReplies.has(ticketId)){await interaction.reply({content:"A reply is already being sent for this ticket.",flags:MessageFlags.Ephemeral});return;}
 activeReplies.add(ticketId);await interaction.deferReply({flags:MessageFlags.Ephemeral});
 try{await replyToDiscordHandoff(gateway,ticketId,reply,guildId,supportChannelId,async(channelId,messageId,text)=>{const channel=await client.channels.fetch(channelId);if(!channel||!channel.isTextBased()||!("send" in channel))throw new Error("Support channel unavailable.");await channel.send({content:text,reply:{messageReference:messageId},allowedMentions:{parse:[]}});});await interaction.editReply("Reply sent and handoff resolved.");}
 catch(error){await interaction.editReply(`Could not complete the reply: ${error instanceof Error?error.message:"unknown error"}. Check the ticket before retrying.`);}
 finally{activeReplies.delete(ticketId);}
});
for(const signal of ["SIGINT","SIGTERM"] as const)process.once(signal,()=>{if(heartbeatTimer)clearInterval(heartbeatTimer);client.destroy();});
client.login(token).catch(()=>{console.error("Discord login failed. Check the bot token.");process.exitCode=1;});
