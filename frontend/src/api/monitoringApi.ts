import { fetchApi } from './client';

export interface VitalsAggregate {
  min?: number;
  max?: number;
  avg?: number;
  std_dev?: number;
}

export interface SignalQualityDistribution {
  optimal_pct: number;
  acceptable_pct: number;
  degraded_pct: number;
  disconnected_pct: number;
}

export interface PatientMonitoringSummary {
  patient_id: string;
  patient_name: string;
  time_window_hours: number;
  total_readings: number;
  last_reading_at?: string;
  heart_rate_stats: VitalsAggregate;
  spo2_stats: VitalsAggregate;
  temperature_stats: VitalsAggregate;
  quality_distribution: SignalQualityDistribution;
  primary_risk_level: string;
  active_device_status: string;
  recommendations: string[];
}

export const monitoringApi = {
  getSummary: (patientId: string, hours: number = 24) =>
    fetchApi<PatientMonitoringSummary>(`/monitoring/patients/${patientId}/summary?hours=${hours}`)
};
