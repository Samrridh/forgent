import { CreatorStudio, CreatorStudioTab } from "@/components/creator/creator-studio";

interface BuilderOverviewPageProps {
  searchParams?: Promise<{ tab?: string }>;
}

export default async function BuilderOverviewPage({
  searchParams,
}: BuilderOverviewPageProps) {
  const params = await searchParams;
  const tab = params?.tab as CreatorStudioTab | undefined;
  const validTabs: CreatorStudioTab[] = [
    "my-agents",
    "analytics",
    "publish",
    "earnings",
  ];
  const initialTab =
    tab && validTabs.includes(tab) ? tab : "my-agents";

  return <CreatorStudio initialTab={initialTab} />;
}
