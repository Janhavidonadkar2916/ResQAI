import { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Legend
} from 'recharts';
import { SensorPacket } from '../../types';
import { Activity, Heart, Wind, Thermometer, Radio } from 'lucide-react';

interface VitalsTrendChartProps {
  data: SensorPacket[];
  isLoading?: boolean;
}

export function VitalsTrendChart({ data, isLoading }: VitalsTrendChartProps) {
  const [activeMetric, setActiveMetric] = useState<'all' | 'hr' | 'spo2' | 'temp' | 'accel'>('all');

  // Format data for Recharts
  const chartData = data.map((d, index) => {
    const timeStr = d.recorded_at 
      ? new Date(d.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : `T-${index}`;
    return {
      time: timeStr,
      heart_rate: d.heart_rate_bpm,
      spo2: d.spo2_percent,
      temperature: d.temperature_c,
      accel_x: d.accel_x,
      accel_y: d.accel_y,
      accel_z: d.accel_z,
      activity: d.activity_label,
      quality: d.signal_quality
    };
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
      {/* Chart Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-teal-400" />
            <h3 className="text-base font-bold text-white">Historical Telemetry Trends & Waveforms</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time downsampled physiological signals and 3-axis motion kinematics
          </p>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveMetric('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeMetric === 'all'
                ? 'bg-slate-800 text-teal-300 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Combined View
          </button>
          <button
            onClick={() => setActiveMetric('hr')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeMetric === 'hr'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span>Heart Rate</span>
          </button>
          <button
            onClick={() => setActiveMetric('spo2')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeMetric === 'spo2'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wind className="w-3.5 h-3.5 text-teal-400" />
            <span>SpO2</span>
          </button>
          <button
            onClick={() => setActiveMetric('temp')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeMetric === 'temp'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5 text-amber-400" />
            <span>Temperature</span>
          </button>
          <button
            onClick={() => setActiveMetric('accel')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeMetric === 'accel'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-indigo-400" />
            <span>Accelerometer</span>
          </button>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="h-72 w-full pt-2">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500">
            Loading telemetry streams...
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500">
            No readings recorded yet. Use the Virtual Simulator to generate telemetry.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis 
                dataKey="time" 
                stroke="#64748B" 
                fontSize={11} 
                tickLine={false} 
              />
              <YAxis 
                stroke="#64748B" 
                fontSize={11} 
                domain={['auto', 'auto']}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0F172A', 
                  borderColor: '#334155', 
                  borderRadius: '0.75rem', 
                  color: '#F8FAFC',
                  fontSize: '12px'
                }} 
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />

              {/* Heart Rate Line */}
              {(activeMetric === 'all' || activeMetric === 'hr') && (
                <>
                  <ReferenceLine y={100} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'Tachycardia (100)', fill: '#EF4444', fontSize: 10 }} />
                  <ReferenceLine y={60} stroke="#F59E0B" strokeDasharray="3 3" label={{ value: 'Bradycardia (60)', fill: '#F59E0B', fontSize: 10 }} />
                  <Line
                    type="monotone"
                    dataKey="heart_rate"
                    name="Heart Rate (BPM)"
                    stroke="#F43F5E"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5 }}
                    isAnimationActive={false}
                  />
                </>
              )}

              {/* SpO2 Line */}
              {(activeMetric === 'all' || activeMetric === 'spo2') && (
                <>
                  <ReferenceLine y={95} stroke="#0D9488" strokeDasharray="3 3" label={{ value: 'Hypoxia Threshold (95%)', fill: '#0D9488', fontSize: 10 }} />
                  <Line
                    type="monotone"
                    dataKey="spo2"
                    name="SpO2 (%)"
                    stroke="#14B8A6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5 }}
                    isAnimationActive={false}
                  />
                </>
              )}

              {/* Temperature Line */}
              {(activeMetric === 'all' || activeMetric === 'temp') && (
                <Line
                  type="monotone"
                  dataKey="temperature"
                  name="Temperature (°C)"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                />
              )}

              {/* Accelerometer Kinematics Lines */}
              {(activeMetric === 'all' || activeMetric === 'accel') && (
                <>
                  <ReferenceLine y={3.2} stroke="#DC2626" strokeDasharray="4 4" label={{ value: 'Fall Impact Threshold (3.2g)', fill: '#DC2626', fontSize: 10 }} />
                  <Line
                    type="monotone"
                    dataKey="accel_x"
                    name="Accel X (g)"
                    stroke="#38BDF8"
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="accel_y"
                    name="Accel Y (g)"
                    stroke="#10B981"
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="accel_z"
                    name="Accel Z (g)"
                    stroke="#818CF8"
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
