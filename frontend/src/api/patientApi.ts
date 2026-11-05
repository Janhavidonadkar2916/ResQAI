import { fetchApi } from './client';
import { Patient } from '../types';

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone_number: string;
  priority_order: number;
  is_notified_on_critical: boolean;
}

export interface PatientDetail extends Patient {
  emergency_contacts: EmergencyContact[];
}

export const patientApi = {
  list: () => fetchApi<PatientDetail[]>('/patients'),
  getById: (id: string) => fetchApi<PatientDetail>(`/patients/${id}`),
  create: (data: Partial<PatientDetail>) => fetchApi<PatientDetail>('/patients', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id: string, data: Partial<PatientDetail>) => fetchApi<PatientDetail>(`/patients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
};

