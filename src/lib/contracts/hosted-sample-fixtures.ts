import type { ProposedTest } from "@/server/builder/evaluation/package-review-contract";

export const HOSTED_SAMPLE_AGENT_ID = "platform:knowledge-support-v1";
export const HOSTED_SAMPLE_ARTICLES = [
  { id: "members", title: "Members and invitations", content: "To invite your team, open Settings, choose Members, and select Invite member. Invitations expire after seven days." },
  { id: "password", title: "Resetting a password", content: "On the sign-in page select Forgot password. The reset link expires after one hour." },
  { id: "notifications", title: "Notification settings", content: "Open Settings, select Notifications, choose your updates, and select Save changes." },
];
const test = (title: string, task: string, result: string, category: ProposedTest["category"]): ProposedTest => ({
  title, category, purpose: "Check the deterministic platform sample with its fixed demo articles.",
  inputJson: JSON.stringify({ task }, null, 2), expectedJson: JSON.stringify({ result }, null, 2),
  expectation: "The sample response must exactly match the expected result.",
});
export const HOSTED_SAMPLE_CASES: ProposedTest[] = [
  test("Invite a teammate", "How do I invite my team?", HOSTED_SAMPLE_ARTICLES[0].content, "functional"),
  test("Reset a password", "How do I reset my password?", HOSTED_SAMPLE_ARTICLES[1].content, "functional"),
  test("Hand off an unknown billing question", "Why is my invoice incorrect?", "I’ll send this question to a person.", "edge_case"),
];
