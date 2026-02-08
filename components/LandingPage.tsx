
import React, { useState, useEffect, useRef } from 'react';
import { Activity, ShieldCheck, Zap, Cpu, Globe, ArrowRight, Loader2, Database, Lock, Server, Terminal, LogIn, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onLaunch: () => void;
  onSignIn: () => void;
  onGetStarted: () => void;
  user: any;
}

const LandingPage: React.FC<Props> = ({ onLaunch, onSignIn, onGetStarted, user }) => {
  const [loadingStep, setLoadingStep] = useState(0);
  const [isLaunching, setIsLaunching] = useState(false);
  const [showClearance, setShowClearance] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const steps = [
    { label: 'Initializing Fabric', icon: Cpu, desc: 'Allocating Agent VRAM' },
    { label: 'Geo Telemetry', icon: Globe, desc: 'Syncing SAT-nodes' },
    { label: 'Verification', icon: Lock, desc: 'RSA Key Validation' },
    { label: 'Agentic Logic', icon: Zap, desc: 'Warm-up Complete' }
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: { x: number; y: number; vx: number; vy: number }[] = [];
    const particleCount = 40;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3
        });
      }
    };

    window.addEventListener('resize', resize);
    resize();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)';
      ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });
      requestAnimationFrame(animate);
    };

    animate();
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    if (loadingStep < steps.length) {
      const timer = setTimeout(() => setLoadingStep(prev => prev + 1), 800);
      return () => clearTimeout(timer);
    } else {
      setTimeout(() => setShowClearance(true), 400);
    }
  }, [loadingStep]);

  const handleLaunch = () => {
    setIsLaunching(true);
    setTimeout(onLaunch, 1200);
  };

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, y: -50 }}
      className="fixed inset-0 z-[100] bg-[#06080a] overflow-hidden font-['Plus_Jakarta_Sans']"
    >
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-40" />
      
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/20 blur-[180px] rounded-full pointer-events-none"
      />

      <div className="relative z-10 w-full h-full overflow-y-auto custom-scrollbar">
        <div className="max-w-5xl mx-auto px-6 py-12 sm:py-24 flex flex-col items-center justify-start min-h-full">
          
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-col items-center gap-6 mb-8 sm:mb-12"
          >
            <div className="relative">
               <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
               <motion.div className="relative p-6 bg-emerald-500/10 rounded-[2.5rem] border border-emerald-500/20 shadow-3xl">
                 <Activity className="w-12 h-12 sm:w-16 sm:h-16 text-emerald-400" />
               </motion.div>
            </div>
            <div className="text-center">
              <motion.h1 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-4xl sm:text-7xl font-black tracking-tighter text-white mb-2"
              >
                VIP <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">LAYER</span>
              </motion.h1>
              <p className="text-slate-500 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.5em]">Virtue Intelligence Protocol</p>
            </div>
          </motion.div>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-base sm:text-xl text-slate-400 font-medium mb-12 sm:mb-16 max-w-2xl text-center leading-relaxed px-4"
          >
            Mapping expertise, detecting medical deserts, and <br className="hidden sm:block"/> 
            optimizing life-saving resources through agentic synthesis.
          </motion.p>

          <AnimatePresence>
            {showClearance && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-8 w-full max-w-lg mb-16"
              >
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full px-4">
                  {!user ? (
                    <>
                      <button 
                        onClick={onSignIn}
                        className="flex-1 flex items-center justify-center gap-3 px-8 py-5 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-white/10 transition-all active:scale-95 w-full"
                      >
                        <LogIn className="w-4 h-4 text-emerald-400" />
                        Sign In
                      </button>
                      <button 
                        onClick={onGetStarted}
                        className="flex-1 flex items-center justify-center gap-3 px-8 py-5 bg-emerald-500 text-emerald-950 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/10 active:scale-95 w-full"
                      >
                        <UserPlus className="w-4 h-4" />
                        Get Started
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={handleLaunch}
                      disabled={isLaunching}
                      className="group relative flex items-center justify-center gap-6 px-12 py-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-emerald-500 hover:text-emerald-950 transition-all duration-300 active:scale-95 overflow-hidden w-full"
                    >
                      <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none"></div>
                      {isLaunching ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Verifying Session...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 fill-current" />
                          Resume Protocol: {user.name || 'Operator'}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-4 text-[8px] sm:text-[9px] font-black text-slate-700 uppercase tracking-[0.3em] whitespace-nowrap bg-[#06080a] px-5 py-2.5 rounded-full border border-white/5 mt-auto mb-8">
            <Terminal className="w-3 h-3 text-emerald-500" />
            Node: ACCRA-SOUTH-01
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Status: Active
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LandingPage;
