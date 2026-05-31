import { AdminCenterDetailsPage } from "@/features/super-admin/admin-centers/AdminCenterDetailsPage";

type PageProps = {
  params: Promise<{
    centerId: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { centerId } = await params;

  return <AdminCenterDetailsPage centerId={centerId} />;
}
