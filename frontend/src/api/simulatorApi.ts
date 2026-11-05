import { fetchApi } from './client';
import { SensorPacket } from '../types';

export interface ScenarioInfo {
  name: string;
  display_title: string;
  description: string;
  target_vitals: string;
  risk_profile: string;
}

export interface SimulatorStatusResponse {
  patient_id: string;
  is_running: boolean;
  current_scenario: string;
  tick_rate_ms: number;
  packet_count: number;
  last_packet?: SensorPacket;
}

export const simulatorApi = {
  getScenarios: () => fetchApi<ScenarioInfo[]>('/simulator/scenarios'),
  getStatus: (patientId: string) => fetchApi<SimulatorStatusResponse>(`/simulator/status/${patientId}`),
  configure: (patientId: string, scenario: string, tickRateMs: number = 1000) => 
    fetchApi<SimulatorStatusResponse>('/simulator/configure', {
      method: 'POST',
      body: JSON.stringify({
        patient_id: patientId,
        scenario: scenario,
        tick_rate_ms: tickRateMs
      })
    }),
  tick: (patientId: string, scenario?: string) => {
    const url = `/simulator/tick?patient_id=${patientId}${scenario ? `&scenario=${scenario}` : ''}&persist=true`;
    return fetchApi<SensorPacket>(url, { method: 'POST' });
  },
  batch: (patientId: string, scenario: string, count: number = 20) =>
    fetchApi<SensorPacket[]>('/simulator/batch', {
      method: 'POST',
      body: JSON.stringify({
        patient_id: patientId,
        scenario: scenario,
        count: count,
        interval_seconds: 2
      })
    })
};
