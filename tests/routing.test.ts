import { describe, it, expect } from "vitest";
import RootPage from "@/app/page";
import {
  NAVIGATION_REGISTRY,
  getNavigationForRole,
} from "@/lib/navigation";

describe("Root Routing & Navigation Verification", () => {
  it("renders the Public Marketplace homepage for GET /", () => {
    const page = RootPage();
    expect(page).toBeDefined();
  });

  it("verifies that /buyer/overview is registered in the canonical navigation registry", () => {
    const buyerOverviewNav = NAVIGATION_REGISTRY.find(
      (item) => item.route === "/buyer/overview"
    );
    expect(buyerOverviewNav).toBeDefined();
    expect(buyerOverviewNav?.role).toBe("BUYER");
    expect(buyerOverviewNav?.section).toBe("Overview");
  });

  it("verifies that /builder/overview is registered in the canonical navigation registry", () => {
    const builderOverviewNav = NAVIGATION_REGISTRY.find(
      (item) => item.route === "/builder/overview"
    );
    expect(builderOverviewNav).toBeDefined();
    expect(builderOverviewNav?.role).toBe("BUILDER");
    expect(builderOverviewNav?.section).toBe("Overview");
  });

  it("verifies that /enterprise is registered in the canonical navigation registry", () => {
    const enterpriseNav = NAVIGATION_REGISTRY.find(
      (item) => item.route === "/enterprise"
    );
    expect(enterpriseNav).toBeDefined();
    expect(enterpriseNav?.role).toBe("BUYER");
    expect(enterpriseNav?.section).toBe("Overview");
  });

  it("verifies that /login is registered as a public route", () => {
    const loginNav = NAVIGATION_REGISTRY.find(
      (item) => item.route === "/login"
    );
    expect(loginNav).toBeDefined();
    expect(loginNav?.role).toBe("PUBLIC");
    expect(loginNav?.section).toBe("Public");
  });

  it("enforces strict role-boundary isolation in navigation helper", () => {
    const buyerNav = getNavigationForRole("BUYER");
    const builderNav = getNavigationForRole("BUILDER");
    const publicNav = getNavigationForRole("PUBLIC");

    // Buyer nav contains buyer routes and public routes, but zero builder routes
    expect(buyerNav.some((n) => n.route === "/buyer/overview")).toBe(true);
    expect(buyerNav.some((n) => n.route === "/builder/overview")).toBe(false);
    expect(buyerNav.some((n) => n.role === "BUILDER")).toBe(false);

    // Builder nav contains builder routes and public routes, but zero buyer routes
    expect(builderNav.some((n) => n.route === "/builder/overview")).toBe(true);
    expect(builderNav.some((n) => n.route === "/buyer/overview")).toBe(false);
    expect(builderNav.some((n) => n.role === "BUYER")).toBe(false);

    // Public nav contains only public routes
    expect(publicNav.every((n) => n.role === "PUBLIC")).toBe(true);
  });
});
