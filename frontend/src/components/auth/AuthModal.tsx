import { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck } from 'lucide-react';
import { fetchApi } from '../../api/client';
import { User as UserType } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType | null;
  onLoginSuccess: (user: UserType, token: string) => void;
  onLogout: () => void;
}

export function AuthModal({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout
}: AuthModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('caregiver@resqcare.ai');
  const [password, setPassword] = useState('CaregiverSecure2026!');
  const [fullName, setFullName] = useState('Dr. Sarah Jenkins, RN');
  const [role, setRole] = useState<'CAREGIVER' | 'CLINICIAN' | 'ADMIN'>('CAREGIVER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isRegister) {
        const res = await fetchApi<{ access_token: string; user: UserType }>('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ email, password, full_name: fullName, role })
        });
        localStorage.setItem('resqcare_token', res.access_token);
        onLoginSuccess(res.user, res.access_token);
        onClose();
      } else {
        const res = await fetchApi<{ access_token: string; user: UserType }>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
        localStorage.setItem('resqcare_token', res.access_token);
        onLoginSuccess(res.user, res.access_token);
        onClose();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {currentUser ? 'Caregiver Session & Identity' : isRegister ? 'Register Caregiver Account' : 'Caregiver Portal Login'}
            </h3>
            <p className="text-xs text-slate-400">Role-Based Access Control (RBAC) System</p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-950/60 border border-rose-500/30 text-rose-300 px-3 py-2 rounded-xl text-xs">
            {error}
          </div>
        )}

        {currentUser ? (
          <div className="space-y-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Signed In As:</span>
                <span className="text-white font-semibold">{currentUser.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="text-slate-200">{currentUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Active Role:</span>
                <span className="bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded font-mono font-bold">
                  {currentUser.role}
                </span>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={onLogout}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                Sign Out
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {isRegister && (
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-teal-500"
                    placeholder="Dr. Sarah Jenkins, RN"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-teal-500"
                  placeholder="caregiver@resqcare.ai"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-teal-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Role Classification</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'CAREGIVER' | 'CLINICIAN' | 'ADMIN')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="CAREGIVER">Caregiver (Monitoring & Response)</option>
                  <option value="CLINICIAN">Clinician / Attending Physician</option>
                  <option value="ADMIN">System Administrator</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-500/20 mt-2"
            >
              {loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Authenticate & Sign In'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className="text-xs text-teal-400 hover:underline"
              >
                {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register here"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

