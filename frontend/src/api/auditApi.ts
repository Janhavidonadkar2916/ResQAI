import { fetchApi } from './client';

export interface AuditLogItem {
  id: string;
  actor_id?: string;
  actor_email?: string;
  ip_address?: string;
  action_type: string;
  resource_type: string;
  resource_id: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export const auditApi = {
  listLogs: (limit: number = 50, resourceType?: string, actionType?: string) => {
    let url = `/audit/logs?limit=${limit}`;
    if (resourceType) url += `&resource_type=${resourceType}`;
    if (actionType) url += `&action_type=${actionType}`;
    return fetchApi<AuditLogItem[]>(url);
  }
};
