export class CreateBookingRequestDto {
  fullName?: string;
  phone?: string;
  patientArea?: string | null;
  branchId?: string | null;
  providerId?: string | null;
  serviceId?: string;
  notes?: string | null;
  requestedDate?: string;
  requestedTime?: string;
  offerId?: string | null;
  offerTitle?: string | null;
  offerPrice?: string | null;
  offerCurrency?: string | null;
}
