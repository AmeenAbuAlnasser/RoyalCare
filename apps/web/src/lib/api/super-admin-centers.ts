export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_ROYALCARE_API_URL ??
  "http://localhost:3001/api/v1";


export type ApiCenterStatus =
  | "TRIAL"
  | "ACTIVE"
  | "PAST_DUE"
  | "SUSPENDED"
  | "CANCELLED"
  | "ARCHIVED";

export type ApiCenterType =
  | "LASER"
  | "PHYSIOTHERAPY"
  | "HIJAMA"
  | "BEAUTY"
  | "WELLNESS"
  | "MULTI_SPECIALTY";

export type ApiLanguage = "AR" | "HE" | "EN";

export type ApiCenter = {
  id: string;
  name: string;
  nameAr?: string | null;
  nameEn?: string | null;
  nameHe?: string | null;
  slug: string;
  type: ApiCenterType;
  status: ApiCenterStatus;
  publicVisible?: boolean;
  primaryLanguage: ApiLanguage;
  createdAt: string;
  updatedAt: string;
  owner?: {
    createdAt?: string;
    email?: string | null;
    fullName: string;
    id?: string;
    phone?: string | null;
    status?: string;
  } | null;
  branding?: {
    defaultLanguage: ApiLanguage;
    enabledLanguages: ApiLanguage[];
    logoUrl?: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
  } | null;
  subscriptions?: Array<{
    billingInterval: "MONTHLY" | "YEARLY" | "CUSTOM";
    createdAt?: string;
    currentPeriodEnd: string;
    currentPeriodStart: string;
    gracePeriodEndsAt?: string | null;
    planCode: string;
    planName: string;
    status:
      | "TRIALING"
      | "ACTIVE"
      | "PAST_DUE"
      | "SUSPENDED"
      | "CANCELLED"
      | "EXPIRED";
    updatedAt?: string;
    nextRenewalDate?: string | null;
    billingNotes?: string | null;
  }>;
  domains?: Array<{
    createdAt?: string;
    hostname: string;
    status: "PENDING" | "VERIFIED" | "ACTIVE" | "FAILED" | "DISABLED";
    type: "CUSTOM" | "SUBDOMAIN";
    updatedAt?: string;
  }>;
  userRoles?: Array<{
    role?: {
      key: string;
      name: string;
    };
    user?: {
      createdAt?: string;
      email?: string | null;
      fullName: string;
      id?: string;
      phone?: string | null;
      status?: string;
    };
  }>;
};

export type CreateCenterPayload = {
  admin: {
    email: string;
    fullName: string;
    permissionsPreset: string;
    phone?: string;
    temporaryPassword?: string;
  };
  branding: {
    defaultLanguage: ApiLanguage;
    enabledLanguages: ApiLanguage[];
    logoUrl?: string;
    primaryColor: string;
    secondaryColor: string;
    theme?: Record<string, unknown>;
  };
  domain?: {
    hostname: string;
    isPrimary: boolean;
    status: "PENDING" | "VERIFIED" | "FAILED";
    type: "CUSTOM" | "SUBDOMAIN";
  };
  name: string;
  nameAr?: string | null;
  nameEn?: string | null;
  nameHe?: string | null;
  primaryLanguage: ApiLanguage;
  slug?: string;
  subscription: {
    billingInterval: "MONTHLY";
    currentPeriodEnd: string;
    currentPeriodStart: string;
    planCode: string;
    planName: string;
    status: "TRIALING" | "ACTIVE";
  };
  timezone: string;
  type: ApiCenterType;
};

export type UpdateCenterPayload = {
  admin?: {
    email?: string;
    fullName?: string;
    phone?: string;
  };
  centerName?: string;
  nameAr?: string | null;
  nameEn?: string | null;
  nameHe?: string | null;
  domain?: {
    hostname?: string;
    isPrimary?: boolean;
    status?: "PENDING" | "VERIFIED" | "ACTIVE" | "FAILED" | "DISABLED";
    type?: "CUSTOM" | "SUBDOMAIN";
  };
  primaryLanguage?: ApiLanguage;
  status?: ApiCenterStatus;
  subscription?: {
    billingInterval?: "MONTHLY" | "YEARLY" | "CUSTOM";
    currentPeriodEnd?: string;
    currentPeriodStart?: string;
    planCode?: string;
    planName?: string;
    status?: "TRIALING" | "ACTIVE" | "PAST_DUE" | "SUSPENDED" | "CANCELLED" | "EXPIRED";
  };
  type?: ApiCenterType;
};

