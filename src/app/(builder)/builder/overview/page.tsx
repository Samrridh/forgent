import { CreatorStudio, type CreatorStudioTab } from "@/components/creator/creator-studio";

interface BuilderOverviewPageProps {
  searchParams?: Promise<{ tab?: string }>;
}

export default async function BuilderOverviewPage({ searchParams }: BuilderOverviewPageProps) {
  const params = await searchParams;
  const validTabs: CreatorStudioTab[] = ["my-agents", "analytics", "publish", "earnings", "package-review", "profile"];
  const tab = params?.tab as CreatorStudioTab | undefined;
  return <CreatorStudio initialTab={tab && validTabs.includes(tab) ? tab : "my-agents"} />;
}
