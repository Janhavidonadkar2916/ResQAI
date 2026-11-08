import { useState, useEffect } from 'react';
import { 
  FileHeart, 
  ShieldAlert, 
  AlertTriangle, 
  Pill, 
  Phone, 
  Printer, 
  Check, 
  X, 
  RefreshCw,
  Hospital
} from 'lucide-react';
import { medicalProfileApi, MedicalProfile, EmergencyPassData } from '../../api/medicalProfileApi';

interface MedicalProfileViewProps {
  patientId: string;
  patientName: string;
}

export function MedicalProfileView({ patientId, patientName }: MedicalProfileViewProps) {
  const [profile, setProfile] = useState<MedicalProfile | null>(null);
  const [passData, setPassData] = useState<EmergencyPassData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isPassModalOpen, setIsPassModalOpen] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Edit Form State
  const [bloodGroup, setBloodGroup] = useState<string>('O+');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [newAllergy, setNewAllergy] = useState<string>('');
  const [conditions, setConditions] = useState<string[]>([]);
  const [newCondition, setNewCondition] = useState<string>('');
  const [dnrOrder, setDnrOrder] = useState<boolean>(false);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await medicalProfileApi.getProfile(patientId);
      setProfile(data);
      setBloodGroup(data.blood_group);
      setAllergies(data.allergies || []);
      setConditions(data.chronic_conditions || []);
      setDnrOrder(data.dnr_order);
    } catch (err) {
      console.error('Failed to load medical profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      loadProfile();
    }
  }, [patientId]);

  const handleExportPass = async () => {
    try {
      const data = await medicalProfileApi.getEmergencyPass(patientId);
      setPassData(data);
      setIsPassModalOpen(true);
    } catch (err) {
      console.error('Failed to export emergency pass:', err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await medicalProfileApi.updateProfile(patientId, {
        blood_group: bloodGroup,
        allergies,
        chronic_conditions: conditions,
        dnr_order: dnrOrder
      });
      setProfile(updated);
      setIsEditing(false);
      setSuccessMsg('Medical Profile updated & audit recorded.');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Failed to update medical profile:', err);
    }
  };

  const addAllergy = () => {
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy('');
    }
  };

  const removeAllergy = (item: string) => {
    setAllergies(allergies.filter((a) => a !== item));
  };

  const addCondition = () => {
    if (newCondition.trim() && !conditions.includes(newCondition.trim())) {
      setConditions([...conditions, newCondition.trim()]);
      setNewCondition('');
    }
  };

  const removeCondition = (item: string) => {
    setConditions(conditions.filter((c) => c !== item));
  };

  if (loading && !profile) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex items-center justify-center space-x-2 text-xs text-slate-400">
        <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
        <span>Decrypting secure medical profile...</span>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <FileHeart className="w-5 h-5 text-rose-400" />
            <h3 className="text-base font-bold text-white">Secure Emergency Medical Profile Vault</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Subject: <strong className="text-teal-300">{patientName}</strong> • Verified at {new Date(profile.last_verified_at).toLocaleDateString()} • Access is audit-logged
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExportPass}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold border border-slate-700 transition-all shadow"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Generate Emergency Pass</span>
          </button>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold shadow-md shadow-teal-500/20 transition-all"
          >
            <span>{isEditing ? 'Cancel Edit' : 'Edit Medical Record'}</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-teal-950/60 border border-teal-500/40 text-teal-200 px-4 py-2 rounded-xl text-xs flex items-center space-x-2">
          <Check className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Editor or Viewer */}
      {isEditing ? (
        <form onSubmit={handleSaveProfile} className="space-y-5 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400">Modify Clinical Information</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Blood Group */}
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Blood Group (ABO & Rh)</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
              >
                <option value="O+">O Positive (O+)</option>
                <option value="O-">O Negative (O-)</option>
                <option value="A+">A Positive (A+)</option>
                <option value="A-">A Negative (A-)</option>
                <option value="B+">B Positive (B+)</option>
                <option value="B-">B Negative (B-)</option>
                <option value="AB+">AB Positive (AB+)</option>
                <option value="AB-">AB Negative (AB-)</option>
              </select>
            </div>

            {/* DNR Directive */}
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Resuscitation Directives</label>
              <div className="flex items-center space-x-3 mt-2">
                <input
                  type="checkbox"
                  id="dnr"
                  checked={dnrOrder}
                  onChange={(e) => setDnrOrder(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-500 bg-slate-900 border-slate-700 focus:ring-0"
                />
                <label htmlFor="dnr" className="text-slate-200 cursor-pointer">
                  Do Not Resuscitate (DNR) Order on file
                </label>
              </div>
            </div>
          </div>

          {/* Allergies Input */}
          <div className="space-y-2 text-xs">
            <label className="font-semibold text-slate-300 block">Allergies & Drug Sensitivities</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {allergies.map((a) => (
                <span key={a} className="bg-rose-950/70 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-lg flex items-center space-x-1">
                  <span>{a}</span>
                  <button type="button" onClick={() => removeAllergy(a)}><X className="w-3 h-3 text-rose-400" /></button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                placeholder="Add allergy (e.g. Sulfa, Codeine)"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-teal-500"
              />
              <button
                type="button"
                onClick={addAllergy}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold"
              >
                Add
              </button>
            </div>
          </div>

          {/* Chronic Conditions Input */}
          <div className="space-y-2 text-xs">
            <label className="font-semibold text-slate-300 block">Pre-Existing Chronic Conditions</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {conditions.map((c) => (
                <span key={c} className="bg-amber-950/70 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-lg flex items-center space-x-1">
                  <span>{c}</span>
                  <button type="button" onClick={() => removeCondition(c)}><X className="w-3 h-3 text-amber-400" /></button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value)}
                placeholder="Add condition (e.g. Asthma, Arrhythmia)"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-teal-500"
              />
              <button
                type="button"
                onClick={addCondition}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold"
              >
                Add
              </button>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold rounded-xl"
            >
              Save & Audit
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          {/* Top Quick Status Ribbon */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Blood Group */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Blood Group</span>
                <p className="text-2xl font-extrabold text-rose-400">{profile.blood_group}</p>
                <span className="text-[10px] text-slate-500">Universal Compatible Reference</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 font-bold">
                Rh
              </div>
            </div>

            {/* DNR Status */}
            <div className={`p-4 rounded-xl border flex items-center justify-between ${
              profile.dnr_order 
                ? 'bg-amber-950/30 border-amber-500/40 text-amber-300' 
                : 'bg-slate-950/60 border-slate-800 text-slate-200'
            }`}>
              <div>
                <span className="text-[10px] opacity-75 uppercase font-semibold">Resuscitation Order</span>
                <p className="text-xl font-bold mt-1">
                  {profile.dnr_order ? 'DNR (Do Not Resuscitate)' : 'Full Resuscitation'}
                </p>
                <span className="text-[10px] opacity-75">
                  {profile.dnr_instructions || 'Standard Protocol'}
                </span>
              </div>
              <ShieldAlert className="w-6 h-6 shrink-0 opacity-80" />
            </div>

            {/* Primary Physician */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Attending Physician</span>
              <p className="text-xs font-bold text-white line-clamp-1">{profile.primary_physician_name}</p>
              <div className="flex items-center space-x-1 text-[11px] text-teal-400">
                <Phone className="w-3 h-3" />
                <span>{profile.primary_physician_phone}</span>
              </div>
            </div>

            {/* Hospital Preference */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Hospital Preference</span>
              <p className="text-xs font-bold text-white line-clamp-1">{profile.hospital_preference}</p>
              <div className="flex items-center space-x-1 text-[11px] text-indigo-400">
                <Hospital className="w-3 h-3" />
                <span>Designated Facility</span>
              </div>
            </div>
          </div>

          {/* Allergies & Conditions Badges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Allergies */}
            <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-rose-400">
                <AlertTriangle className="w-4 h-4" />
                <span>Documented Allergies ({profile.allergies?.length || 0})</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {profile.allergies && profile.allergies.length > 0 ? (
                  profile.allergies.map((a, i) => (
                    <span key={i} className="px-2.5 py-1 bg-rose-950/60 border border-rose-500/40 text-rose-300 rounded-lg text-xs font-semibold">
                      {a}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">No known allergies recorded (NKDA)</span>
                )}
              </div>
            </div>

            {/* Chronic Diagnoses */}
            <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-400">
                <FileHeart className="w-4 h-4" />
                <span>Chronic Diagnoses ({profile.chronic_conditions?.length || 0})</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {profile.chronic_conditions && profile.chronic_conditions.length > 0 ? (
                  profile.chronic_conditions.map((c, i) => (
                    <span key={i} className="px-2.5 py-1 bg-amber-950/60 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-semibold">
                      {c}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">No chronic conditions listed</span>
                )}
              </div>
            </div>
          </div>

          {/* Current Medications Table */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-teal-400">
                <Pill className="w-4 h-4" />
                <span>Active Prescriptions & Dosages ({profile.medications?.length || 0})</span>
              </div>
              <span className="text-[11px] text-slate-500">Self-reported by caregiver / patient</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                    <th className="pb-2">Medication</th>
                    <th className="pb-2">Dosage</th>
                    <th className="pb-2">Frequency</th>
                    <th className="pb-2">Directives</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {profile.medications && profile.medications.length > 0 ? (
                    profile.medications.map((m, i) => (
                      <tr key={i} className="hover:bg-slate-900/50">
                        <td className="py-2.5 font-bold text-white">{m.name}</td>
                        <td className="py-2.5 text-teal-300 font-mono">{m.dosage}</td>
                        <td className="py-2.5 text-slate-300">{m.frequency}</td>
                        <td className="py-2.5 text-slate-400">{m.instructions || '--'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-500">No active medications registered.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Printable Emergency Medical Pass Modal */}
      {isPassModalOpen && passData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-white text-slate-900 w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl relative border-4 border-rose-600">
            <button
              onClick={() => setIsPassModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Pass Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white font-extrabold text-sm">
                  +
                </div>
                <div>
                  <h3 className="text-base font-extrabold tracking-tight uppercase text-rose-700">
                    Emergency Medical Passport
                  </h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    ResQCare AI Digital Health Pass
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black text-rose-600 font-mono">{passData.blood_group}</span>
                <span className="text-[9px] block text-slate-500 uppercase">Blood Type</span>
              </div>
            </div>

            {/* Patient Demographics */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Patient Name:</span>
                <p className="font-bold text-slate-900 text-sm">{passData.full_name}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Residence / Room:</span>
                <p className="font-semibold text-slate-800">{passData.room_or_residence}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Date of Birth:</span>
                <p className="font-semibold text-slate-800">{passData.date_of_birth || 'N/A'}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">DNR Directive:</span>
                <p className={`font-bold ${passData.dnr_order ? 'text-amber-700' : 'text-slate-800'}`}>
                  {passData.dnr_order ? 'DNR - Do Not Resuscitate' : 'Full Protocol'}
                </p>
              </div>
            </div>

            {/* Critical Allergies Box (High Contrast) */}
            <div className="bg-rose-50 border-2 border-rose-400 p-3 rounded-xl space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-800 flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>CRITICAL ALLERGIES & SENSITIVITIES</span>
              </span>
              <div className="flex flex-wrap gap-1 pt-1">
                {passData.allergies.map((a, i) => (
                  <span key={i} className="px-2 py-0.5 bg-rose-600 text-white rounded font-bold text-xs">
                    {a}
                  </span>
                ))}
              </div>
            </div>

            {/* Chronic Conditions */}
            <div className="space-y-1 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Chronic Diagnoses:</span>
              <p className="font-semibold text-slate-800">{passData.chronic_conditions.join(', ') || 'None registered'}</p>
            </div>

            {/* Emergency Contacts */}
            <div className="space-y-1 text-xs border-t border-slate-200 pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Designated Emergency Contacts:</span>
              <div className="space-y-1">
                {passData.emergency_contacts.map((c) => (
                  <div key={c.id} className="flex justify-between font-semibold text-slate-800">
                    <span>{c.name} ({c.relationship})</span>
                    <span className="font-mono text-rose-700">{c.phone_number}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Notice */}
            <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[9px] text-slate-500">
              <span>Physician: {passData.primary_physician_name} ({passData.primary_physician_phone})</span>
              <button
                onClick={() => window.print()}
                className="px-3 py-1 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 text-[10px]"
              >
                Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