export type ApiCenterInternalNote = {
  id: string;
  centerId: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  author: {
    createdAt?: string;
    email?: string | null;
    fullName: string;
    id: string;
    phone?: string | null;
    status?: string;
  };
};

export type ApiCenterStaffRole =
  | "CENTER_OWNER"
  | "CENTER_MANAGER"
  | "DOCTOR"
  | "RECEPTIONIST"
  | "ACCOUNTANT"
  | "STAFF";

export type ApiCenterStaffStatus =
  | "INVITED"
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED";

export type ApiCenterStaffUser = {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  role: ApiCenterStaffRole;
  roleName?: string;
  status: ApiCenterStaffStatus;
  assignmentStatus?: string;
  createdAt: string;
  updatedAt: string;
};

export type CenterStaffPayload = {
  email: string;
  fullName: string;
  phone: string;
  role: ApiCenterStaffRole;
  status?: ApiCenterStaffStatus;
};

export type UpdateCenterStatusPayload = {
  reason?: string;
  status: "ACTIVE" | "SUSPENDED" | "CANCELLED" | "INACTIVE";
};

export type UpdateCenterSubscriptionPayload = {
  billingNotes?: string;
  nextRenewalDate?: string;
  subscriptionEndDate?: string;
  subscriptionPlan?: "BASIC" | "STANDARD" | "PREMIUM" | "ENTERPRISE" | string;
  subscriptionStartDate?: string;
  subscriptionStatus?:
    | "TRIAL"
    | "ACTIVE"
    | "EXPIRED"
    | "OVERDUE"
    | "SUSPENDED"
    | "CANCELLED"
    | string;
};

export class ApiRequestError extends Error {
  details: unknown;
  rawResponseBody: string;
  status: number;

  constructor({
    details,
    message,
    rawResponseBody,
    status,
  }: {
    details: unknown;
    message: string;
    rawResponseBody: string;
    status: number;
  }) {
    super(message);
    this.name = "ApiRequestError";
    this.details = details;
    this.rawResponseBody = rawResponseBody;
    this.status = status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function stringifyErrorValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(stringifyErrorValue).filter(Boolean).join(", ");
  }

  if (isRecord(value)) {
    const localizedMessage =
      value.en ?? value.ar ?? value.he ?? value.message ?? value.error;

    if (typeof localizedMessage === "string") {
      return localizedMessage;
    }

    return Object.values(value)
      .map(stringifyErrorValue)
      .filter(Boolean)
      .join(", ");
  }

  return "";
}

function getErrorMessage(details: unknown) {
  if (details && typeof details === "object" && "message" in details) {
    const message = (details as { message?: unknown }).message;

    if (typeof message === "string") {
      return message;
    }

    if (Array.isArray(message)) {
      return message.join(", ");
    }

    if (message && typeof message === "object") {
      const nestedMessage = (message as { message?: unknown }).message;
      const errors = (message as { errors?: unknown }).errors;

      if (typeof nestedMessage === "string") {
        const errorMessage = stringifyErrorValue(errors);

        return errorMessage
          ? `${nestedMessage} ${errorMessage}`
          : nestedMessage;
      }
    }
  }

  if (isRecord(details) && "errors" in details) {
    const errorMessage = stringifyErrorValue(details.errors);

    if (errorMessage) {
      return errorMessage;
    }
  }

  if (
    details &&
    typeof details === "object" &&
    "error" in details &&
    typeof (details as { error?: { message?: unknown } }).error?.message ===
      "string"
  ) {
    return (details as { error: { message: string } }).error.message;
  }

  return "RoyalCare API request failed.";
}

