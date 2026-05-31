import { API_BASE_URL } from "./super-admin-centers";

export type TenantRole = {
  id: string;
  key: string;
  name: string;
};

export type TenantRolePermissions = {
  roleId: string;
  roleKey: string;
  permissions: string[];
};

export async function getTenantRoles(): Promise<TenantRole[]> {
  const response = await fetch(`${API_BASE_URL}/tenant/roles`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch roles");
  }

  return response.json();
}

export async function getTenantRolePermissions(
  roleId: string,
): Promise<TenantRolePermissions> {
  const response = await fetch(
    `${API_BASE_URL}/tenant/roles/${roleId}/permissions`,
    { credentials: "include" },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch role permissions");
  }

  return response.json();
}

export async function updateTenantRolePermissions(
  roleId: string,
  permissions: string[],
): Promise<TenantRolePermissions> {
  const response = await fetch(
    `${API_BASE_URL}/tenant/roles/${roleId}/permissions`,
    {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissions }),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to update role permissions");
  }

  return response.json();
}
