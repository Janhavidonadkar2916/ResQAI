import { fetchApi } from './client';

export type EmergencySeverity = 'WARNING' | 'URGENT' | 'CRITICAL';
export type EmergencyState = 
  | 'DETECTED'
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'ESCALATED'
  | 'ACKNOWLEDGED'
  | 'RESOLVED'
  | 'CANCELLED';

export interface EmergencyTimelineLog {
  id: string;
  emergency_event_id: string;
  action: string;
  actor_type: string;
  actor_id?: string;
  description: string;
  logged_at: string;
}

export interface EmergencyEvent {
  id: string;
  patient_id: string;
  assessment_id?: string;
  reading_id?: string;
  severity: EmergencySeverity;
  state: EmergencyState;
  reason: string;
  detected_at: string;
  verification_deadline_at?: string;
  acknowledged_at?: string;
  acknowledged_by_user_id?: string;
  resolved_at?: string;
  resolved_by_user_id?: string;
  resolution_notes?: string;
  timeline: EmergencyTimelineLog[];
  patient_name?: string;
  seconds_remaining?: number;
}

export const emergencyApi = {
  list: (patientId?: string, activeOnly: boolean = false) => {
    let url = `/emergencies?active_only=${activeOnly}`;
    if (patientId) url += `&patient_id=${patientId}`;
    return fetchApi<EmergencyEvent[]>(url);
  },
  getById: (id: string) => fetchApi<EmergencyEvent>(`/emergencies/${id}`),
  create: (patientId: string, reason: string, severity: EmergencySeverity = 'CRITICAL', gracePeriodSeconds: number = 45) =>
    fetchApi<EmergencyEvent>('/emergencies/create', {
      method: 'POST',
      body: JSON.stringify({
        patient_id: patientId,
        reason,
        severity,
        grace_period_seconds: gracePeriodSeconds
      })
    }),
  acknowledge: (id: string) =>
    fetchApi<EmergencyEvent>(`/emergencies/${id}/acknowledge`, { method: 'POST' }),
  escalate: (id: string, note?: string) => {
    const url = `/emergencies/${id}/escalate${note ? `?note=${encodeURIComponent(note)}` : ''}`;
    return fetchApi<EmergencyEvent>(url, { method: 'POST' });
  },
  resolve: (id: string, resolutionNotes: string) =>
    fetchApi<EmergencyEvent>(`/emergencies/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolution_notes: resolutionNotes })
    }),
  cancel: (id: string, cancellationReason: string) =>
    fetchApi<EmergencyEvent>(`/emergencies/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ cancellation_reason: cancellationReason })
    }),
  getTimeline: (id: string) => fetchApi<EmergencyTimelineLog[]>(`/emergencies/${id}/timeline`)
};