function safelyParseJson(rawBody: string) {
  if (!rawBody.trim()) {
    return null;
  }

  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    return null;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      credentials: "include",
      headers,
    });
  } catch (error) {
    throw error;
  }

  if (!response.ok) {
    const rawBody = await response.text().catch((error: unknown) => {
      void error;
      return "";
    });
    const parsedJsonBody = safelyParseJson(rawBody);
    const message =
      getErrorMessage(parsedJsonBody) ||
      rawBody ||
      `RoyalCare API request failed with status ${response.status}.`;

    throw new ApiRequestError({
      details: parsedJsonBody,
      message,
      rawResponseBody: rawBody,
      status: response.status,
    });
  }

  return (await response.json()) as T;
}

export function listSuperAdminCenters() {
  return request<{ data: ApiCenter[]; pagination: { total: number } }>(
    "/centers?pageSize=100",
  );
}

export function getSuperAdminCenter(centerId: string) {
  return request<ApiCenter>(`/centers/${centerId}`);
}

export function createSuperAdminCenter(payload: CreateCenterPayload) {
  return request<ApiCenter>("/centers", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function updateSuperAdminCenter(
  centerId: string,
  payload: UpdateCenterPayload,
) {
  return request<ApiCenter>(`/centers/${centerId}`, {
    body: JSON.stringify(payload),
    method: "PATCH",
  });
}

export function listCenterInternalNotes(centerId: string) {
  return request<{ data: ApiCenterInternalNote[] }>(
    `/centers/${centerId}/internal-notes`,
  );
}

export function createCenterInternalNote(centerId: string, note: string) {
  return request<ApiCenterInternalNote>(`/centers/${centerId}/internal-notes`, {
    body: JSON.stringify({ note }),
    method: "POST",
  });
}

export function listCenterStaff(centerId: string) {
  return request<{ data: ApiCenterStaffUser[] }>(`/centers/${centerId}/staff`);
}

export function createCenterStaff(
  centerId: string,
  payload: CenterStaffPayload,
) {
  return request<ApiCenterStaffUser>(`/centers/${centerId}/staff`, {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function updateCenterStaff(
  centerId: string,
  userId: string,
  payload: Partial<CenterStaffPayload>,
) {
  return request<ApiCenterStaffUser>(`/centers/${centerId}/staff/${userId}`, {
    body: JSON.stringify(payload),
    method: "PATCH",
  });
}

export function updateCenterStaffStatus(
  centerId: string,
  userId: string,
  status: ApiCenterStaffStatus,
) {
  return request<ApiCenterStaffUser>(
    `/centers/${centerId}/staff/${userId}/status`,
    {
      body: JSON.stringify({ status }),
      method: "PATCH",
    },
  );
}

export function resetCenterStaffPassword(
  centerId: string,
  userId: string,
  temporaryPassword?: string,
) {
  return request<{
    resetComplete: boolean;
    temporaryPassword: string;
    user: ApiCenterStaffUser;
  }>(
    `/centers/${centerId}/staff/${userId}/reset-password`,
    {
      body: JSON.stringify(
        temporaryPassword ? { temporaryPassword } : {},
      ),
      method: "POST",
    },
  );
}

export function updateSuperAdminCenterStatus(
  centerId: string,
  payload: UpdateCenterStatusPayload,
) {
  return request<ApiCenter>(`/centers/${centerId}/status`, {
    body: JSON.stringify(payload),
    method: "PATCH",
  });
}

export function updateSuperAdminCenterSubscription(
  centerId: string,
  payload: UpdateCenterSubscriptionPayload,
) {
  return request<ApiCenter>(`/centers/${centerId}/subscription`, {
    body: JSON.stringify(payload),
    method: "PATCH",
  });
}

export function updateCenterPublicVisibility(
  centerId: string,
  publicVisible: boolean,
) {
  return request<ApiCenter>(
    `/centers/${centerId}/public-visibility`,
    {
      body: JSON.stringify({ publicVisible }),
      method: "PATCH",
    },
  );
}
