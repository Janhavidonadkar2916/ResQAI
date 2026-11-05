import { useState, useEffect } from 'react';
import { 
  Heart, 
  Wind, 
  Thermometer, 
  Radio, 
  CheckCircle2, 
  Clock, 
  Activity,
  RefreshCw 
} from 'lucide-react';
import { monitoringApi, PatientMonitoringSummary } from '../../api/monitoringApi';

interface AnalyticsSummaryCardsProps {
  patientId: string;
  patientName: string;
}

export function AnalyticsSummaryCards({ patientId, patientName }: AnalyticsSummaryCardsProps) {
  const [summary, setSummary] = useState<PatientMonitoringSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hours, setHours] = useState<number>(24);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const data = await monitoringApi.getSummary(patientId, hours);
      setSummary(data);
    } catch (err) {
      console.error('Failed to load monitoring summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchSummary();
    }
  }, [patientId, hours]);

  if (loading && !summary) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex items-center justify-center space-x-2 text-xs text-slate-400">
        <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
        <span>Loading telemetry analytics...</span>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-teal-400" />
            <h3 className="text-base font-bold text-white">24-Hour Telemetry Analytics & Quality Profile</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Aggregated physiological statistics for <strong className="text-teal-300">{patientName}</strong> ({summary.total_readings} observations recorded)
          </p>
        </div>

        {/* Time Window Selector */}
        <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Window:</span>
          <select
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="bg-transparent text-teal-300 font-semibold focus:outline-none cursor-pointer"
          >
            <option value={6} className="bg-slate-900">Last 6 Hours</option>
            <option value={12} className="bg-slate-900">Last 12 Hours</option>
            <option value={24} className="bg-slate-900">Last 24 Hours</option>
            <option value={72} className="bg-slate-900">Last 3 Days</option>
          </select>
        </div>
      </div>

      {/* Aggregate Vitals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Heart Rate Summary */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Heart Rate (BPM)</span>
            <Heart className="w-4 h-4 text-rose-400" />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-900 p-2 rounded-lg">
              <span className="text-[10px] text-slate-500 uppercase">Min</span>
              <p className="font-bold text-white text-base">{summary.heart_rate_stats.min ?? '--'}</p>
            </div>
            <div className="bg-slate-900 p-2 rounded-lg">
              <span className="text-[10px] text-teal-400 uppercase">Avg</span>
              <p className="font-bold text-teal-300 text-base">{summary.heart_rate_stats.avg ?? '--'}</p>
            </div>
            <div className="bg-slate-900 p-2 rounded-lg">
              <span className="text-[10px] text-slate-500 uppercase">Max</span>
              <p className="font-bold text-white text-base">{summary.heart_rate_stats.max ?? '--'}</p>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 text-center">Std Deviation: ±{summary.heart_rate_stats.std_dev ?? 0} BPM</p>
        </div>

        {/* SpO2 Summary */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">SpO2 Oxygenation (%)</span>
            <Wind className="w-4 h-4 text-teal-400" />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-900 p-2 rounded-lg">
              <span className="text-[10px] text-slate-500 uppercase">Min</span>
              <p className="font-bold text-white text-base">{summary.spo2_stats.min ?? '--'}%</p>
            </div>
            <div className="bg-slate-900 p-2 rounded-lg">
              <span className="text-[10px] text-teal-400 uppercase">Avg</span>
              <p className="font-bold text-teal-300 text-base">{summary.spo2_stats.avg ?? '--'}%</p>
            </div>
            <div className="bg-slate-900 p-2 rounded-lg">
              <span className="text-[10px] text-slate-500 uppercase">Max</span>
              <p className="font-bold text-white text-base">{summary.spo2_stats.max ?? '--'}%</p>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 text-center">Oxygen Stability: ±{summary.spo2_stats.std_dev ?? 0}%</p>
        </div>

        {/* Temperature Summary */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Temperature (°C)</span>
            <Thermometer className="w-4 h-4 text-amber-400" />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-900 p-2 rounded-lg">
              <span className="text-[10px] text-slate-500 uppercase">Min</span>
              <p className="font-bold text-white text-base">{summary.temperature_stats.min ?? '--'}°</p>
            </div>
            <div className="bg-slate-900 p-2 rounded-lg">
              <span className="text-[10px] text-teal-400 uppercase">Avg</span>
              <p className="font-bold text-teal-300 text-base">{summary.temperature_stats.avg ?? '--'}°</p>
            </div>
            <div className="bg-slate-900 p-2 rounded-lg">
              <span className="text-[10px] text-slate-500 uppercase">Max</span>
              <p className="font-bold text-white text-base">{summary.temperature_stats.max ?? '--'}°</p>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 text-center">Thermal Variance: ±{summary.temperature_stats.std_dev ?? 0}°C</p>
        </div>
      </div>

      {/* Signal Quality & Hardware Telemetry Breakdown */}
      <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white flex items-center space-x-1.5">
            <Radio className="w-3.5 h-3.5 text-teal-400" />
            <span>Virtual Sensor Signal Quality Distribution</span>
          </span>
          <span className="text-slate-400 text-[11px]">Enforces strict provenance & zero false normal hallucination</span>
        </div>

        {/* Multi-segment quality bar */}
        <div className="w-full bg-slate-900 h-3 rounded-full flex overflow-hidden">
          <div 
            style={{ width: `${summary.quality_distribution.optimal_pct}%` }} 
            className="bg-emerald-500 h-full" 
            title={`Optimal: ${summary.quality_distribution.optimal_pct}%`}
          />
          <div 
            style={{ width: `${summary.quality_distribution.acceptable_pct}%` }} 
            className="bg-teal-400 h-full" 
            title={`Acceptable: ${summary.quality_distribution.acceptable_pct}%`}
          />
          <div 
            style={{ width: `${summary.quality_distribution.degraded_pct}%` }} 
            className="bg-amber-400 h-full" 
            title={`Degraded: ${summary.quality_distribution.degraded_pct}%`}
          />
          <div 
            style={{ width: `${summary.quality_distribution.disconnected_pct}%` }} 
            className="bg-rose-500 h-full" 
            title={`Disconnected: ${summary.quality_distribution.disconnected_pct}%`}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1">
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Optimal ({summary.quality_distribution.optimal_pct}%)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-teal-400" />
            <span>Acceptable ({summary.quality_distribution.acceptable_pct}%)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Degraded ({summary.quality_distribution.degraded_pct}%)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Disconnected / Missing ({summary.quality_distribution.disconnected_pct}%)</span>
          </div>
        </div>
      </div>

      {/* Clinical Contextual Recommendations */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
          Algorithmic Monitoring Recommendations
        </span>
        <div className="space-y-1.5">
          {summary.recommendations.map((rec, i) => (
            <div key={i} className="flex items-start space-x-2 text-xs bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <span>{rec}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
