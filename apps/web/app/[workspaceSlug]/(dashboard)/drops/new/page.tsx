import { DropsNewView } from "@multica/views/drops/drops-new-view";

export default async function DropsNewPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<{ title?: string }>;
}) {
  const { workspaceSlug } = await params;
  const { title = "" } = await searchParams;
  return <DropsNewView workspaceSlug={workspaceSlug} initialTitle={title} />;
}
