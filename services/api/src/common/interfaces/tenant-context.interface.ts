export interface TenantContext {
  centerId: string;
  source: 'domain' | 'admin-selection' | 'portal-session' | 'system';
}
