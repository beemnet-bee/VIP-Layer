
import React from 'react';
import { motion } from 'framer-motion';

interface ChartProps {
  data: { label: string; value: number; color: string }[];
  title: string;
}

export const CapabilityBarChart: React.FC<ChartProps> = ({ data, title }) => {
  return (
    <div className="w-full h-full flex flex-col">
      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">{title}</h4>
      <div className="flex-1 flex items-end justify-between gap-2 px-2">
        {data.map((item, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
            <div className="relative w-full flex flex-col justify-end h-32 bg-white/5 rounded-t-lg overflow-hidden">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${item.value}%` }}
                transition={{ duration: 1.5, delay: i * 0.1, ease: "circOut" }}
                className={`w-full bg-gradient-to-t ${item.color} relative`}
              >
                <div className="absolute top-0 left-0 right-0 h-px bg-white/40 shadow-[0_0_10px_white]" />
              </motion.div>
            </div>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter text-center h-4 overflow-hidden">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const MissionPieChart: React.FC<ChartProps> = ({ data, title }) => {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  let currentAngle = 0;

  return (
    <div className="w-full h-full flex flex-col">
      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">{title}</h4>
      <div className="flex-1 flex items-center justify-center relative">
        <svg viewBox="0 0 100 100" className="w-32 h-32 sm:w-40 sm:h-40 transform -rotate-90">
          {data.map((item, i) => {
            const percentage = (item.value / total) * 100;
            const strokeDasharray = `${percentage} ${100 - percentage}`;
            const strokeDashoffset = -currentAngle;
            currentAngle += percentage;

            return (
              <motion.circle
                key={i}
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke={item.color.includes('emerald') ? '#10b981' : item.color.includes('rose') ? '#f43f5e' : '#3b82f6'}
                strokeWidth="12"
                strokeDasharray={strokeDasharray}
                strokeDashoffset="100"
                animate={{ strokeDashoffset }}
                transition={{ duration: 2, delay: i * 0.2, ease: "easeInOut" }}
                className="opacity-80 hover:opacity-100 transition-opacity cursor-crosshair"
                style={{ strokeDasharray: "0 100" }} // Initial state
                whileHover={{ strokeWidth: 16 }}
              />
            );
          })}
          <circle cx="50" cy="50" r="28" className="fill-[var(--bg-deep)]" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-black text-[var(--text-main)] tracking-tighter">{total}</span>
          <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Nodes</span>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${item.color.includes('emerald') ? 'bg-emerald-500' : item.color.includes('rose') ? 'bg-rose-500' : 'bg-blue-500'}`} />
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tight">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
