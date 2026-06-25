export const platformPermissionKeys = [
  'view:centers',
  'create:centers',
  'edit:centers',
  'suspend:centers',
  'manage:subscriptions',
  'view:internal_notes',
  'manage:internal_notes',
  'view:users',
  'manage:users',
  'manage:plans',
  'manage:settings',
  'view:reports',
  'view:audit_logs',
] as const;

export type PlatformPermissionKey = (typeof platformPermissionKeys)[number];

export const platformRoleDefinitions = [
  {
    key: 'super_admin',
    name: 'Super Admin',
    description: 'Full RoyalCare platform access.',
    permissions: [...platformPermissionKeys],
  },
  {
    key: 'platform_admin',
    name: 'Platform Admin',
    description: 'Operational platform administration without user ownership.',
    permissions: [
      'view:centers',
      'create:centers',
      'edit:centers',
      'suspend:centers',
      'manage:subscriptions',
      'view:internal_notes',
      'manage:internal_notes',
      'manage:plans',
      'view:reports',
    ],
  },
  {
    key: 'finance_admin',
    name: 'Finance Admin',
    description: 'Manual billing and subscription administration.',
    permissions: [
      'view:centers',
      'manage:subscriptions',
      'manage:plans',
      'view:reports',
    ],
  },
  {
    key: 'support_admin',
    name: 'Support Admin',
    description: 'Support access to centers and private internal notes.',
    permissions: [
      'view:centers',
      'view:internal_notes',
      'manage:internal_notes',
      'view:reports',
    ],
  },
  {
    key: 'read_only_admin',
    name: 'Read Only Admin',
    description: 'Read-only platform visibility.',
    permissions: ['view:centers', 'view:reports'],
  },
] satisfies Array<{
  key: string;
  name: string;
  description: string;
  permissions: PlatformPermissionKey[];
}>;

export type PlatformRoleKey = (typeof platformRoleDefinitions)[number]['key'];
