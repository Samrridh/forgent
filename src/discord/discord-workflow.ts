import type { DiscordMessageContext, ForgentDiscordGateway } from "./discord-gateway";
export function shortMessage(text:string,max=1800){return text.length<=max?text:`${text.slice(0,max-1)}…`;}
export async function routeDiscordMention(gateway:Pick<ForgentDiscordGateway,"run">,agentId:string,question:string,context:DiscordMessageContext,sendStaff:(text:string)=>Promise<void>,sendPublic:(text:string)=>Promise<void>){
 const run=await gateway.run(agentId,question,context);
 if(run.output.action==="handoff"){
  if(!run.ticket_id)throw new Error("Handoff missing a ticket ID.");
  await sendStaff(shortMessage(`**Forgent handoff**\nTicket: \`${run.ticket_id}\`\nQuestion: ${question}\nReason: ${run.output.reason}\nUse /reply with this ticket ID to respond.`,1900));
  await sendPublic(shortMessage(run.output.answer));
 }else{const citations=run.output.sources.length?`\n\nSources: ${run.output.sources.join(", ")}`:"";await sendPublic(shortMessage(`${run.output.answer}${citations}`));}
}
export async function replyToDiscordHandoff(gateway:Pick<ForgentDiscordGateway,"ticket"|"resolve">,ticketId:string,reply:string,guildId:string,supportChannelId:string,sendReply:(channelId:string,messageId:string,text:string)=>Promise<void>){
 const ticket=await gateway.ticket(ticketId);
 if(ticket.status!=="open")throw new Error("This ticket is already resolved.");
 if(ticket.discord.guildId!==guildId||ticket.discord.channelId!==supportChannelId)throw new Error("Ticket does not belong to this support channel.");
 await sendReply(ticket.discord.channelId,ticket.discord.messageId,shortMessage(reply));
 await gateway.resolve(ticketId,reply);
}
