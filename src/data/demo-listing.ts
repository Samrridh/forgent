// Illustrative catalog data, not metered usage or measured performance.
export function demoPrice(id: string) {
  const value = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return (0.001 + (value % 9) * 0.0005).toFixed(4);
}
export function specialty(category: string) {
  const tests: Record<string, [string, string, string]> = {
    "Customer support": ["Answer relevance", "Source alignment", "Escalation handling"],
    "Developer tools": ["Task completion", "Output validity", "Edge case handling"],
    "Research": ["Source relevance", "Summary coverage", "Citation accuracy"],
    "Security": ["Detection coverage", "False positives", "Actionability"],
    "Discord bots": ["Intent recognition", "Response relevance", "Escalation handling"],
    "Slack bots": ["Intent recognition", "Response relevance", "Workflow accuracy"],
    "Data extraction": ["Field accuracy", "Output structure", "Missing field handling"],
  };
  return tests[category] ?? ["Task completion", "Output relevance", "Edge case handling"];
}
