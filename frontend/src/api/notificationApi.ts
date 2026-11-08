import { fetchApi } from './client';

export interface NotificationItem {
  id: string;
  user_id?: string;
  emergency_event_id?: string;
  title: string;
  message: string;
  priority: string;
  is_read: boolean;
  is_acknowledged: boolean;
  sent_at: string;
  acknowledged_at?: string;
}

export const notificationApi = {
  list: (unreadOnly: boolean = false) =>
    fetchApi<NotificationItem[]>(`/notifications?unread_only=${unreadOnly}`),
  markRead: (id: string) =>
    fetchApi<NotificationItem>(`/notifications/${id}/read`, { method: 'PATCH' }),
  acknowledgeAll: () =>
    fetchApi<{ status: string; count: number }>('/notifications/acknowledge-all', { method: 'POST' })
};

