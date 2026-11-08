import { fetchApi } from './client';
import { EmergencyContact } from './patientApi';

export interface MedicationItem {
  name: string;
  dosage: string;
  frequency: string;
  instructions?: string;
}

export interface MedicalProfile {
  id: string;
  patient_id: string;
  blood_group: string;
  allergies: string[];
  chronic_conditions: string[];
  medications: MedicationItem[];
  dnr_order: boolean;
  dnr_instructions?: string;
  primary_physician_name: string;
  primary_physician_phone: string;
  hospital_preference: string;
  general_notes?: string;
  last_verified_at: string;
  created_at: string;
  updated_at: string;
}

export interface EmergencyPassData {
  pass_generated_at: string;
  patient_id: string;
  full_name: string;
  date_of_birth?: string;
  gender?: string;
  room_or_residence: string;
  blood_group: string;
  allergies: string[];
  chronic_conditions: string[];
  medications: MedicationItem[];
  dnr_order: boolean;
  dnr_instructions?: string;
  primary_physician_name: string;
  primary_physician_phone: string;
  hospital_preference: string;
  emergency_contacts: EmergencyContact[];
  clinical_disclaimer: string;
}

export const medicalProfileApi = {
  getProfile: (patientId: string) =>
    fetchApi<MedicalProfile>(`/medical-profiles/patients/${patientId}`),
  updateProfile: (patientId: string, data: Partial<MedicalProfile>) =>
    fetchApi<MedicalProfile>(`/medical-profiles/patients/${patientId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  getEmergencyPass: (patientId: string) =>
    fetchApi<EmergencyPassData>(`/medical-profiles/patients/${patientId}/emergency-pass`)
};

