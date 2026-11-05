import { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  BrainCircuit, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  Info, 
  Percent,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { intelligenceApi, RiskAssessmentResponse } from '../../api/intelligenceApi';

interface AIInsightsPanelProps {
  patientId: string;
  patientName: string;
}

export function AIInsightsPanel({ patientId, patientName }: AIInsightsPanelProps) {
  const [assessment, setAssessment] = useState<RiskAssessmentResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssessment = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await intelligenceApi.getLatestAssessment(patientId);
      setAssessment(data);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Failed to retrieve AI assessment');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchAssessment();
    }
  }, [patientId]);

  if (loading && !assessment) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center space-y-3 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin text-teal-400" />
        <p className="text-xs">Evaluating Two-Tier AI Intelligence Engine for {patientName}...</p>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
        <p className="text-xs text-slate-400">{error || 'No assessment data available'}</p>
        <button
          onClick={fetchAssessment}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-200"
        >
          Retry Evaluation
        </button>
      </div>
    );
  }

  const getRiskScoreColor = (score: number) => {
    if (score >= 75) return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
    if (score >= 50) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    if (score >= 30) return 'text-indigo-400 border-indigo-500/40 bg-indigo-500/10';
    return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
  };

  const getProgressColor = (feature: string) => {
    switch (feature) {
      case 'spo2': return 'bg-teal-400';
      case 'heart_rate': return 'bg-rose-400';
      case 'kinematics': return 'bg-indigo-400';
      default: return 'bg-amber-400';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <BrainCircuit className="w-5 h-5 text-teal-400" />
            <h3 className="text-base font-bold text-white">AI Intelligence & Explainable Anomaly Inspector</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Subject: <strong className="text-teal-300">{patientName}</strong> • Engine: <strong className="text-slate-300">{assessment.model_version}</strong> (Rules + Isolation Forest)
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchAssessment}
            className="flex items-center space-x-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-400' : 'text-slate-400'}`} />
            <span>Re-evaluate</span>
          </button>

          <span className="text-[11px] font-mono bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-400">
            Assessed: {new Date(assessment.assessed_at).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Primary Score & Narrative Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Risk Score Gauge */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between ${getRiskScoreColor(assessment.combined_risk_score)}`}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider">Composite Risk Index</span>
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="flex items-baseline space-x-2 mt-3">
              <span className="text-4xl font-extrabold">{assessment.combined_risk_score}</span>
              <span className="text-xs font-semibold opacity-80">/ 100</span>
            </div>
            <p className="text-xs font-bold mt-1 uppercase tracking-wider">
              {assessment.risk_level} LEVEL
            </p>
          </div>
          <div className="text-[11px] pt-3 border-t border-current/20 opacity-90">
            Trigger: <strong>{assessment.trigger_category.replace(/_/g, ' ')}</strong>
          </div>
        </div>

        {/* Explainability Narrative Dossier */}
        <div className="md:col-span-2 bg-slate-950/70 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
              <Info className="w-4 h-4 text-teal-400" />
              <span>Caregiver Explainability Summary</span>
            </div>
            <p className="text-xs text-slate-200 mt-2 leading-relaxed font-medium">
              {assessment.summary_narrative}
            </p>
          </div>
          <div className="text-[11px] text-amber-300/80 bg-amber-950/30 border border-amber-500/20 px-3 py-1.5 rounded-xl">
            <strong>Clinical Prototype Disclaimer:</strong> Generated by heuristic rules and Isolation Forest anomaly score ({assessment.ml_anomaly_score ?? 'N/A'}). Does not constitute a clinical medical diagnosis.
          </div>
        </div>
      </div>

      {/* Feature Attribution Breakdown (Explainability Bar Chart) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
            <Percent className="w-3.5 h-3.5 text-teal-400" />
            <span>Feature Contribution to Anomaly Score</span>
          </label>
          <span className="text-[11px] text-slate-500">Normalized percentage impact</span>
        </div>

        <div className="space-y-2.5">
          {assessment.explainability_factors.map((factor) => (
            <div key={factor.feature} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">{factor.feature_name}</span>
                <span className="font-mono text-teal-400 font-bold">{factor.contribution_percent}%</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${getProgressColor(factor.feature)}`}
                  style={{ width: `${Math.min(100, Math.max(4, factor.contribution_percent))}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">{factor.clinical_rationale}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Clinical Rule Evaluations Checklist */}
      <div className="space-y-3 pt-2 border-t border-slate-800">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
          <Sliders className="w-3.5 h-3.5 text-teal-400" />
          <span>Tier 1 Clinical Baseline Verification Rules</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {assessment.rule_evaluations.map((rule) => {
            const isCritical = rule.status === 'CRITICAL_TRIGGERED';
            const isWarning = rule.status === 'WARNING';
            return (
              <div 
                key={rule.rule_id}
                className={`p-3 rounded-xl border flex items-start space-x-3 text-xs ${
                  isCritical 
                    ? 'bg-rose-950/40 border-rose-500/40 text-rose-200' 
                    : isWarning 
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-200' 
                    : 'bg-slate-950/40 border-slate-800 text-slate-300'
                }`}
              >
                {isCritical ? (
                  <Flame className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                ) : isWarning ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="flex items-center space-x-2 font-semibold">
                    <span>{rule.rule_name}</span>
                    <span className="font-mono text-[10px] opacity-75">({rule.threshold})</span>
                  </div>
                  <p className="text-[11px] opacity-80 mt-0.5">{rule.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
