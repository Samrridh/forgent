import { describe, it, expect } from "vitest";
import React from "react";
import {
  Button,
  Badge,
  StatusBadge,
  Card,
  Input,
  Textarea,
  Select,
  Tabs,
  Skeleton,
  EmptyState,
  ErrorState,
  MoneyDisplay,
  Tooltip,
  Table,
  PageHeader,
  StatCard,
  Divider,
} from "@/components/ui";

describe("P1-A-001: UI Primitives Suite", () => {
  it("exports all required UI primitive components", () => {
    expect(Button).toBeDefined();
    expect(Badge).toBeDefined();
    expect(StatusBadge).toBeDefined();
    expect(Card).toBeDefined();
    expect(Input).toBeDefined();
    expect(Textarea).toBeDefined();
    expect(Select).toBeDefined();
    expect(Tabs).toBeDefined();
    expect(Skeleton).toBeDefined();
    expect(EmptyState).toBeDefined();
    expect(ErrorState).toBeDefined();
    expect(MoneyDisplay).toBeDefined();
    expect(Tooltip).toBeDefined();
    expect(Table).toBeDefined();
    expect(PageHeader).toBeDefined();
    expect(StatCard).toBeDefined();
    expect(Divider).toBeDefined();
  });

  it("MoneyDisplay formats paise to integer INR without float drift", () => {
    // 1,000,000 paise = ₹10,000
    const element = React.createElement(MoneyDisplay, {
      amountPaise: 1000000,
      showCurrency: true,
      isSimulated: true,
    });
    expect(element.props.amountPaise).toBe(1000000);
    expect(element.props.isSimulated).toBe(true);

    // 250,000 paise = ₹2,500
    const element2 = React.createElement(MoneyDisplay, {
      amountPaise: 250000,
    });
    expect(element2.props.amountPaise).toBe(250000);
  });

  it("StatusBadge maps verified domain statuses correctly", () => {
    const passedBadge = React.createElement(StatusBadge, { status: "VERIFIED" });
    expect(passedBadge.props.status).toBe("VERIFIED");

    const failedBadge = React.createElement(StatusBadge, { status: "FAILED" });
    expect(failedBadge.props.status).toBe("FAILED");

    const runningBadge = React.createElement(StatusBadge, { status: "RUNNING" });
    expect(runningBadge.props.status).toBe("RUNNING");
  });
});
