import type { ExampleAgent } from "./example-agents";



// Illustrative listings inspired by https://github.com/ashishpatel26/500-AI-Agents-Projects

const ideas: [string, string, string][] = [

  [

    "Health Insights",

    "Healthcare",

    "Summarize health reports and highlight information to discuss with a clinician."

  ],

  [

    "Health Assistant",

    "Healthcare",

    "Organize patient information for a healthcare workflow."

  ],

  [

    "Medical Claims Assistant",

    "Healthcare",

    "Organize hospital and insurance claim information."

  ],

  [

    "Medical Chat Assistant",

    "Healthcare",

    "Help navigate common health information questions."

  ],

  [

    "Stock Analysis",

    "Finance",

    "Summarize market information for investment research."

  ],

  [

    "Trading Research Bot",

    "Finance",

    "Organize market signals for a trading research workflow."

  ],

  [

    "Agent Wallet",

    "Finance",

    "Track proposed spending against a defined budget."

  ],

  [

    "Virtual AI Tutor",

    "Education",

    "Create learning explanations tailored to a student’s topic."

  ],

  [

    "Customer Service Chatbot",

    "Customer support",

    "Answer common questions from supplied support material."

  ],

  [

    "Product Recommendation",

    "Retail",

    "Suggest products based on stated customer preferences."

  ],

  [

    "Delivery Route Planner",

    "Operations",

    "Suggest delivery routes using supplied destinations."

  ],

  [

    "Factory Process Monitor",

    "Operations",

    "Organize production signals for a quality review."

  ],

  [

    "Property Pricing",

    "Real estate",

    "Summarize property details and comparable listings."

  ],

  [

    "Smart Farming Assistant",

    "Agriculture",

    "Organize crop observations for farm planning."

  ],

  [

    "Energy Demand Forecast",

    "Operations",

    "Review energy usage patterns for planning."

  ],

  [

    "Content Personalization",

    "Content",

    "Suggest media based on audience preferences."

  ],

  [

    "Legal Document Review",

    "Legal",

    "Highlight clauses in a supplied legal document."

  ],

  [

    "Recruitment Recommendation",

    "Recruitment",

    "Compare candidate profiles with role criteria."

  ],

  [

    "Virtual Travel Assistant",

    "Travel",

    "Build an itinerary from travel preferences."

  ],

  [

    "Game Companion",

    "Gaming",

    "Provide contextual help for a game scenario."

  ],

  [

    "Threat Detection",

    "Security",

    "Organize security signals for an analyst to review."

  ],

  [

    "Personal Shopper",

    "Retail",

    "Help shoppers narrow down product choices."

  ],

  [

    "Logistics Optimization",

    "Operations",

    "Review delivery and inventory planning options."

  ],

  [

    "Agent Memory Guard",

    "Security",

    "Flag suspicious content in agent memory."

  ],

  [

    "Privacy Sanitizer",

    "Security",

    "Identify sensitive information in supplied text."

  ],

  [

    "Career Assistant",

    "Recruitment",

    "Tailor career materials to a role description."

  ],

  [

    "Email Auto Responder",

    "Productivity",

    "Draft email replies using supplied context."

  ],

  [

    "Meeting Assistant",

    "Productivity",

    "Prepare a meeting agenda and organize notes."

  ],

  [

    "Self Evaluation",

    "Recruitment",

    "Organize examples for a performance review."

  ],

  [

    "Lead Scoring",

    "Sales",

    "Rank potential leads using supplied criteria."

  ],

  [

    "Marketing Strategy",

    "Marketing",

    "Outline a marketing plan from a product brief."

  ],

  [

    "Job Posting Generator",

    "Recruitment",

    "Draft a job posting from role requirements."

  ],

  [

    "Recruitment Workflow",

    "Recruitment",

    "Organize the steps in a hiring workflow."

  ],

  [

    "Profile Matcher",

    "Recruitment",

    "Compare a candidate profile with open positions."

  ],

  [

    "Social Post Generator",

    "Marketing",

    "Draft social posts from a campaign brief."

  ],

  [

    "Landing Page Generator",

    "Developer tools",

    "Outline landing page copy from a product description."

  ],

  [

    "Game Builder",

    "Developer tools",

    "Turn a game concept into development tasks."

  ],

  [

    "Trip Planner",

    "Travel",

    "Plan a trip using dates and preferences."

  ],

  [

    "Surprise Trip Planner",

    "Travel",

    "Suggest a surprise itinerary using traveler preferences."

  ],

  [

    "Book Writing Assistant",

    "Content",

    "Organize a book outline and writing plan."

  ],

  [

    "Screenplay Writer",

    "Content",

    "Develop a screenplay outline from a story idea."

  ],

  [

    "Markdown Validator",

    "Developer tools",

    "Review Markdown for formatting issues."

  ],

  [

    "Meeting Preparation",

    "Productivity",

    "Compile an agenda and briefing from meeting context."

  ],

  [

    "Code Generation Assistant",

    "Developer tools",

    "Suggest code based on a development task."

  ],

  [

    "Code Q&A",

    "Developer tools",

    "Answer code questions using supplied source material."

  ],

  [

    "Data Visualization Team",

    "Research",

    "Suggest charts for a supplied dataset."

  ],

  [

    "Task Planning Team",

    "Productivity",

    "Break a complex goal into smaller tasks."

  ],

  [

    "Workflow Sequencer",

    "Operations",

    "Organize tasks into an ordered workflow."

  ],

  [

    "Supply Chain Advisor",

    "Operations",

    "Review supply chain questions using provided information."

  ],

  [

    "Conversational Chess",

    "Gaming",

    "Discuss potential chess moves from a supplied position."

  ],

  [

    "Web Research",

    "Research",

    "Organize findings for a web research brief."

  ],

  [

    "Document Q&A",

    "Research",

    "Answer questions from supplied documents."

  ],

  [

    "Audio Transcription",

    "Productivity",

    "Turn a recording into a written transcript."

  ],

  [

    "Natural Language to SQL",

    "Developer tools",

    "Draft a SQL query from a plain-language request."

  ],

  [

    "Data Analysis Assistant",

    "Research",

    "Summarize patterns in supplied data."

  ],

  [

    "Research Collaboration",

    "Research",

    "Organize different perspectives on a research question."

  ],

  [

    "Code Debugging",

    "Developer tools",

    "Suggest likely causes for an error in supplied code."

  ],

  [

    "Documentation Assistant",

    "Developer tools",

    "Draft documentation for supplied code."

  ],

  [

    "Market Research",

    "Marketing",

    "Summarize competitor and market information."

  ],

  [

    "Sales Outreach",

    "Sales",

    "Draft an outreach message from lead information."

  ],

  [

    "Discord Community Guide",

    "Discord bots",

    "Help community members find answers in server resources."

  ],

  [

    "Discord Moderation Assistant",

    "Discord bots",

    "Flag messages for a moderator to review."

  ],

  [

    "Discord Event Planner",

    "Discord bots",

    "Organize community event details."

  ],

  [

    "Discord Onboarding Guide",

    "Discord bots",

    "Guide new members through community resources."

  ],

  [

    "Discord Feedback Collector",

    "Discord bots",

    "Summarize community feedback for a team."

  ],

  [

    "Slack Knowledge Assistant",

    "Slack bots",

    "Find answers in supplied team documentation."

  ],

  [

    "Slack Meeting Recap",

    "Slack bots",

    "Summarize meeting notes for a channel."

  ],

  [

    "Slack Incident Triage",

    "Slack bots",

    "Organize incident reports for responders."

  ],

  [

    "Slack Project Update",

    "Slack bots",

    "Draft project status updates from team notes."

  ],

  [

    "Slack Onboarding Guide",

    "Slack bots",

    "Help new teammates find onboarding resources."

  ]

];



export const projectExampleAgents: ExampleAgent[] = ideas.map(([name, category, description]) => ({

  id: `example-project-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, "")}`,

  name, category, description,

  overview: `A potential agent that could ${description.charAt(0).toLowerCase()}${description.slice(1)}`,

  tags: [category, "Demo"],

  exampleInput: `Help me with a ${name.toLowerCase()} task using the information provided.`,

  exampleOutput: "An illustrative response based on the supplied information.",

}));


// The first 60 are text-only OpenRouter adaptations; Discord and Slack previews remain illustrative.
export const runnableProjectAgents = projectExampleAgents.slice(0, 60);
