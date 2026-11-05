import { useState, useEffect } from 'react';
import { 
  Sliders, 
  Play, 
  Zap, 
  RotateCcw, 
  AlertTriangle, 
  Check, 
  Flame, 
  ShieldAlert, 
  Activity,
  Layers
} from 'lucide-react';
import { simulatorApi, ScenarioInfo } from '../../api/simulatorApi';
import { SensorPacket } from '../../types';

interface SimulatorControlPanelProps {
  patientId: string;
  patientName: string;
  onPacketGenerated: (packet: SensorPacket) => void;
  onBatchGenerated: () => void;
}

export function SimulatorControlPanel({
  patientId,
  patientName,
  onPacketGenerated,
  onBatchGenerated
}: SimulatorControlPanelProps) {
  const [scenarios, setScenarios] = useState<ScenarioInfo[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string>('NORMAL_RESTING');
  const [tickRate, setTickRate] = useState<number>(1000);
  const [isAutoTicking, setIsAutoTicking] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load scenarios on mount
  useEffect(() => {
    simulatorApi.getScenarios()
      .then(setScenarios)
      .catch((err) => console.error('Failed to load scenarios:', err));
  }, []);

  // Configure simulator on scenario change
  const handleSelectScenario = async (name: string) => {
    setSelectedScenario(name);
    try {
      await simulatorApi.configure(patientId, name, tickRate);
      showNotification(`Simulation profile updated: ${name}`);
    } catch (err) {
      console.error('Failed to configure simulator:', err);
    }
  };

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Generate single tick
  const handleSingleTick = async (overrideScenario?: string) => {
    setLoading(true);
    try {
      const packet = await simulatorApi.tick(patientId, overrideScenario || selectedScenario);
      onPacketGenerated(packet);
      showNotification(`Synthesized packet: ${overrideScenario || selectedScenario}`);
    } catch (err) {
      console.error('Tick generation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate historical batch
  const handleBatch = async () => {
    setLoading(true);
    try {
      await simulatorApi.batch(patientId, selectedScenario, 25);
      onBatchGenerated();
      showNotification(`Ingested 25 sequential historical observations for ${patientName}`);
    } catch (err) {
      console.error('Batch generation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-tick background runner (simulates live sensor telemetry stream)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isAutoTicking && patientId) {
      interval = setInterval(async () => {
        try {
          const packet = await simulatorApi.tick(patientId, selectedScenario);
          onPacketGenerated(packet);
        } catch (err) {
          console.error('Auto-tick error:', err);
        }
      }, tickRate);
    }
    return () => clearInterval(interval);
  }, [isAutoTicking, patientId, selectedScenario, tickRate, onPacketGenerated]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-teal-400" />
            <h3 className="text-base font-bold text-white">Virtual Sensor Simulation Controller</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Active Target: <strong className="text-teal-300">{patientName}</strong> • Generates verified synthetic signals conforming to Contract v1.0
          </p>
        </div>

        {/* Live Auto-Stream Toggle */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Tick Rate:</span>
            <select
              value={tickRate}
              onChange={(e) => setTickRate(Number(e.target.value))}
              className="bg-transparent text-xs text-teal-300 font-semibold focus:outline-none cursor-pointer"
            >
              <option value={500} className="bg-slate-900">500 ms (Fast)</option>
              <option value={1000} className="bg-slate-900">1000 ms (1 Hz Standard)</option>
              <option value={2000} className="bg-slate-900">2000 ms (Normal)</option>
              <option value={5000} className="bg-slate-900">5000 ms (Battery-Save)</option>
            </select>
          </div>

          <button
            onClick={() => setIsAutoTicking(!isAutoTicking)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
              isAutoTicking
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20 animate-pulse'
                : 'bg-teal-500 hover:bg-teal-600 text-white shadow-teal-500/20'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isAutoTicking ? 'Stop Live Stream' : 'Start Live Telemetry'}</span>
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="bg-teal-950/60 border border-teal-500/40 text-teal-200 px-4 py-2 rounded-xl text-xs flex items-center space-x-2">
          <Check className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Scenario Presets Grid */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Select Clinical Simulation Scenario
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {scenarios.map((sc) => {
            const isSelected = sc.name === selectedScenario;
            return (
              <button
                key={sc.name}
                onClick={() => handleSelectScenario(sc.name)}
                className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-2 ${
                  isSelected
                    ? 'bg-teal-500/15 border-teal-500 text-white shadow-md shadow-teal-500/10 ring-1 ring-teal-500'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{sc.display_title}</span>
                    {sc.risk_profile.includes('CRITICAL') ? (
                      <Flame className="w-3.5 h-3.5 text-rose-400" />
                    ) : sc.risk_profile.includes('URGENT') ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Activity className="w-3.5 h-3.5 text-teal-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{sc.description}</p>
                </div>
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                  <span className="font-mono text-teal-400/90">{sc.target_vitals}</span>
                  <span className={`px-1.5 py-0.5 rounded uppercase font-semibold ${
                    sc.risk_profile.includes('CRITICAL') ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {sc.risk_profile.split(' ')[0]}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual Actions & Anomaly Injection Bar */}
      <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleSingleTick()}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
          >
            <Zap className="w-3.5 h-3.5 text-teal-400" />
            <span>Generate 1 Frame</span>
          </button>

          <button
            onClick={handleBatch}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Seed 25 Historical Frames</span>
          </button>
        </div>

        {/* Quick Anomaly Triggers */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">Instant Anomaly:</span>
          <button
            onClick={() => handleSingleTick('FALL_IMPACT_AND_IMMOBILITY')}
            className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 text-xs font-semibold transition-all"
            title="Simulate sudden fall impact peak >3.5g"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Simulate Fall</span>
          </button>

          <button
            onClick={() => handleSingleTick('TACHYCARDIA_EPISODE')}
            className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/40 text-amber-300 text-xs font-semibold transition-all"
            title="Simulate sudden heart rate spike >140 BPM"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate Arrhythmia</span>
          </button>

          <button
            onClick={() => handleSelectScenario('NORMAL_RESTING')}
            className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-all"
            title="Reset to resting baseline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Normal</span>
          </button>
        </div>
      </div>
    </div>
  );
}
