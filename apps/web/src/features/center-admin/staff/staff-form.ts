import type { CenterRoleKey } from "@/i18n/dictionaries/center-admin";
import type {
  TenantStaff,
  TenantStaffPayload,
  TenantStaffStatus,
} from "@/lib/api/tenant-staff";

export type TenantStaffFormState = {
  email: string;
  fullName: string;
  password: string;
  role: CenterRoleKey;
  status: TenantStaffStatus;
};

export type TenantStaffFormErrors = Partial<
  Record<keyof TenantStaffFormState, string>
>;

export function staffToForm(staff?: TenantStaff): TenantStaffFormState {
  return {
    email: staff?.email ?? "",
    fullName: staff?.fullName ?? "",
    password: "",
    role: staff?.role ?? "STAFF",
    status: staff?.status ?? "ACTIVE",
  };
}

export function formToPayload(
  form: TenantStaffFormState,
  mode: "create" | "edit",
): TenantStaffPayload | Partial<TenantStaffPayload> {
  const payload = {
    email: form.email.trim(),
    fullName: form.fullName.trim(),
    role: form.role,
    status: form.status,
  };

  if (mode === "create" || form.password.trim()) {
    return {
      ...payload,
      password: form.password,
    };
  }

  return payload;
}
