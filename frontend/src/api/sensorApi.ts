import { fetchApi } from './client';
import { SensorPacket } from '../types';

export const sensorApi = {
  getLatest: (patientId: string) => 
    fetchApi<SensorPacket>(`/sensors/patients/${patientId}/latest`),
  getHistory: (patientId: string, limit: number = 30) => 
    fetchApi<SensorPacket[]>(`/sensors/patients/${patientId}/history?limit=${limit}`),
  getSample: (scenario: string = 'NORMAL_RESTING') => 
    fetchApi<SensorPacket>(`/sensors/sample?scenario=${scenario}`),
  ingest: (packet: SensorPacket) => 
    fetchApi<{ status: string; reading_id: string; validated: boolean }>('/sensors/ingest', {
      method: 'POST',
      body: JSON.stringify(packet)
    })
};

