import { redirect } from "next/navigation";

export default async function BuilderOverviewPage({ searchParams }: { searchParams?: Promise<{ tab?: string }> }) {
  const tab = (await searchParams)?.tab;
  const destinations: Record<string, string> = { publish: "upload", "my-agents": "agents", profile: "profile" };
  const target = tab ? destinations[tab] : undefined;
  redirect(target ? `/publish?tab=${target}` : "/publish");
}
