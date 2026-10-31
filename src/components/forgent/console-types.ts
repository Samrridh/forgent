export interface KeyItem { id:string; name:string; prefix:string; createdAt:string; revokedAt:string|null }
export interface ArticleItem { id:string; title:string; content:string }
export interface BillingItem { priceMicros:number; grossNanos:number; platformNanos:number; builderNanos:number }
export interface RunItem { billing:BillingItem|null; id:string; agent:string; agentName:string; action:"answer"|"handoff"|"result"; createdAt:string; latencyMs:number; ticketId:string|null }
export interface HandoffItem { discord?:{guildId:string;channelId:string;messageId:string;userId:string}; id:string; question:string; reason:string; status:"open"|"resolved"; reply:string|null; createdAt:string }
export async function readResponse<T>(response:Response):Promise<T>{const value:unknown=await response.json();if(!response.ok){const error=value as {error?:string};throw new Error(error.error || "Request failed.");}return value as T;}

export function demoDollars(nanos:number){const amount=(nanos/1_000_000_000).toFixed(9);const trimmed=amount.replace(/0+$/,"").replace(/\.$/,"");return `$${trimmed.includes(".")?trimmed.padEnd(trimmed.indexOf(".")+3,"0"):`${trimmed}.00`}`;}
