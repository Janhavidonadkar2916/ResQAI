export * from './sensor';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'CAREGIVER' | 'PATIENT' | 'CLINICIAN';
  is_active: boolean;
}

export interface Patient {
  id: string;
  primary_user_id?: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  room_or_residence: string;
  monitoring_status: 'ACTIVE' | 'PAUSED' | 'DISCHARGED';
  risk_tier: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  created_at: string;
}

