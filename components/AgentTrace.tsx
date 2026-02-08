
import React, { useState } from 'react';
import { AgentStep } from '../types';
import { CheckCircle2, Loader2, AlertCircle, Clock, Search, Cpu, Zap, Activity, TrendingUp, Users, Terminal, ChevronDown, ChevronUp, Info, ListFilter, ExternalLink, Hash, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  steps: AgentStep[];
}

const AgentTrace: React.FC<Props> = ({ steps }) => {
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);

  const getIcon = (agent: string) => {
    switch (agent) {
      case 'Parser': return Search;
      case 'Verifier': return Zap;
      case 'Strategist': return Activity;
      case 'Matcher': return Users;
      case 'Predictor': return TrendingUp;
      default: return Cpu;
    }
  };

  return (
    <div className="glass-card rounded-[2.5rem] p-6 sm:p-10 h-full flex flex-col relative overflow-hidden transition-colors duration-300 shadow-2xl">
      {/* Decorative scanline for reasoning feel */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent animate-scanline pointer-events-none"></div>

      <div className="flex items-center justify-between mb-12 flex-shrink-0">
        <div className="min-w-0">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] mb-2 flex items-center gap-2">
            <Database className="w-3 h-3" /> Federated Logic Trace
          </h3>
          <p className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest truncate">Chain ID: VIP-LOGIC-TX-0922</p>
        </div>
        <div className="px-4 py-2 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 text-[10px] font-black text-emerald-400 tracking-widest uppercase flex-shrink-0 flex items-center gap-2">
          <Hash className="w-3 h-3" /> {steps.length}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar min-h-0">
        <div className="relative border-l-2 border-white/10 ml-6 pl-8 sm:pl-12 space-y-12 pb-10">
          {steps.map((step, idx) => {
            const Icon = getIcon(step.agentName);
            const isActive = step.status === 'active';
            const isExpanded = expandedStepId === step.id;

            return (
              <motion.div 
                key={step.id} 
                initial={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                transition={{ delay: idx * 0.08 }}
                className="relative"
              >
                <div className={`absolute -left-[48px] sm:-left-[68px] top-0 p-3.5 rounded-2xl border transition-all duration-500 shadow-2xl z-10 ${
                  isActive 
                    ? 'bg-emerald-500 border-emerald-400 text-emerald-950 scale-125 shadow-emerald-500/40 ring-8 ring-emerald-500/5' 
                    : 'bg-[var(--sidebar-bg)] border-white/10 text-slate-500'
                }`}>
                  {step.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {step.status === 'active' && <Loader2 className="w-4 h-4 animate-spin" />}
                  {step.status === 'error' && <AlertCircle className="w-4 h-4 text-rose-500" />}
                  {step.status === 'pending' && <Clock className="w-4 h-4" />}
                </div>
                
                <div 
                  className={`space-y-3 cursor-pointer p-5 rounded-[2rem] transition-all duration-300 border ${
                    isExpanded 
                      ? 'bg-emerald-500/[0.03] border-emerald-500/20 shadow-2xl' 
                      : 'hover:bg-white/[0.04] border-transparent'
                  }`}
                  onClick={() => setExpandedStepId(isExpanded ? null : step.id)}
                >
                  <div className="flex justify-between items-center gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-xl ${isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-slate-500'}`}>
                        <Icon className="w-4 h-4 flex-shrink-0" />
                      </div>
                      <div className="min-w-0">
                        <h4 className={`text-xs font-black tracking-tight uppercase truncate ${isActive ? 'text-emerald-400' : 'text-[var(--text-main)]'}`}>
                          {step.agentName}
                        </h4>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{step.action}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className="text-[9px] font-mono font-bold text-slate-500 tracking-tighter hidden sm:block">
                        TXN_{step.id.slice(0, 4).toUpperCase()}
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </div>
                  </div>

                  {step.description && !isExpanded && (
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed break-words line-clamp-1 opacity-80 pl-11">
                      {step.description}
                    </p>
                  )}

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden space-y-6 pt-5 mt-5 border-t border-white/10"
                      >
                        {step.description && (
                          <div className="space-y-2">
                             <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Inference Narrative</p>
                             <p className="text-[11px] text-[var(--text-muted)] font-medium leading-relaxed break-words bg-black/5 p-4 rounded-2xl border border-white/[0.02]">
                                {step.description}
                             </p>
                          </div>
                        )}

                        {step.metrics && (
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { label: 'Compute', val: `${step.metrics.executionTime}ms`, icon: Clock },
                              { label: 'Prob', val: `${(step.metrics.successRate * 100).toFixed(0)}%`, icon: CheckCircle2 },
                              { label: 'Entropy', val: `${(step.metrics.hallucinationScore * 100).toFixed(1)}%`, icon: Info }
                            ].map((m, i) => (
                              <div key={i} className="p-4 bg-black/5 rounded-2xl border border-white/[0.02] text-center sm:text-left shadow-inner">
                                <p className="text-[7px] font-black text-slate-500 uppercase mb-2 truncate tracking-widest">{m.label}</p>
                                <p className="text-xs font-black text-[var(--text-main)] truncate">{m.val}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {step.detailedLogs && (
                          <div className="space-y-3">
                            <p className="text-[8px] font-black text-slate-500 uppercase flex items-center gap-2 tracking-widest">
                              <ListFilter className="w-3 h-3" /> Verification Stack
                            </p>
                            <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                              {step.detailedLogs.map((log, i) => (
                                <div key={i} className="text-[10px] text-[var(--text-muted)] font-mono bg-black/5 p-3 rounded-xl border border-white/[0.01] break-words flex gap-3">
                                  <span className="text-emerald-500/50 font-black">L_{i+1}</span>
                                  <span>{log}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {step.intermediateOutput && (
                          <div className="space-y-3">
                            <p className="text-[8px] font-black text-slate-500 uppercase flex items-center gap-2 tracking-widest">
                              <Terminal className="w-3 h-3" /> Node State Matrix
                            </p>
                            <pre className="text-[10px] text-emerald-500/70 font-mono bg-black/5 p-5 rounded-[1.5rem] overflow-x-auto border border-emerald-500/10 max-h-64 custom-scrollbar whitespace-pre-wrap break-words shadow-inner">
                              {JSON.stringify(step.intermediateOutput, null, 2)}
                            </pre>
                          </div>
                        )}

                        {step.citation && (
                          <div className="text-[9px] bg-black/5 px-5 py-4 rounded-2xl border border-white/5 font-mono text-slate-500 flex items-center justify-between gap-3 group/cit">
                            <div className="flex items-center gap-3 truncate">
                              <Terminal className="w-3 h-3 text-emerald-500/40" />
                              <span className="truncate">{step.citation}</span>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 text-slate-400 group-hover/cit:text-emerald-500 transition-colors" />
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
          {steps.length === 0 && (
             <div className="flex flex-col items-center justify-center py-32 text-center opacity-30 gap-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-slate-500/10 blur-3xl rounded-full"></div>
                  <div className="relative p-8 bg-white/5 rounded-full border border-white/10 animate-pulse">
                    <Terminal className="w-14 h-14 text-slate-600" />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Context Buffers Initialized</p>
                  <p className="text-[9px] text-slate-500 mt-3 font-bold uppercase tracking-widest">Listening for Operator Input Sequence...</p>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentTrace;
