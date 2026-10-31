export type AgentCategory =
  | "Finance"
  | "Legal"
  | "DevOps"
  | "Healthcare"
  | "Data"
  | "Copywriting"
  | "Customer Support"
  | "HR"
  | "Cybersecurity"
  | "E-Commerce"
  | "Research"
  | "Growth";

export const AGENT_CATEGORIES: AgentCategory[] = [
  "Finance",
  "Legal",
  "DevOps",
  "Healthcare",
  "Data",
  "Copywriting",
  "Customer Support",
  "HR",
  "Cybersecurity",
  "E-Commerce",
  "Research",
  "Growth",
];

export interface Agent {
  id: string;
  slug: string;
  title: string;
  creatorHandle: string;
  category: AgentCategory;
  bio: string;
  verified: boolean;
  benchmarkScore: number; // e.g. 99.2
  pricePerTaskUsd: number; // e.g. 2.50
  pricePerTaskInr: number; // e.g. 200
  rating: number; // e.g. 4.94
  ratingCount: number;
  tasksCompleted: number;
  latencyMs: number;
  tags: string[];
  capabilities: string[];
  runtimeType: "deterministic" | "llm-assisted" | "hybrid";
  version: string;
}

export type AgentSortOption =
  | "recommended"
  | "rating-desc"
  | "tasks-desc"
  | "price-asc"
  | "price-desc"
  | "latency-asc";

export interface AgentFilterState {
  searchQuery: string;
  category: AgentCategory | "ALL";
  minPriceUsd: number;
  maxPriceUsd: number;
  minRating: number;
  verifiedOnly: boolean;
  sortBy: AgentSortOption;
}
