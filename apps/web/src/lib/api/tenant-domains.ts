import { API_BASE_URL as API_BASE } from "./super-admin-centers";

export type DomainStatus = "PENDING" | "VERIFIED" | "ACTIVE" | "FAILED" | "DISABLED";
export type DomainType = "CUSTOM" | "SUBDOMAIN";
export type SslStatus = "PENDING" | "PROVISIONING" | "ACTIVE" | "FAILED";

export type TenantDomain = {
  id: string;
  hostname: string;
  type: DomainType;
  status: DomainStatus;
  isPrimary: boolean;
  verificationToken: string | null;
  verifiedAt: string | null;
  sslStatus: SslStatus;
  createdAt: string;
  updatedAt: string;
};

export type DnsInstructions = {
  recordType: string;
  host: string;
  value: string;
};

export async function listTenantDomains(): Promise<TenantDomain[]> {
  const res = await fetch(`${API_BASE}/tenant/domains`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load domains");
  const data = await res.json();
  return data.items ?? [];
}

export async function addTenantDomain(hostname: string): Promise<TenantDomain> {
  const res = await fetch(`${API_BASE}/tenant/domains`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hostname }),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data.item;
}

export async function updateTenantDomain(
  id: string,
  patch: { isPrimary?: boolean }
): Promise<TenantDomain> {
  const res = await fetch(`${API_BASE}/tenant/domains/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data.item;
}

export async function deleteTenantDomain(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/tenant/domains/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw data;
  }
}

export async function verifyTenantDomain(domainId: string): Promise<{
  verified: boolean;
  item?: TenantDomain;
  instructions?: DnsInstructions;
}> {
  const res = await fetch(`${API_BASE}/tenant/domains/verify`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domainId }),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}
