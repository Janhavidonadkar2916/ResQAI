import { Radio } from 'lucide-react';
import { SensorPacket } from '../../types';

interface Kinematic3DPlotProps {
  packet: SensorPacket | null;
}

export function Kinematic3DPlot({ packet }: Kinematic3DPlotProps) {
  const ax = packet?.accel_x ?? 0.0;
  const ay = packet?.accel_y ?? 1.0;
  const az = packet?.accel_z ?? 0.0;

  const resultantG = Math.sqrt(ax * ax + ay * ay + az * az);
  const isImpact = resultantG >= 3.0;
  const isHorizontal = Math.abs(ay) < 0.35 && (Math.abs(ax) > 0.75 || Math.abs(az) > 0.75);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Radio className="w-5 h-5 text-indigo-400" />
          <h4 className="text-sm font-bold text-white tracking-tight">Kinematics & Fall Vector Analysis</h4>
        </div>
        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
          isImpact 
            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse' 
            : isHorizontal 
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        }`}>
          {isImpact ? 'IMPACT SPIKE (>3.0g)' : isHorizontal ? 'RECUMBENT / HORIZONTAL' : 'UPRIGHT POSTURE'}
        </span>
      </div>

      {/* Vector Magnitude Gauge */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Resultant Acceleration Vector (|A|)
          </span>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className={`text-2xl font-extrabold ${isImpact ? 'text-rose-400' : 'text-white'}`}>
              {resultantG.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400">g</span>
          </div>
          <span className="text-[10px] text-slate-500">Normal 1g = Standard Earth Gravity</span>
        </div>

        <div className="w-32 bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-800">
          <div 
            className={`h-full transition-all duration-300 ${
              isImpact ? 'bg-rose-500' : resultantG > 1.5 ? 'bg-amber-500' : 'bg-teal-400'
            }`}
            style={{ width: `${Math.min(100, (resultantG / 4.0) * 100)}%` }}
          />
        </div>
      </div>

      {/* Individual 3-Axis Gauges */}
      <div className="grid grid-cols-3 gap-3 text-xs">
        <div className="bg-slate-950/40 border border-slate-800/80 p-3 rounded-xl text-center space-y-1">
          <span className="text-[10px] text-slate-500 uppercase font-semibold">Lateral Axis (X)</span>
          <p className="font-mono text-base font-bold text-sky-400">{ax.toFixed(2)}g</p>
        </div>
        <div className="bg-slate-950/40 border border-slate-800/80 p-3 rounded-xl text-center space-y-1">
          <span className="text-[10px] text-slate-500 uppercase font-semibold">Vertical Gravity (Y)</span>
          <p className="font-mono text-base font-bold text-emerald-400">{ay.toFixed(2)}g</p>
        </div>
        <div className="bg-slate-950/40 border border-slate-800/80 p-3 rounded-xl text-center space-y-1">
          <span className="text-[10px] text-slate-500 uppercase font-semibold">Anterior Axis (Z)</span>
          <p className="font-mono text-base font-bold text-indigo-400">{az.toFixed(2)}g</p>
        </div>
      </div>
    </div>
  );
}
