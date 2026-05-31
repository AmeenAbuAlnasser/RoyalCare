import type { Metadata } from "next";
import { BookingPage } from "@/features/public/booking/BookingPage";
import { buildCenterPageMetadata } from "@/lib/api/center-seo-metadata";

type Props = {
  params: Promise<{ centerSlug: string }>;
  searchParams: Promise<{ offerId?: string; serviceId?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { centerSlug } = await params;
  return buildCenterPageMetadata(centerSlug, {
    fallbackTitle: "Book Appointment",
    fallbackDescription: "Book your appointment online at {name}.",
    pageSuffix: "Book Appointment",
  });
}

export default async function BookRoute({ params, searchParams }: Props) {
  const { centerSlug } = await params;
  const { offerId, serviceId } = await searchParams;
  return <BookingPage slug={centerSlug} offerId={offerId} serviceId={serviceId} />;
}
