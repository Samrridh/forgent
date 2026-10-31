import { notFound } from "next/navigation";
import { AgentDetail } from "@/components/forgent/agent-detail";
import { PublishedAgentDetail } from "@/components/forgent/published-agent-detail";
import { exampleAgents } from "@/data/example-agents";
import { ExampleAgentDetail } from "@/components/forgent/example-agent-detail";
import { withDemoStore } from "@/server/forgent/demo-store";
export const dynamic="force-dynamic";
export default async function AgentPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;if(slug==="knowledge-support")return <AgentDetail/>;const example=exampleAgents.find(item=>item.id===slug);if(example)return <ExampleAgentDetail agent={example}/>;const agent=await withDemoStore(store=>store.agents.find(item=>item.id===slug&&item.status==="published"));if(!agent)notFound();return <PublishedAgentDetail agent={{id:agent.id,name:agent.name,description:agent.description,priceMicros:agent.priceMicros,report:agent.report}}/>}
