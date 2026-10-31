export type UserRole = "BUYER" | "BUILDER" | "PUBLIC";

export interface NavigationItem {
  id: string;
  route: string;
  label: string;
  section: "Overview" | "Operations" | "Catalog" | "Commercial" | "Publishing" | "Public";
  role: UserRole;
  phase: "P0" | "P1" | "P2" | "P3" | "P4" | "P5" | "P6" | "P7" | "P8" | "P9";
  badge?: string;
}

export const NAVIGATION_REGISTRY: NavigationItem[] = [
  // Public / Authentication
  {
    id: "nav-login",
    route: "/login",
    label: "Sign In",
    section: "Public",
    role: "PUBLIC",
    phase: "P1",
  },
  {
    id: "nav-templates",
    route: "/templates",
    label: "Templates Hub",
    section: "Public",
    role: "PUBLIC",
    phase: "P1",
  },
  {
    id: "nav-receiving-solution",
    route: "/solutions/receiving",
    label: "Receiving Wedge",
    section: "Public",
    role: "PUBLIC",
    phase: "P1",
    badge: "Northstar",
  },

  // Buyer Persona Navigation
  {
    id: "nav-buyer-overview",
    route: "/buyer/overview",
    label: "Command Centre",
    section: "Overview",
    role: "BUYER",
    phase: "P1",
  },
  {
    id: "nav-enterprise",
    route: "/enterprise",
    label: "Enterprise Workflow Hub",
    section: "Overview",
    role: "BUYER",
    phase: "P1",
  },
  {
    id: "nav-enterprise-policies",
    route: "/enterprise/policies",
    label: "Compliance & SLA Policies",
    section: "Operations",
    role: "BUYER",
    phase: "P2",
  },
  {
    id: "nav-buyer-jobs",
    route: "/buyer/jobs",
    label: "Jobs & Work Orders",
    section: "Operations",
    role: "BUYER",
    phase: "P2",
  },
  {
    id: "nav-buyer-receiving-wedge",
    route: "/solutions/receiving",
    label: "Receiving Wedge",
    section: "Operations",
    role: "BUYER",
    phase: "P1",
    badge: "Northstar",
  },
  {
    id: "nav-buyer-jobs-new",
    route: "/buyer/jobs/new",
    label: "Create Job Wizard",
    section: "Operations",
    role: "BUYER",
    phase: "P2",
  },
  {
    id: "nav-buyer-marketplace",
    route: "/buyer/marketplace",
    label: "Agent Catalog",
    section: "Catalog",
    role: "BUYER",
    phase: "P2",
  },
  {
    id: "nav-buyer-transactions",
    route: "/buyer/transactions",
    label: "Spend & Settlement",
    section: "Commercial",
    role: "BUYER",
    phase: "P6",
  },
  {
    id: "nav-disputes",
    route: "/disputes",
    label: "Disputes & Arbitration",
    section: "Operations",
    role: "BUYER",
    phase: "P2",
  },

  // Builder Persona Navigation
  {
    id: "nav-builder-overview",
    route: "/builder/overview",
    label: "Studio Command",
    section: "Overview",
    role: "BUILDER",
    phase: "P1",
  },
  {
    id: "nav-builder-agents",
    route: "/builder/agents",
    label: "My Agents & Versions",
    section: "Publishing",
    role: "BUILDER",
    phase: "P2",
  },
  {
    id: "nav-builder-agents-publish",
    route: "/builder/agents/publish",
    label: "Publish Agent Package",
    section: "Publishing",
    role: "BUILDER",
    phase: "P2",
    badge: "ZIP Upload",
  },
  {
    id: "nav-builder-profile",
    route: "/builder/profile",
    label: "Studio Profile",
    section: "Publishing",
    role: "BUILDER",
    phase: "P2",
  },
  {
    id: "nav-builder-contributions",
    route: "/builder/contributions",
    label: "Stage Contributions",
    section: "Commercial",
    role: "BUILDER",
    phase: "P6",
  },
  {
    id: "nav-builder-earnings",
    route: "/builder/earnings",
    label: "Eligible Earnings",
    section: "Commercial",
    role: "BUILDER",
    phase: "P6",
  },
];

export function getNavigationForRole(role: UserRole): NavigationItem[] {
  if (role === "PUBLIC") {
    return NAVIGATION_REGISTRY.filter((item) => item.role === "PUBLIC");
  }
  return NAVIGATION_REGISTRY.filter((item) => item.role === role || item.role === "PUBLIC");
}
