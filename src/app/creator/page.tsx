import { CreatorStudio, CreatorStudioTab } from "@/components/creator/creator-studio";

interface CreatorPageProps {
  searchParams?: Promise<{ tab?: string }>;
}

export default async function CreatorPage({
  searchParams,
}: CreatorPageProps) {
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
