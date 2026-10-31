export type UserRole = "BUYER" | "CREATOR" | "ENTERPRISE_ADMIN";

export interface OrganizationMembership {
  id: string;
  name: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  tier: "PERSONAL" | "ENTERPRISE";
}

export interface ForgentUserSession {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  activeOrganizationId: string;
  activeOrganizationName: string;
  organizations: OrganizationMembership[];
  issuedAt: number;
  expiresAt: number;
}

export const DEMO_PERSONAS: Record<UserRole, ForgentUserSession> = {
  BUYER: {
    userId: "usr_sarah_chen_buyer",
    email: "sarah.chen@northstarlogistics.com",
    name: "Sarah Chen",
    role: "BUYER",
    activeOrganizationId: "org_northstar_logistics",
    activeOrganizationName: "Northstar Logistics Enterprise",
    organizations: [
      {
        id: "org_personal_sarah",
        name: "Personal Workspace",
        role: "OWNER",
        tier: "PERSONAL",
      },
      {
        id: "org_northstar_logistics",
        name: "Northstar Logistics Enterprise",
        role: "ADMIN",
        tier: "ENTERPRISE",
      },
      {
        id: "org_apex_capital",
        name: "Apex Capital LLC",
        role: "MEMBER",
        tier: "ENTERPRISE",
      },
    ],
    issuedAt: 0,
    expiresAt: 0,
  },
  CREATOR: {
    userId: "usr_alex_rivera_creator",
    email: "alex.rivera@autofintech.io",
    name: "Alex Rivera",
    role: "CREATOR",
    activeOrganizationId: "org_autofintech_studio",
    activeOrganizationName: "Autonomous FinTech Studio",
    organizations: [
      {
        id: "org_personal_alex",
        name: "Personal Workspace",
        role: "OWNER",
        tier: "PERSONAL",
      },
      {
        id: "org_autofintech_studio",
        name: "Autonomous FinTech Studio",
        role: "OWNER",
        tier: "ENTERPRISE",
      },
    ],
    issuedAt: 0,
    expiresAt: 0,
  },
  ENTERPRISE_ADMIN: {
    userId: "usr_marcus_vance_admin",
    email: "marcus.vance@apexcapital.com",
    name: "Marcus Vance",
    role: "ENTERPRISE_ADMIN",
    activeOrganizationId: "org_apex_capital",
    activeOrganizationName: "Apex Capital LLC",
    organizations: [
      {
        id: "org_personal_marcus",
        name: "Personal Workspace",
        role: "OWNER",
        tier: "PERSONAL",
      },
      {
        id: "org_apex_capital",
        name: "Apex Capital LLC",
        role: "ADMIN",
        tier: "ENTERPRISE",
      },
      {
        id: "org_northstar_logistics",
        name: "Northstar Logistics Enterprise",
        role: "MEMBER",
        tier: "ENTERPRISE",
      },
    ],
    issuedAt: 0,
    expiresAt: 0,
  },
};

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

/**
 * Creates a fresh session object for a given demo persona.
 */
export function createPersonaSession(
  role: UserRole,
  organizationId?: string
): ForgentUserSession {
  const template = DEMO_PERSONAS[role] || DEMO_PERSONAS.BUYER;
  const now = Date.now();
  const expiresAt = now + COOKIE_MAX_AGE_SECONDS * 1000;

  let activeOrgId = template.activeOrganizationId;
  let activeOrgName = template.activeOrganizationName;

  if (organizationId) {
    const match = template.organizations.find((o) => o.id === organizationId);
    if (match) {
      activeOrgId = match.id;
      activeOrgName = match.name;
    }
  }

  return {
    ...template,
    activeOrganizationId: activeOrgId,
    activeOrganizationName: activeOrgName,
    issuedAt: now,
    expiresAt,
  };
}

/**
 * Creates a new session from a magic link email.
 */
export function createEmailSession(
  email: string,
  role: UserRole = "BUYER",
  name?: string
): ForgentUserSession {
  const now = Date.now();
  const expiresAt = now + COOKIE_MAX_AGE_SECONDS * 1000;
  const username = name || email.split("@")[0].replace(/[._-]/g, " ");
  const capitalizedName = username
    .split(" ")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");

  const personalOrg: OrganizationMembership = {
    id: `org_pers_${Math.random().toString(36).substring(2, 8)}`,
    name: "Personal Workspace",
    role: "OWNER",
    tier: "PERSONAL",
  };

  const enterpriseOrg: OrganizationMembership = {
    id: "org_northstar_logistics",
    name: "Northstar Logistics Enterprise",
    role: role === "ENTERPRISE_ADMIN" ? "ADMIN" : "MEMBER",
    tier: "ENTERPRISE",
  };

  return {
    userId: `usr_${Math.random().toString(36).substring(2, 10)}`,
    email,
    name: capitalizedName,
    role,
    activeOrganizationId: personalOrg.id,
    activeOrganizationName: personalOrg.name,
    organizations: [personalOrg, enterpriseOrg],
    issuedAt: now,
    expiresAt,
  };
}
