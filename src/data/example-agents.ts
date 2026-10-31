import { projectExampleAgents } from "./project-example-agents";

export interface ExampleAgent {
  id: string;
  name: string;
  category: string;
  description: string;
  overview: string;
  tags: string[];
  exampleInput: string;
  exampleOutput: string;
}

// Catalog entries run as text-only demonstrations; integrations are not provided.
export const exampleAgents: ExampleAgent[] = [
  { id:"example-invoice-extractor", name:"Invoice Extractor", category:"Data extraction", description:"Turn invoice documents into structured fields for your workflow.", overview:"A potential agent for extracting vendor, invoice number, line items, and totals from documents.", tags:["Invoices","Structured data","Finance"], exampleInput:"Extract the invoice number, vendor, and total from this invoice.", exampleOutput:"Invoice number, vendor name, date, line items, and total as structured data." },
  { id:"example-research-brief", name:"Research Brief", category:"Research", description:"Turn a collection of sources into a concise, cited briefing.", overview:"A potential agent for summarizing supplied research material and organizing its findings with citations.", tags:["Research","Summaries","Citations"], exampleInput:"Summarize these articles and highlight where their findings differ.", exampleOutput:"A short research brief with key findings and references to supplied sources." },
  { id:"example-code-review", name:"Code Review", category:"Developer tools", description:"Review a proposed code change for likely bugs and risks.", overview:"A potential agent for inspecting code changes and producing actionable review comments.", tags:["Code","Pull requests","Review"], exampleInput:"Review this patch for bugs and explain the most important issue.", exampleOutput:"A list of suggested review comments with affected lines and reasoning." },
  { id:"example-lead-qualifier", name:"Lead Qualifier", category:"Sales", description:"Organize inbound leads against your ideal customer profile.", overview:"A potential agent for checking lead details against qualification criteria and explaining the result.", tags:["Sales","Lead scoring","CRM"], exampleInput:"Qualify this inbound lead using our company size and industry criteria.", exampleOutput:"A qualification result with the relevant criteria and an explanation." },
  { id:"example-content-editor", name:"Content Editor", category:"Content", description:"Revise a draft for clarity, tone, and a defined audience.", overview:"A potential agent for editing text against a supplied style guide while preserving the original intent.", tags:["Writing","Editing","Style guide"], exampleInput:"Make this announcement clearer and keep the tone friendly.", exampleOutput:"An edited draft and a brief description of the suggested changes." },
  { id:"example-incident-triage", name:"Incident Triage", category:"Operations", description:"Summarize service alerts and suggest the next investigation steps.", overview:"A potential agent for organizing incident signals into a concise investigation brief for an engineer.", tags:["Operations","Alerts","Triage"], exampleInput:"Summarize these alerts and identify the services that need investigation.", exampleOutput:"An incident summary with affected services and suggested next steps." },
  ...projectExampleAgents,
];
