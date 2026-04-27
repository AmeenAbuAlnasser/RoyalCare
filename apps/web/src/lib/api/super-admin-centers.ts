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
  slug: string;
  type: ApiCenterType;
  status: ApiCenterStatus;
  primaryLanguage: ApiLanguage;
  createdAt: string;
  owner?: {
    email?: string | null;
    fullName: string;
    phone?: string | null;
  } | null;
  branding?: {
    defaultLanguage: ApiLanguage;
    enabledLanguages: ApiLanguage[];
    primaryColor?: string | null;
    secondaryColor?: string | null;
  } | null;
  subscriptions?: Array<{
    billingInterval: "MONTHLY" | "YEARLY" | "CUSTOM";
    currentPeriodEnd: string;
    currentPeriodStart: string;
    planCode: string;
    planName: string;
    status: string;
  }>;
  domains?: Array<{
    hostname: string;
    status: string;
    type: string;
  }>;
  userRoles?: Array<{
    role?: {
      key: string;
      name: string;
    };
    user?: {
      email?: string | null;
      fullName: string;
      phone?: string | null;
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

function getErrorMessage(details: unknown) {
  if (
    details &&
    typeof details === "object" &&
    "message" in details
  ) {
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
        return typeof errors === "object" && errors
          ? `${nestedMessage} ${Object.values(errors).join(", ")}`
          : nestedMessage;
      }
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

  // TODO(debug): Remove after Create Center submit flow is verified in browser Network tab.
  console.log("[RoyalCare submit debug] API URL", url);

  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  } catch (error) {
    // TODO(debug): Remove after Create Center submit flow is verified in browser Network tab.
    console.error("[RoyalCare submit debug] fetch failed", {
      error,
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : "UnknownFetchError",
      stack: error instanceof Error ? error.stack : undefined,
      url,
    });

    throw error;
  }

  if (!response.ok) {
    const rawBody = await response.text().catch((error: unknown) => {
      // TODO(debug): Remove after Create Center submit flow is verified in browser Network tab.
      console.error("[RoyalCare submit debug] failed to read API error body", {
        error,
        message: error instanceof Error ? error.message : String(error),
        status: response.status,
        url,
      });

      return "";
    });
    const parsedJsonBody = safelyParseJson(rawBody);
    const message =
      getErrorMessage(parsedJsonBody) ||
      rawBody ||
      `RoyalCare API request failed with status ${response.status}.`;

    // TODO(debug): Remove after Create Center submit flow is verified in browser Network tab.
    console.error("[RoyalCare submit debug] API error", {
      details: parsedJsonBody,
      message,
      parsedJsonBody,
      rawResponseBody: rawBody,
      statusText: response.statusText,
      status: response.status,
      url,
    });

    throw new Error(message);
  }

  const data = (await response.json()) as T;

  // TODO(debug): Remove after Create Center submit flow is verified in browser Network tab.
  console.log("[RoyalCare submit debug] API response", data);

  return data;
}

export function listSuperAdminCenters() {
  return request<{ data: ApiCenter[]; pagination: { total: number } }>(
    "/super-admin/centers?pageSize=100",
  );
}

export function getSuperAdminCenter(centerId: string) {
  return request<ApiCenter>(`/super-admin/centers/${centerId}`);
}

export function createSuperAdminCenter(payload: CreateCenterPayload) {
  return request<ApiCenter>("/centers", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}
