import { useState, useEffect } from 'react';
import { ShieldCheck, Filter, RefreshCw } from 'lucide-react';
import { auditApi, AuditLogItem } from '../../api/auditApi';

export function AuditTrailViewer() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const actionParam = filterAction === 'ALL' ? undefined : filterAction;
      const data = await auditApi.listLogs(50, undefined, actionParam);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterAction]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-teal-400" />
            <h3 className="text-base font-bold text-white">Tamper-Evident Security & Access Audit Trail</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Immutable log of all sensitive medical record views, profile updates, and incident resolutions
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Action Filter */}
          <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Filter:</span>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="bg-transparent text-teal-300 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">All Operations</option>
              <option value="VIEW_MEDICAL_PROFILE" className="bg-slate-900">Record Views</option>
              <option value="UPDATE_MEDICAL_PROFILE" className="bg-slate-900">Profile Updates</option>
              <option value="EXPORT_EMERGENCY_PASS" className="bg-slate-900">Pass Exports</option>
            </select>
          </div>

          <button
            onClick={fetchLogs}
            className="flex items-center space-x-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-400' : 'text-slate-400'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase">
              <th className="pb-3">Timestamp (UTC)</th>
              <th className="pb-3">Action Type</th>
              <th className="pb-3">Actor / Principal</th>
              <th className="pb-3">IP Address</th>
              <th className="pb-3">Resource Target</th>
              <th className="pb-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                  No audit log entries found for this filter.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-950/60 transition-colors">
                  <td className="py-3 text-slate-400 text-[11px]">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.action_type.includes('UPDATE')
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : log.action_type.includes('EXPORT')
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-teal-500/10 text-teal-300 border border-teal-500/20'
                    }`}>
                      {log.action_type}
                    </span>
                  </td>
                  <td className="py-3 text-slate-300">
                    {log.actor_email || 'caregiver@resqcare.ai'}
                  </td>
                  <td className="py-3 text-slate-500">{log.ip_address || '127.0.0.1'}</td>
                  <td className="py-3 text-slate-400 text-[10px]">
                    {log.resource_type}:{log.resource_id.slice(0, 8)}...
                  </td>
                  <td className="py-3 text-slate-400 text-[11px] font-sans">
                    {log.details ? JSON.stringify(log.details) : '--'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
