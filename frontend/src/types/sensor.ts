export type SignalQuality = 'OPTIMAL' | 'ACCEPTABLE' | 'DEGRADED' | 'DISCONNECTED';
export type DataQualityStatus = 'VALID' | 'OUT_OF_BOUNDS' | 'INTERPOLATED' | 'MISSING_SENSORS' | 'STALE_DATA';
export type ActivityLabel = 'RESTING' | 'WALKING' | 'RUNNING' | 'TRANSITION' | 'FALL_SUSPECTED' | 'POST_FALL_STATIONARY' | 'UNKNOWN';
export type SourceType = 'VIRTUAL_SIMULATOR' | 'SYNTHETIC_BENCHMARK' | 'WEARABLE_DEVICE';

export interface SensorPacket {
  schema_version: '1.0';
  reading_id: string;
  patient_id: string;
  device_id?: string;
  source_type: SourceType;
  recorded_at: string;
  received_at: string;
  heart_rate_bpm: number | null;
  spo2_percent: number | null;
  temperature_c: number | null;
  accel_x: number | null;
  accel_y: number | null;
  accel_z: number | null;
  activity_label: ActivityLabel;
  signal_quality: SignalQuality;
  data_quality_status: DataQualityStatus;
  provenance_metadata?: {
    scenario_name?: string;
    synthetic_noise_std?: number;
    simulated_battery_pct?: number;
  };
}

export type RiskLevel = 'NORMAL' | 'LOW' | 'ELEVATED' | 'CRITICAL';

export interface SystemHealthStatus {
  status: string;
  timestamp: string;
  version: string;
  database: string;
  active_simulators: number;
}
