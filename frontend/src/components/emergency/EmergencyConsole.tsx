import { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  ArrowUpRight, 
  UserCheck, 
  Plus, 
  FileText,
  Timer
} from 'lucide-react';
import { emergencyApi, EmergencyEvent, EmergencyTimelineLog } from '../../api/emergencyApi';

interface EmergencyConsoleProps {
  patientId?: string;
  patientName?: string;
}

export function EmergencyConsole({ patientId, patientName }: EmergencyConsoleProps) {
  const [events, setEvents] = useState<EmergencyEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [filterActive, setFilterActive] = useState<boolean>(true);

  // Dialog States
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [newReason, setNewReason] = useState('Suspected Fall & Acute Immobility');
  const [newSeverity, setNewSeverity] = useState<'CRITICAL' | 'URGENT' | 'WARNING'>('CRITICAL');

  const loadEvents = async () => {
    try {
      const data = await emergencyApi.list(patientId, filterActive);
      setEvents(data);
      if (data.length > 0 && !selectedEventId) {
        setSelectedEventId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load emergencies:', err);
    }
  };

  useEffect(() => {
    loadEvents();
    // Poll every 3 seconds to update countdowns and auto-escalations
    const interval = setInterval(loadEvents, 3000);
    return () => clearInterval(interval);
  }, [patientId, filterActive]);

  const selectedEvent = events.find((e) => e.id === selectedEventId) || events[0];

  const handleAcknowledge = async () => {
    if (!selectedEvent) return;
    try {
      await emergencyApi.acknowledge(selectedEvent.id);
      loadEvents();
    } catch (err) {
      console.error('Failed to acknowledge:', err);
    }
  };

  const handleEscalate = async () => {
    if (!selectedEvent) return;
    try {
      await emergencyApi.escalate(selectedEvent.id, 'Caregiver manual escalation to attending physician.');
      loadEvents();
    } catch (err) {
      console.error('Failed to escalate:', err);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    try {
      await emergencyApi.resolve(selectedEvent.id, actionNotes);
      setIsResolveModalOpen(false);
      setActionNotes('');
      loadEvents();
    } catch (err) {
      console.error('Failed to resolve:', err);
    }
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    try {
      await emergencyApi.cancel(selectedEvent.id, actionNotes);
      setIsCancelModalOpen(false);
      setActionNotes('');
      loadEvents();
    } catch (err) {
      console.error('Failed to cancel:', err);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) return;
    try {
      await emergencyApi.create(patientId, newReason, newSeverity, 45);
      setIsCreateModalOpen(false);
      loadEvents();
    } catch (err) {
      console.error('Failed to create emergency:', err);
    }
  };

  const getStateBadge = (state: string) => {
    switch (state) {
      case 'PENDING_VERIFICATION':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse';
      case 'VERIFIED':
      case 'ESCALATED':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse';
      case 'ACKNOWLEDGED':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
      case 'RESOLVED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'CANCELLED':
        return 'bg-slate-800 text-slate-400 border-slate-700';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h3 className="text-base font-bold text-white">Emergency Response & Verification Console</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Caregiver acknowledgement workflows, patient grace period verification, and incident state machine
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Active / All Toggle */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilterActive(true)}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filterActive ? 'bg-slate-800 text-teal-300 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Active Incidents
            </button>
            <button
              onClick={() => setFilterActive(false)}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                !filterActive ? 'bg-slate-800 text-teal-300 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Records
            </button>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Trigger Test Incident</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Incident List + Incident Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Incident List */}
        <div className="lg:col-span-1 space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
          {events.length === 0 ? (
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-500 space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
              <p>No active emergencies.</p>
              <p className="text-[11px] text-slate-600">Simulate an arrhythmia or fall in the Simulator tab to trigger incident workflows.</p>
            </div>
          ) : (
            events.map((ev) => {
              const isSelected = ev.id === selectedEvent?.id;
              return (
                <button
                  key={ev.id}
                  onClick={() => setSelectedEventId(ev.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col space-y-2 ${
                    isSelected
                      ? 'bg-rose-950/30 border-rose-500/60 shadow-lg shadow-rose-500/5'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 block">
                        {new Date(ev.detected_at).toLocaleTimeString()}
                      </span>
                      <h4 className="text-xs font-bold text-white line-clamp-1">{ev.reason}</h4>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getStateBadge(ev.state)}`}>
                      {ev.state.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {ev.seconds_remaining !== undefined && ev.seconds_remaining !== null && (
                    <div className="flex items-center space-x-1.5 text-xs text-amber-300 font-mono">
                      <Timer className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                      <span>Grace Period: {ev.seconds_remaining}s remaining</span>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/60">
                    <span>Patient: {ev.patient_name || patientName}</span>
                    <span className="font-semibold text-rose-400">{ev.severity}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Right Column: Selected Incident Dossier & Action Console */}
        <div className="lg:col-span-2 space-y-5">
          {selectedEvent ? (
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-5">
              {/* Incident Header */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${getStateBadge(selectedEvent.state)}`}>
                      {selectedEvent.state.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                      {selectedEvent.severity}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-2">{selectedEvent.reason}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Patient: <strong className="text-teal-300">{selectedEvent.patient_name || patientName}</strong> • Detected at {new Date(selectedEvent.detected_at).toLocaleString()}
                  </p>
                </div>

                {/* Grace Period Countdown Widget */}
                {selectedEvent.state === 'PENDING_VERIFICATION' && selectedEvent.seconds_remaining !== undefined && (
                  <div className="bg-amber-950/40 border border-amber-500/40 p-3 rounded-xl flex items-center space-x-3 text-amber-300">
                    <Timer className="w-6 h-6 text-amber-400 animate-pulse" />
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider block text-amber-400/80">
                        Patient Grace Period
                      </span>
                      <span className="text-xl font-extrabold font-mono">{selectedEvent.seconds_remaining}s</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons Bar */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                {selectedEvent.state !== 'ACKNOWLEDGED' && selectedEvent.state !== 'RESOLVED' && selectedEvent.state !== 'CANCELLED' && (
                  <button
                    onClick={handleAcknowledge}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-teal-500/20"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Acknowledge Incident</span>
                  </button>
                )}

                {selectedEvent.state !== 'RESOLVED' && selectedEvent.state !== 'CANCELLED' && (
                  <button
                    onClick={handleEscalate}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-orange-600/20"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Escalate Incident</span>
                  </button>
                )}

                {selectedEvent.state !== 'RESOLVED' && selectedEvent.state !== 'CANCELLED' && (
                  <button
                    onClick={() => {
                      setActionNotes('');
                      setIsResolveModalOpen(true);
                    }}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Resolve Incident</span>
                  </button>
                )}

                {selectedEvent.state === 'PENDING_VERIFICATION' && (
                  <button
                    onClick={() => {
                      setActionNotes('');
                      setIsCancelModalOpen(true);
                    }}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-all"
                  >
                    <XCircle className="w-4 h-4 text-slate-400" />
                    <span>Cancel False Alarm</span>
                  </button>
                )}
              </div>

              {/* Resolution Notes display if already resolved */}
              {selectedEvent.resolution_notes && (
                <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-xs space-y-1">
                  <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                    Documented Resolution Documentation
                  </span>
                  <p className="text-slate-200">{selectedEvent.resolution_notes}</p>
                </div>
              )}

              {/* Incident Timeline Audit Trail */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-teal-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Incident Audit Timeline ({selectedEvent.timeline?.length || 0} Events)
                  </h4>
                </div>

                <div className="space-y-2 border-l border-slate-800 pl-4 ml-2">
                  {selectedEvent.timeline && selectedEvent.timeline.length > 0 ? (
                    selectedEvent.timeline.map((log: EmergencyTimelineLog) => (
                      <div key={log.id} className="relative text-xs space-y-0.5">
                        <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-teal-500 ring-4 ring-slate-950" />
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white">{log.action.replace(/_/g, ' ')}</span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {new Date(log.logged_at).toLocaleTimeString()}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                            {log.actor_type}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{log.description}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">No timeline entries recorded.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-12 text-center text-xs text-slate-500">
              Select an incident from the list to view its response dossier and audit timeline.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Resolve Incident */}
      {isResolveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <h4 className="text-sm font-bold text-white">Document Emergency Incident Resolution</h4>
            <p className="text-xs text-slate-400">
              Enter clinical actions performed, patient status, and follow-up directives to close this incident.
            </p>
            <form onSubmit={handleResolveSubmit} className="space-y-3">
              <textarea
                required
                rows={4}
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="e.g. Caregiver arrived on site; verified patient conscious and uninjured; repositioned sensor; vital signs restored to normal."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-teal-500"
              />
              <div className="flex space-x-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsResolveModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl"
                >
                  Submit & Resolve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cancel False Alarm */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <h4 className="text-sm font-bold text-white">Cancel False Alarm Incident</h4>
            <p className="text-xs text-slate-400">
              Please specify the cancellation reason (e.g. patient accidental button press or motion artifact).
            </p>
            <form onSubmit={handleCancelSubmit} className="space-y-3">
              <textarea
                required
                rows={3}
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="e.g. Device dropped onto couch; patient confirmed safe."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-teal-500"
              />
              <div className="flex space-x-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl"
                >
                  Confirm Cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Trigger Test Emergency */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <h4 className="text-sm font-bold text-white">Simulate Emergency Incident</h4>
            <p className="text-xs text-slate-400">
              Injects a test emergency incident to verify the verification countdown, caregiver notifications, and escalation state machine.
            </p>
            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Reason / Trigger</label>
                <input
                  type="text"
                  required
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Severity Level</label>
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value as 'CRITICAL' | 'URGENT' | 'WARNING')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="CRITICAL">CRITICAL (Immediate Escalation)</option>
                  <option value="URGENT">URGENT (Elevated Caregiver Alert)</option>
                  <option value="WARNING">WARNING (Review Required)</option>
                </select>
              </div>

              <div className="flex space-x-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/20"
                >
                  Initiate Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
