import { User, ShieldAlert, Heart, Plus } from 'lucide-react';
import { PatientDetail } from '../../api/patientApi';

interface PatientRosterProps {
  patients: PatientDetail[];
  selectedPatientId: string | null;
  onSelectPatient: (id: string) => void;
  onAddPatientClick?: () => void;
}

export function PatientRoster({
  patients,
  selectedPatientId,
  onSelectPatient,
  onAddPatientClick
}: PatientRosterProps) {
  const getRiskBadge = (tier: string) => {
    switch (tier) {
      case 'CRITICAL':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'HIGH':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'MODERATE':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <User className="w-5 h-5 text-teal-400" />
          <h3 className="text-sm font-bold text-white tracking-tight">Monitored Individuals</h3>
        </div>
        <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-medium">
          {patients.length} Active
        </span>
      </div>

      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
        {patients.map((p) => {
          const isSelected = p.id === selectedPatientId;
          return (
            <button
              key={p.id}
              onClick={() => onSelectPatient(p.id)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col space-y-2 ${
                isSelected
                  ? 'bg-teal-500/10 border-teal-500/50 shadow-lg shadow-teal-500/5'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    {p.first_name} {p.last_name}
                  </h4>
                  <p className="text-[11px] text-slate-400">{p.room_or_residence}</p>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getRiskBadge(p.risk_tier)}`}>
                  {p.risk_tier} Risk
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/60">
                <div className="flex items-center space-x-1">
                  <Heart className="w-3 h-3 text-rose-400" />
                  <span>DOB: {p.date_of_birth}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <ShieldAlert className="w-3 h-3 text-teal-400" />
                  <span>{p.emergency_contacts?.length || 0} Contacts</span>
                </div>
              </div>
            </button>
          );
        })}

        {onAddPatientClick && (
          <button
            onClick={onAddPatientClick}
            className="w-full py-2.5 px-3 border border-dashed border-slate-700 hover:border-teal-500/60 rounded-xl text-xs font-medium text-slate-400 hover:text-teal-300 flex items-center justify-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Monitored Individual</span>
          </button>
        )}
      </div>
    </div>
  );
}

