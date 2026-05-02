import { CenterLoginPage } from "@/features/center-admin/login/CenterLoginPage";

export default async function CenterSlugLoginPage({
  params,
}: {
  params: Promise<{ centerSlug: string }>;
}) {
  const { centerSlug } = await params;

  return <CenterLoginPage centerSlug={centerSlug} />;
}
