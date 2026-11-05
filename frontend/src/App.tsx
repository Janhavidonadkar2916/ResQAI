import { useState, useEffect, useCallback } from 'react';
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
  RefreshCw, 
  Sliders, 
  Info, 
  UserCheck, 
  Flame,
  BrainCircuit,
  BarChart3,
  Siren,
  ChevronRight
} from 'lucide-react';
import { fetchApi } from './api/client';
import { patientApi, PatientDetail } from './api/patientApi';
import { sensorApi } from './api/sensorApi';
import { SystemHealthStatus, SensorPacket, User as UserType } from './types';
import { PatientRoster } from './components/dashboard/PatientRoster';
import { VitalsTrendChart } from './components/monitoring/VitalsTrendChart';
import { Kinematic3DPlot } from './components/monitoring/Kinematic3DPlot';
import { AnalyticsSummaryCards } from './components/monitoring/AnalyticsSummaryCards';
import { SimulatorControlPanel } from './components/simulator/SimulatorControlPanel';
import { AIInsightsPanel } from './components/intelligence/AIInsightsPanel';
import { EmergencyConsole } from './components/emergency/EmergencyConsole';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { AuthModal } from './components/auth/AuthModal';

export default function App() {
  const [health, setHealth] = useState<SystemHealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Navigation Tabs for Phase 1 - 4
  const [activeTab, setActiveTab] = useState<'overview' | 'emergencies' | 'ai-insights' | 'analytics' | 'simulator'>('overview');

  // Patients State
  const [patients, setPatients] = useState<PatientDetail[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Telemetry State
  const [latestPacket, setLatestPacket] = useState<SensorPacket | null>(null);
  const [history, setHistory] = useState<SensorPacket[]>([]);
  const [chartLoading, setChartLoading] = useState<boolean>(false);

  // Auth & Session
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);

  // Check health and current user
  const checkHealth = useCallback(async () => {
    setHealthLoading(true);
    setError(null);
    try {
      const data = await fetchApi<SystemHealthStatus>('/health');
      setHealth(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to reach ResQCare AI Backend API');
      }
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  // Load initial patients
  const loadPatients = useCallback(async () => {
    try {
      const list = await patientApi.list();
      setPatients(list);
      if (list.length > 0 && !selectedPatientId) {
        setSelectedPatientId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load patients:', err);
    }
  }, [selectedPatientId]);

  // Load patient telemetry (latest + history)
  const loadTelemetry = useCallback(async (pid: string) => {
    setChartLoading(true);
    try {
      const [latest, hist] = await Promise.all([
        sensorApi.getLatest(pid),
        sensorApi.getHistory(pid, 30)
      ]);
      setLatestPacket(latest);
      setHistory(hist);
    } catch (err) {
      console.error('Failed to load telemetry:', err);
    } finally {
      setChartLoading(false);
    }
  }, []);

  // Check current user session
  useEffect(() => {
    const token = localStorage.getItem('resqcare_token');
    if (token) {
      fetchApi<UserType>('/auth/me')
        .then(setCurrentUser)
        .catch(() => localStorage.removeItem('resqcare_token'));
    }
  }, []);

  // Initial mount
  useEffect(() => {
    checkHealth();
    loadPatients();
  }, [checkHealth, loadPatients]);

  // When selected patient changes, load their telemetry
  useEffect(() => {
    if (selectedPatientId) {
      loadTelemetry(selectedPatientId);
    }
  }, [selectedPatientId, loadTelemetry]);

  // Handle packet emitted from simulator
  const handlePacketGenerated = (packet: SensorPacket) => {
    setLatestPacket(packet);
    setHistory((prev) => {
      const updated = [...prev, packet];
      if (updated.length > 40) updated.shift();
      return updated;
    });
  };

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);
  const patientDisplayName = selectedPatient ? `${selectedPatient.first_name} ${selectedPatient.last_name}` : 'Patient';

  // Status badge styling
  const isHypoxic = latestPacket?.spo2_percent !== null && latestPacket?.spo2_percent !== undefined && latestPacket.spo2_percent < 90;
  const isTachycardic = latestPacket?.heart_rate_bpm !== null && latestPacket?.heart_rate_bpm !== undefined && latestPacket.heart_rate_bpm > 130;
  const isBradycardic = latestPacket?.heart_rate_bpm !== null && latestPacket?.heart_rate_bpm !== undefined && latestPacket.heart_rate_bpm < 50;
  const isFallAlert = latestPacket?.activity_label === 'FALL_SUSPECTED' || latestPacket?.activity_label === 'POST_FALL_STATIONARY';
  const isSensorDropped = latestPacket?.signal_quality === 'DISCONNECTED' || latestPacket?.data_quality_status === 'MISSING_SENSORS';

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-teal-500 selection:text-white">
      {/* Top Clinical & Research Disclaimer */}
      <div className="bg-amber-950/80 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>RESEARCH & MONITORING PROTOTYPE:</strong> Developed for software evaluation and simulation. Not an FDA/CE certified medical device. No clinical diagnosis provided.
          </span>
        </div>
        <div className="hidden md:flex items-center space-x-4 text-slate-400 text-[11px]">
          <span>Schema: <strong className="text-teal-400">Contract v1.0</strong></span>
          <span>Dual DB: <strong className="text-teal-400">{health?.database || 'Active'}</strong></span>
          <span>Emergency System: <strong className="text-rose-400">State Machine Ready</strong></span>
        </div>
      </div>

      {/* Primary Header */}
      <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-white">ResQCare <span className="text-teal-400">AI</span></h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full">
                Phase 4 Emergency Response
              </span>
            </div>
            <p className="text-xs text-slate-400">Intelligent Health Telemetry & Emergency Coordination Command Center</p>
          </div>
        </div>

        {/* Right Controls: In-App Alerts + User Profile + System Status */}
        <div className="flex items-center space-x-3">
          {/* Notification Alert Bell Drawer */}
          <NotificationDrawer onSelectEvent={() => setActiveTab('emergencies')} />

          <button
            onClick={() => setIsAuthOpen(true)}
            className="flex items-center space-x-2 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-xl transition-all"
          >
            <UserCheck className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">{currentUser ? currentUser.full_name : 'Sign In / Persona'}</span>
          </button>

          <button 
            onClick={checkHealth}
            disabled={healthLoading}
            className="flex items-center space-x-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-xl transition-all"
            title="Refresh backend status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${healthLoading ? 'animate-spin text-teal-400' : 'text-slate-400'}`} />
            <span className="hidden md:inline">{healthLoading ? 'Checking...' : 'Refresh'}</span>
          </button>

          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border bg-slate-900 border-slate-800">
            <span className={`w-2.5 h-2.5 rounded-full ${health ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-xs font-medium text-slate-300 hidden md:inline">
              {health ? 'Engine Online' : 'Engine Offline'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">

        {/* Navigation Tabs (Overview, Emergency Response, AI Insights, Analytics, Simulator) */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'overview'
                ? 'bg-teal-500/15 text-teal-300 border border-teal-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Overview & Waveforms</span>
          </button>

          <button
            onClick={() => setActiveTab('emergencies')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'emergencies'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-sm shadow-rose-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Siren className="w-3.5 h-3.5 text-rose-400" />
            <span>Emergency Response</span>
          </button>

          <button
            onClick={() => setActiveTab('ai-insights')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'ai-insights'
                ? 'bg-teal-500/15 text-teal-300 border border-teal-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5 text-teal-400" />
            <span>AI Anomaly & Risk Inspector</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'analytics'
                ? 'bg-teal-500/15 text-teal-300 border border-teal-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-teal-400" />
            <span>24h Telemetry Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'simulator'
                ? 'bg-teal-500/15 text-teal-300 border border-teal-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-teal-400" />
            <span>Virtual Sensor Simulator</span>
          </button>
        </div>

        {/* Backend Error Banner */}
        {error && (
          <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-4 text-xs text-rose-300 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-sm">Backend Connectivity Notice</p>
              <p className="text-rose-400/80">
                Could not connect to FastAPI server. Run <code className="bg-slate-900 px-1 py-0.5 rounded text-slate-200">./start_dev.sh</code> to launch both backend and frontend.
              </p>
            </div>
          </div>
        )}

        {/* Live Critical Incident Alert Banner (Shows when anomaly occurs) */}
        {(isFallAlert || isHypoxic || isTachycardic || isBradycardic || isSensorDropped) && (
          <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            isFallAlert 
              ? 'bg-rose-950/70 border-rose-500 text-rose-200 animate-pulse'
              : isHypoxic 
              ? 'bg-amber-950/70 border-amber-500 text-amber-200'
              : isTachycardic || isBradycardic
              ? 'bg-orange-950/70 border-orange-500 text-orange-200'
              : 'bg-slate-900 border-slate-700 text-slate-300'
          }`}>
            <div className="flex items-center space-x-3">
              <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0" />
              <div>
                <h4 className="text-sm font-bold">
                  {isFallAlert && `CRITICAL FALL EVENT DETECTED: ${patientDisplayName}`}
                  {isHypoxic && `SEVERE HYPOXIA ALERT: SpO2 ${latestPacket?.spo2_percent}% below 90% threshold`}
                  {isTachycardic && `ACUTE TACHYCARDIA EPISODE: Heart Rate ${latestPacket?.heart_rate_bpm} BPM`}
                  {isBradycardic && `CRITICAL BRADYCARDIA ALERT: Heart Rate ${latestPacket?.heart_rate_bpm} BPM`}
                  {isSensorDropped && `TELEMETRY NOTICE: Sensor Disconnected / Missing Electrodes`}
                </h4>
                <p className="text-xs opacity-90 mt-0.5">
                  Simulated observation frame recorded at {latestPacket?.recorded_at ? new Date(latestPacket.recorded_at).toLocaleTimeString() : 'N/A'}.
                  Emergency Response state machine actively tracking this event.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('emergencies')}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-rose-600/30 flex items-center space-x-1.5 shrink-0"
            >
              <span>Manage Emergency Response</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Selected Patient Vitals Summary Ribbon */}
        {selectedPatient && latestPacket && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 font-bold">
                  {selectedPatient.first_name[0]}{selectedPatient.last_name[0]}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base font-bold text-white">
                      {selectedPatient.first_name} {selectedPatient.last_name}
                    </h2>
                    <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-mono">
                      {selectedPatient.room_or_residence}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    DOB: {selectedPatient.date_of_birth} • Gender: {selectedPatient.gender} • Emergency Contacts: {selectedPatient.emergency_contacts?.length || 0}
                  </p>
                </div>
              </div>

              {/* Status and Quality Flags */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={`px-2.5 py-1 rounded-lg border font-semibold ${
                  latestPacket.data_quality_status === 'VALID'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}>
                  Data: {latestPacket.data_quality_status}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                  Signal: {latestPacket.signal_quality}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 font-medium">
                  Activity: {latestPacket.activity_label}
                </span>
              </div>
            </div>

            {/* Vitals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Heart Rate Card */}
              <div className={`p-4 rounded-xl border transition-all ${
                isTachycardic || isBradycardic
                  ? 'bg-rose-950/40 border-rose-500/50'
                  : 'bg-slate-950/70 border-slate-800/80'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Heart Rate</span>
                  <Heart className={`w-4 h-4 ${isTachycardic || isBradycardic ? 'text-rose-400 animate-pulse' : 'text-rose-400'}`} />
                </div>
                <div className="flex items-baseline space-x-1.5 mt-2">
                  <span className="text-3xl font-extrabold text-white">
                    {latestPacket.heart_rate_bpm ?? '--'}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">BPM</span>
                </div>
                <div className="text-[11px] mt-1 text-slate-500">
                  {latestPacket.heart_rate_bpm ? (
                    latestPacket.heart_rate_bpm > 100 ? (
                      <span className="text-rose-400 font-semibold flex items-center space-x-1">
                        <Flame className="w-3 h-3" />
                        <span>Elevated / Tachycardic</span>
                      </span>
                    ) : latestPacket.heart_rate_bpm < 60 ? (
                      <span className="text-amber-400 font-semibold">Low / Bradycardic</span>
                    ) : (
                      <span className="text-emerald-400">Normal Resting Band</span>
                    )
                  ) : (
                    <span className="text-slate-500">Sensor Disconnected</span>
                  )}
                </div>
              </div>

              {/* SpO2 Card */}
              <div className={`p-4 rounded-xl border transition-all ${
                isHypoxic
                  ? 'bg-rose-950/40 border-rose-500/50'
                  : 'bg-slate-950/70 border-slate-800/80'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Blood Oxygen (SpO2)</span>
                  <Wind className="w-4 h-4 text-teal-400" />
                </div>
                <div className="flex items-baseline space-x-1.5 mt-2">
                  <span className="text-3xl font-extrabold text-white">
                    {latestPacket.spo2_percent ?? '--'}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">%</span>
                </div>
                <div className="text-[11px] mt-1 text-slate-500">
                  {latestPacket.spo2_percent ? (
                    latestPacket.spo2_percent < 90 ? (
                      <span className="text-rose-400 font-semibold">Hypoxia Risk (&lt; 90%)</span>
                    ) : latestPacket.spo2_percent < 95 ? (
                      <span className="text-amber-400 font-semibold">Borderline Mild Hypoxia</span>
                    ) : (
                      <span className="text-emerald-400">Adequate Oxygenation</span>
                    )
                  ) : (
                    <span className="text-slate-500">Sensor Disconnected</span>
                  )}
                </div>
              </div>

              {/* Temperature Card */}
              <div className="p-4 rounded-xl border bg-slate-950/70 border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Body Temperature</span>
                  <Thermometer className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex items-baseline space-x-1.5 mt-2">
                  <span className="text-3xl font-extrabold text-white">
                    {latestPacket.temperature_c ?? '--'}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">°C</span>
                </div>
                <div className="text-[11px] mt-1 text-slate-500">
                  {latestPacket.temperature_c ? (
                    latestPacket.temperature_c > 38.0 ? (
                      <span className="text-amber-400 font-semibold">Febrile / High Temp</span>
                    ) : (
                      <span className="text-emerald-400">Normothermic Range</span>
                    )
                  ) : (
                    <span className="text-slate-500">Sensor Disconnected</span>
                  )}
                </div>
              </div>

              {/* Accelerometer Kinematics Card */}
              <div className={`p-4 rounded-xl border transition-all ${
                isFallAlert
                  ? 'bg-rose-950/40 border-rose-500/50'
                  : 'bg-slate-950/70 border-slate-800/80'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Motion Kinematics</span>
                  <Radio className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="grid grid-cols-3 gap-1 mt-2 font-mono text-xs">
                  <div className="bg-slate-900 p-1.5 rounded text-center">
                    <span className="text-[9px] text-slate-500 block">X</span>
                    <span className="text-white font-bold">{latestPacket.accel_x ?? '--'}g</span>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded text-center">
                    <span className="text-[9px] text-slate-500 block">Y</span>
                    <span className="text-white font-bold">{latestPacket.accel_y ?? '--'}g</span>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded text-center">
                    <span className="text-[9px] text-slate-500 block">Z</span>
                    <span className="text-white font-bold">{latestPacket.accel_z ?? '--'}g</span>
                  </div>
                </div>
                <div className="text-[11px] mt-1.5 text-slate-500">
                  {isFallAlert ? (
                    <span className="text-rose-400 font-bold">Fall Kinematics Triggered</span>
                  ) : (
                    <span className="text-slate-400">Posture: {latestPacket.activity_label}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Tab Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Monitored Patient Roster */}
          <div className="lg:col-span-1">
            <PatientRoster
              patients={patients}
              selectedPatientId={selectedPatientId}
              onSelectPatient={(id) => setSelectedPatientId(id)}
            />
          </div>

          {/* Right Column: Tab View */}
          <div className="lg:col-span-3 space-y-6">
            {activeTab === 'overview' && (
              <>
                <VitalsTrendChart data={history} isLoading={chartLoading} />
                <Kinematic3DPlot packet={latestPacket} />
              </>
            )}

            {activeTab === 'emergencies' && (
              <EmergencyConsole
                patientId={selectedPatientId || undefined}
                patientName={patientDisplayName}
              />
            )}

            {activeTab === 'ai-insights' && selectedPatientId && (
              <AIInsightsPanel
                patientId={selectedPatientId}
                patientName={patientDisplayName}
              />
            )}

            {activeTab === 'analytics' && selectedPatientId && (
              <AnalyticsSummaryCards
                patientId={selectedPatientId}
                patientName={patientDisplayName}
              />
            )}

            {activeTab === 'simulator' && selectedPatientId && (
              <SimulatorControlPanel
                patientId={selectedPatientId}
                patientName={patientDisplayName}
                onPacketGenerated={handlePacketGenerated}
                onBatchGenerated={() => loadTelemetry(selectedPatientId)}
              />
            )}
          </div>
        </div>

        {/* System Architecture Specifications Footer Card */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-semibold">FastAPI Engine</span>
              <Cpu className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <p className="text-white font-bold">{health ? `Version ${health.version}` : 'Connecting...'}</p>
            <p className="text-slate-500">Pydantic v2 Contract Validation</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-semibold">Dual Database</span>
              <Database className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <p className="text-white font-bold">{health ? health.database : 'Dual Mode'}</p>
            <p className="text-slate-500">PostgreSQL 16 & SQLite Fallback</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-semibold">AI Intelligence Engine</span>
              <BrainCircuit className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <p className="text-white font-bold">Two-Tier Hybrid</p>
            <p className="text-slate-500">Rules + Isolation Forest</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-semibold">Emergency System</span>
              <Siren className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <p className="text-white font-bold">State Machine Active</p>
            <p className="text-slate-500">Grace Verification & Auto-Escalation</p>
          </div>
        </div>

      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          loadPatients();
        }}
        onLogout={() => {
          localStorage.removeItem('resqcare_token');
          setCurrentUser(null);
        }}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 px-6 py-4 text-xs text-slate-500 flex flex-col md:flex-row items-center justify-between gap-2 mt-8">
        <div className="flex items-center space-x-2">
          <Info className="w-4 h-4 text-slate-400" />
          <span>ResQCare AI Prototype • Research-Oriented Portfolio Architecture</span>
        </div>
        <div>
          <span>Modular Monolith • FastAPI • React 18 • TypeScript • Tailwind CSS • Scikit-Learn • Recharts</span>
        </div>
      </footer>
    </div>
  );
}
