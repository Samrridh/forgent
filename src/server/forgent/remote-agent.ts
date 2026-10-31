import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { request as httpsRequest } from "node:https";
import { AgentOutputSchema, type AgentOutput, type Article } from "./contracts";

export class RemoteAgentError extends Error {}
function privateAddress(address:string):boolean {
 const ip=address.toLowerCase();
 if(isIP(ip)===6) return !/^[23]/.test(ip);
 const parts=ip.split(".").map(Number);return parts.length!==4||parts[0]===0||parts[0]===10||parts[0]===127||parts[0]>=224||(parts[0]===169&&parts[1]===254)||(parts[0]===172&&parts[1]>=16&&parts[1]<=31)||(parts[0]===192&&parts[1]===168)||(parts[0]===100&&parts[1]>=64&&parts[1]<=127);
}
async function resolveEndpoint(raw:string):Promise<{url:URL;sample:boolean;address?:{address:string;family:number}}>{
 let url:URL;try{url=new URL(raw);}catch{throw new RemoteAgentError("Enter a valid endpoint URL.");}
 if(url.username||url.password||url.hash)throw new RemoteAgentError("Endpoint URLs cannot contain credentials or fragments.");
 const sample=url.protocol==="http:"&&["localhost","127.0.0.1"].includes(url.hostname)&&url.port==="3000"&&url.pathname==="/api/builder/sample-agent"&&!url.search;
 if(sample)return {url,sample};
 if(url.protocol!=="https:")throw new RemoteAgentError("Use a public HTTPS endpoint or the provided local sample endpoint.");
 try{const addresses=await lookup(url.hostname,{all:true,verbatim:true});if(!addresses.length||addresses.some(item=>privateAddress(item.address)))throw new Error("private");return {url,sample,address:addresses[0]};}catch{throw new RemoteAgentError("The endpoint must resolve to a public address.");}
}
export async function validateEndpoint(raw:string):Promise<void>{await resolveEndpoint(raw);}
function readPinnedHttps(url:URL,address:{address:string;family:number},body:string):Promise<string>{
 return new Promise((resolve,reject)=>{
  const req=httpsRequest({hostname:url.hostname,port:url.port||443,path:url.pathname+url.search,method:"POST",headers:{"Content-Type":"application/json","Content-Length":Buffer.byteLength(body)},family:address.family,lookup:(_hostname,_options,callback)=>callback(null,address.address,address.family)},res=>{
   if(!res.statusCode||res.statusCode<200||res.statusCode>=300){res.resume();reject(new RemoteAgentError(`Endpoint returned HTTP ${res.statusCode||0}.`));return;}
   const chunks:Buffer[]=[];let bytes=0;res.on("data",(chunk:Buffer)=>{bytes+=chunk.length;if(bytes>65536){req.destroy();reject(new RemoteAgentError("Endpoint response is too large."));return;}chunks.push(chunk);});res.on("end",()=>resolve(Buffer.concat(chunks).toString("utf8")));res.on("error",()=>reject(new RemoteAgentError("Endpoint response was interrupted.")));
  });
  req.setTimeout(6000,()=>req.destroy());req.on("error",()=>reject(new RemoteAgentError("Endpoint could not be reached or timed out.")));req.end(body);
 });
}
export async function invokeRemoteAgent(endpointUrl:string,question:string,articles:Article[]):Promise<AgentOutput>{
 const target=await resolveEndpoint(endpointUrl);const body=JSON.stringify({question,articles});let text:string;
 if(target.sample){let response:Response;try{response=await fetch(target.url,{method:"POST",headers:{"Content-Type":"application/json"},body,redirect:"error",signal:AbortSignal.timeout(6000)});}catch{throw new RemoteAgentError("Sample endpoint could not be reached or timed out.");}if(!response.ok)throw new RemoteAgentError(`Endpoint returned HTTP ${response.status}.`);text=await response.text();}
 else{text=await readPinnedHttps(target.url,target.address!,body);}
 try{if(text.length>65536)throw new Error("large");return AgentOutputSchema.parse(JSON.parse(text));}catch{throw new RemoteAgentError("Endpoint returned an invalid support-agent response.");}
}
