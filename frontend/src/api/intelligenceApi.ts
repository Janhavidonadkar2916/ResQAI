import { fetchApi } from './client';
import { SensorPacket } from '../types';

export interface RuleResult {
  rule_id: string;
  rule_name: string;
  status: 'PASSED' | 'WARNING' | 'CRITICAL_TRIGGERED';
  observed_value?: number;
  threshold: string;
  severity_weight: number;
  message: string;
}

export interface ExplainabilityFactor {
  feature: string;
  feature_name: string;
  observed_value?: number;
  baseline_value?: number;
  contribution_percent: number;
  direction: 'NORMAL' | 'ELEVATED' | 'DEPRESSED' | 'DISCONNECTED';
  clinical_rationale: string;
}

export interface RiskAssessmentResponse {
  id: string;
  patient_id: string;
  reading_id?: string;
  assessed_at: string;
  combined_risk_score: number;
  risk_level: 'NORMAL' | 'LOW' | 'ELEVATED' | 'CRITICAL';
  trigger_category: string;
  rule_evaluations: RuleResult[];
  ml_anomaly_score?: number;
  explainability_factors: ExplainabilityFactor[];
  summary_narrative: string;
  model_version: string;
  disclaimer: string;
}

export const intelligenceApi = {
  getLatestAssessment: (patientId: string) =>
    fetchApi<RiskAssessmentResponse>(`/intelligence/patients/${patientId}/latest-assessment`),
  listAssessments: (patientId: string, limit: number = 20) =>
    fetchApi<RiskAssessmentResponse[]>(`/intelligence/patients/${patientId}/assessments?limit=${limit}`),
  evaluate: (patientId: string, packet: SensorPacket) =>
    fetchApi<RiskAssessmentResponse>('/intelligence/evaluate', {
      method: 'POST',
      body: JSON.stringify({ patient_id: patientId, packet })
    })
};
