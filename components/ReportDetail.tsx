
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, MapPin, Calendar, Activity, 
  ShieldCheck, AlertTriangle, Hammer, 
  Stethoscope, Box, Clipboard, Info, 
  CheckCircle2, AlertCircle, Clock
} from 'lucide-react';
import { HospitalReport } from '../types';

interface Props {
  report: HospitalReport | null;
  onClose: () => void;
  onIntervention?: (report: HospitalReport) => void;
}

const ReportDetail: React.FC<Props> = ({ report, onClose, onIntervention }) => {
  if (!report) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Operational': return 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5';
      case 'Limited': return 'text-amber-500 border-amber-500/20 bg-amber-500/5';
      case 'Offline': return 'text-rose-500 border-rose-500/20 bg-rose-500/5';
      default: return 'text-slate-500 border-white/10 bg-white/5';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Operational': return <CheckCircle2 className="w-3 h-3" />;
      case 'Limited': return <Clock className="w-3 h-3" />;
      case 'Offline': return <AlertCircle className="w-3 h-3" />;
      default: return <Info className="w-3 h-3" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex justify-end pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
        />
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-2xl bg-[var(--sidebar-bg)] border-l border-white/10 shadow-4xl h-full flex flex-col pointer-events-auto overflow-hidden"
        >
          {/* Header */}
          <div className="p-8 sm:p-12 border-b border-white/5 bg-white/[0.01]">
            <button 
              onClick={onClose}
              className="absolute top-8 right-8 p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-500 hover:text-[var(--text-main)] transition-all group"
            >
              <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            </button>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Verified Entity</span>
                <h3 className="text-3xl font-black tracking-tighter text-[var(--text-main)]">{report.facilityName}</h3>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 text-sm font-bold text-slate-500">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500/50" />
                {report.region}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-500/50" />
                {report.reportDate}
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500/50" />
                Confidence: {((report.extractedData?.confidence || 0) * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 sm:p-12 space-y-12 pb-48">
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Clipboard className="w-4 h-4 text-emerald-400" />
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Raw Report Transcript</h4>
              </div>
              <div className="p-6 bg-black/5 border border-white/5 rounded-3xl text-[var(--text-muted)] text-sm leading-relaxed italic">
                "{report.unstructuredText}"
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-6">
                <Stethoscope className="w-4 h-4 text-blue-500" />
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Clinical Specialties</h4>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {report.extractedData?.specialties.map(spec => (
                  <span key={spec} className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-xl text-xs font-bold uppercase tracking-tight">
                    {spec}
                  </span>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-6">
                <Box className="w-4 h-4 text-amber-500" />
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Inventory & Capability Matrix</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {report.extractedData?.equipmentList.map(item => (
                  <div key={item.name} className="p-5 bg-black/5 border border-white/5 rounded-2xl flex items-center justify-between group hover:bg-black/10 transition-all">
                    <span className="text-xs font-bold text-[var(--text-muted)] group-hover:text-[var(--text-main)]">{item.name}</span>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-tighter ${getStatusColor(item.status)}`}>
                      {getStatusIcon(item.status)}
                      {item.status}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-6">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Infrastructure Gaps Detected</h4>
              </div>
              <div className="space-y-3">
                {report.extractedData?.gaps.map(gap => (
                  <div key={gap} className="p-5 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex items-center gap-4 group">
                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-xs font-bold text-rose-500 uppercase tracking-tight">{gap}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Footer Action */}
          <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-[var(--sidebar-bg)] via-[var(--sidebar-bg)] to-transparent border-t border-white/5 pointer-events-auto">
            <button 
              onClick={() => onIntervention?.(report)}
              className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95"
            >
              <Hammer className="w-4 h-4" />
              Initialize Intervention Protocol
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReportDetail;
