import { useState, useEffect } from 'react';
import { 
  Activity, 
  ShieldAlert, 
  Cpu, 
  Database, 
  Radio, 
  Heart, 
  Thermometer, 
  Wind, 
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Info
} from 'lucide-react';
import { fetchApi } from './api/client';
import { SystemHealthStatus, SensorPacket } from './types';

export default function App() {
  const [health, setHealth] = useState<SystemHealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'simulator' | 'patients' | 'emergencies'>('overview');
  
  // Sample simulated telemetry preview for Phase 0 verification
  const [sampleTelemetry] = useState<SensorPacket>({
    schema_version: '1.0',
    reading_id: '550e8400-e29b-41d4-a716-446655440000',
    patient_id: 'c9b4e872-4cf3-4819-bf98-0c6575cbba11',
    source_type: 'VIRTUAL_SIMULATOR',
    recorded_at: new Date().toISOString(),
    received_at: new Date().toISOString(),
    heart_rate_bpm: 74.2,
    spo2_percent: 98.5,
    temperature_c: 36.8,
    accel_x: 0.04,
    accel_y: 0.98,
    accel_z: 0.12,
    activity_label: 'RESTING',
    signal_quality: 'OPTIMAL',
    data_quality_status: 'VALID',
    provenance_metadata: {
      scenario_name: 'NORMAL_RESTING',
      synthetic_noise_std: 0.05,
      simulated_battery_pct: 95
    }
  });

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchApi<SystemHealthStatus>('/health');
      setHealth(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to connect to ResQCare AI Backend API');
      }
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-teal-500 selection:text-white">
      {/* Top Warning Banner: Non-Clinical Prototype & Synthetic Data */}
      <div className="bg-amber-950/80 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>RESEARCH & MONITORING PROTOTYPE:</strong> Strictly for research and simulation. Not an FDA/CE certified medical device. Contains synthetic simulated signals only.
          </span>
        </div>
        <div className="hidden md:flex items-center space-x-4 text-slate-400">
          <span>Schema Contract: <strong className="text-teal-400">v1.0</strong></span>
          <span>Simulation Mode: <strong className="text-teal-400">Software-First</strong></span>
        </div>
      </div>

      {/* Main Header / Navigation */}
      <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-white">ResQCare <span className="text-teal-400">AI</span></h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded-full">
                Phase 0 Foundation
              </span>
            </div>
            <p className="text-xs text-slate-400">Intelligent Health Telemetry & Emergency Coordination</p>
          </div>
        </div>

        {/* System Health Status Indicator */}
        <div className="flex items-center space-x-4">
          <button 
            onClick={checkHealth}
            disabled={loading}
            className="flex items-center space-x-2 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition-all"
            title="Refresh backend status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-400' : 'text-slate-400'}`} />
            <span>{loading ? 'Checking...' : 'Check API'}</span>
          </button>

          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border bg-slate-900 border-slate-800">
            <span className={`w-2.5 h-2.5 rounded-full ${health ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-xs font-medium text-slate-300">
              {health ? 'Backend Online' : 'Backend Offline'}
            </span>
          </div>
        </div>
      </header>

      {/* Primary Layout Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex space-x-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'overview'
                ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Command Overview
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'simulator'
                ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Virtual Sensor Simulator
          </button>
          <button
            onClick={() => setActiveTab('patients')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'patients'
                ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Patient Monitoring
          </button>
          <button
            onClick={() => setActiveTab('emergencies')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'emergencies'
                ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Emergency Incidents
          </button>
        </div>

        {/* Backend Connectivity Status Notification */}
        {error && (
          <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-4 text-sm text-rose-300 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Backend Connection Notice</p>
              <p className="text-xs text-rose-400/80">
                The frontend is running, but could not reach the FastAPI server at <code className="bg-slate-900 px-1 py-0.5 rounded text-slate-200">/api/v1/health</code>.
                Make sure the backend is running with <code className="bg-slate-900 px-1 py-0.5 rounded text-slate-200">uvicorn app.main:app --reload</code>.
              </p>
            </div>
          </div>
        )}

        {/* System Architecture Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>FastAPI Backend</span>
              <Cpu className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-xl font-bold text-white">
              {health ? `v${health.version}` : 'Connecting...'}
            </div>
            <div className="text-xs text-slate-500 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Modular Monolith Core</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Database Layer</span>
              <Database className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-xl font-bold text-white">
              {health ? health.database : 'PostgreSQL / SQLite'}
            </div>
            <div className="text-xs text-slate-500 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>UUID & UTC Timestamps</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Virtual Telemetry</span>
              <Radio className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-white">
              {health ? `${health.active_simulators} Active Streams` : 'Virtual Sensor Engine'}
            </div>
            <div className="text-xs text-slate-500 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>No Hardware Required</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Intelligence Engine</span>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-xl font-bold text-white">
              Two-Tier
            </div>
            <div className="text-xs text-slate-500 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Rules + Anomaly Scorer</span>
            </div>
          </div>
        </div>

        {/* Live Telemetry Card Preview (Validated Sensor Contract v1.0) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white">Sensor Data Contract Validation</h2>
                <span className="text-xs font-mono bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded border border-teal-500/20">
                  Schema 1.0 (Live Packet)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Demonstrates simulated vital signs and 3-axis kinematics conforming to canonical ResQCare JSON contract.
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                Quality: {sampleTelemetry.signal_quality}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                Activity: {sampleTelemetry.activity_label}
              </span>
            </div>
          </div>

          {/* Vitals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Heart Rate */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                <Heart className="w-6 h-6 text-rose-400 animate-pulse" />
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Heart Rate</span>
                <div className="flex items-baseline space-x-1">
                  <span className="text-2xl font-bold text-white">{sampleTelemetry.heart_rate_bpm ?? '--'}</span>
                  <span className="text-xs text-slate-400">BPM</span>
                </div>
                <span className="text-[11px] text-emerald-400">Resting Normal Range (60-100)</span>
              </div>
            </div>

            {/* SpO2 */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
                <Wind className="w-6 h-6 text-teal-400" />
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Blood Oxygen (SpO2)</span>
                <div className="flex items-baseline space-x-1">
                  <span className="text-2xl font-bold text-white">{sampleTelemetry.spo2_percent ?? '--'}</span>
                  <span className="text-xs text-slate-400">%</span>
                </div>
                <span className="text-[11px] text-emerald-400">Normal Oxygenation (&gt; 95%)</span>
              </div>
            </div>

            {/* Temperature */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Thermometer className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Body Temperature</span>
                <div className="flex items-baseline space-x-1">
                  <span className="text-2xl font-bold text-white">{sampleTelemetry.temperature_c ?? '--'}</span>
                  <span className="text-xs text-slate-400">°C</span>
                </div>
                <span className="text-[11px] text-emerald-400">Normothermic (36.5 - 37.5)</span>
              </div>
            </div>
          </div>

          {/* Accelerometer Kinematics Frame */}
          <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium text-slate-300">Virtual 3-Axis Accelerometer (Fall Detection Baseline)</span>
              <span className="font-mono text-slate-500">Unit: Standard Gravities (g)</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-center">
                <span className="text-[11px] text-slate-500 uppercase">Accel X</span>
                <p className="font-mono text-sm font-semibold text-teal-400">{sampleTelemetry.accel_x} g</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-center">
                <span className="text-[11px] text-slate-500 uppercase">Accel Y (Gravity)</span>
                <p className="font-mono text-sm font-semibold text-emerald-400">{sampleTelemetry.accel_y} g</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-center">
                <span className="text-[11px] text-slate-500 uppercase">Accel Z</span>
                <p className="font-mono text-sm font-semibold text-teal-400">{sampleTelemetry.accel_z} g</p>
              </div>
            </div>
          </div>
        </div>

        {/* Development Milestones Road Ahead */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-teal-400" />
            <h3 className="text-base font-bold text-white">Phase-Wise Implementation Roadmap</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-950 border border-teal-500/30 rounded-xl space-y-1">
              <span className="font-semibold text-teal-300">Phase 0 — Project Foundation (Active)</span>
              <p className="text-slate-400">Repo setup, FastAPI modular monolith, React frontend, schema contracts, dual DB support.</p>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="font-semibold text-slate-300">Phase 1 — Software MVP</span>
              <p className="text-slate-400">JWT Auth, patient profiles, virtual simulator service, ingestion API, basic telemetry charts.</p>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="font-semibold text-slate-300">Phase 2 — Real-Time Monitoring</span>
              <p className="text-slate-400">WebSocket telemetry streaming, signal quality degradation flags, 3-axis motion waveforms.</p>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="font-semibold text-slate-300">Phase 3 — AI Intelligence</span>
              <p className="text-slate-400">Deterministic clinical rule engine, kinematic fall detection, rolling Z-score & Isolation Forest.</p>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="font-semibold text-slate-300">Phase 4 — Emergency Response</span>
              <p className="text-slate-400">Verification countdown, caregiver acknowledge/escalate workflows, incident timeline dossier.</p>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="font-semibold text-slate-300">Phase 5 — Security & Medical Profiles</span>
              <p className="text-slate-400">Role-Based Access Control (RBAC), emergency medical passes, tamper-evident audit logs.</p>
            </div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 px-6 py-4 text-xs text-slate-500 flex flex-col md:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <Info className="w-4 h-4 text-slate-400" />
          <span>ResQCare AI Prototype • Research-Oriented Portfolio Architecture</span>
        </div>
        <div>
          <span>Developed with FastAPI • React • TypeScript • Tailwind CSS • SQLAlchemy</span>
        </div>
      </footer>
    </div>
  );
}
