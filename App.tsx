
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Activity, ShieldAlert, FileText, MapPin, Search, Plus, 
  ChevronRight, Zap, LayoutDashboard, Map as MapIcon, 
  Database, ClipboardList, TrendingUp, Users, Cpu, Loader2,
  AlertTriangle, CheckCircle2, Terminal, MessageSquare, ExternalLink, Info, RefreshCw, X, Settings, Bell, ChevronDown, Filter, Calendar, Clock, ArrowUpRight, Globe, Box, BarChart3, Satellite, Navigation, Sun, Moon, LogIn, UserPlus, Mail, Lock, User, LogOut, Wifi, WifiOff, Menu, Code, Layers, Share2, Sparkles, Wand2
} from 'lucide-react';
import { GHANA_HOSPITALS, DESERT_REGIONS } from './data/mockData';
import { HospitalReport, AgentStep, AgentState, ViewState, AuditLog, MedicalDesert } from './types';
import RegionalMap from './components/RegionalMap';
import AgentTrace from './components/AgentTrace';
import LandingPage from './components/LandingPage';
import ReportDetail from './components/ReportDetail';
import AIChatBot from './components/AIChatBot';
import MarkdownRenderer from './components/MarkdownRenderer';
import { motion, AnimatePresence } from 'framer-motion';
import { runDiscoveryAgent, runParserAgent, runVerifierAgent, runStrategistAgent, runQueryAgent, runMatcherAgent, runPredictorAgent } from './services/geminiService';

const MOCK_AUDIT: AuditLog[] = [
  { id: '1', timestamp: '10:45 AM', event: 'New Report Ingested: Sefwi-Wiawso Municipal', user: 'Admin_User', status: 'success' },
  { id: '2', timestamp: '11:12 AM', event: 'Anomaly Detected in Oxygen Capability - Tamale', user: 'Verifier_Agent', status: 'warning' },
  { id: '3', timestamp: '12:01 PM', event: 'Regional Plan v4.2 Protocol Generated', user: 'Strategist_Agent', status: 'info' },
  { id: '4', timestamp: '01:15 PM', event: 'Matcher Optimization: 3 Surgeons deployed to Northern Region', user: 'Matcher_Agent', status: 'success' },
  { id: '5', timestamp: '02:30 PM', event: 'Predictive Risk Shift: Western North severity increased', user: 'Predictor_Agent', status: 'warning' },
  { id: '6', timestamp: '03:45 PM', event: 'Semantic Verification: Korle-Bu oncology claims validated', user: 'Verifier_Agent', status: 'success' },
];

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const App: React.FC = () => {
  const [hasLaunched, setHasLaunched] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('theme') as any) || 'dark');
  const [reports, setReports] = useState<HospitalReport[]>(GHANA_HOSPITALS);
  const [deserts, setDeserts] = useState<MedicalDesert[]>(DESERT_REGIONS);
  const [viewState, setViewState] = useState<ViewState>('dashboard');
  const [isThinking, setIsThinking] = useState(false);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [plan, setPlan] = useState<string | null>(null);
  const [groundingLinks, setGroundingLinks] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [isLiveMode, setIsLiveMode] = useState(true); // Default to live
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | undefined>(undefined);
  const [selectedDesert, setSelectedDesert] = useState<MedicalDesert | null>(null);
  const [selectedReport, setSelectedReport] = useState<HospitalReport | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [user, setUser] = useState<any>(() => JSON.parse(localStorage.getItem('vip_user') || 'null'));
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isGetStartedOpen, setIsGetStartedOpen] = useState(false);
  
  const [kbSearch, setKbSearch] = useState('');
  const [kbFilterRegion] = useState('All');
  const [radiusFilter] = useState<number | null>(null);
  const [auditFilter] = useState<'all' | 'success' | 'warning' | 'info'>('all');

  const mainScrollRef = useRef<HTMLDivElement>(null);
  const planContainerRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [viewState]);

  useEffect(() => {
    if (plan && planContainerRef.current) {
      planContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [plan]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("Geolocation failed", err)
      );
    }
  }, []);

  const addStep = (step: Omit<AgentStep, 'id' | 'timestamp'>) => {
    const newStep = {
      ...step,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString()
    };
    setSteps(prev => [...prev, newStep]);
  };

  const updateLastStep = (updates: Partial<AgentStep>) => {
    setSteps(prev => {
      const newSteps = [...prev];
      if (newSteps.length > 0) {
        newSteps[newSteps.length - 1] = { ...newSteps[newSteps.length - 1], ...updates };
      }
      return newSteps;
    });
  };

  const handleAgenticWorkflow = async () => {
    if (!user) {
      setIsLoginOpen(true);
      return;
    }
    setIsThinking(true);
    setSteps([]);
    setPlan(null);
    setGroundingLinks([]);
    setViewState('analysis');

    try {
      addStep({ agentName: 'Parser', action: 'Internet Discovery', status: 'active', description: 'Querying global nodes for real-world hospital reports (2024-2025)...' });
      const discovery = await runDiscoveryAgent("Health infrastructure challenges, equipment status, and hospital news in Ghana 2024-2025");
      
      if (discovery.data && discovery.data.length > 0) {
        setReports(discovery.data);
        if (discovery.grounding) setGroundingLinks(prev => [...prev, ...discovery.grounding]);
        updateLastStep({ status: 'completed', description: `Discovered ${discovery.data.length} live infrastructure nodes via Google Search grounding.`, metrics: discovery.metrics });
      } else {
        updateLastStep({ status: 'error', description: 'No real-world reports found in recent index. Falling back to knowledge buffers.' });
      }

      const activeReports = discovery.data?.length > 0 ? discovery.data : reports;

      addStep({ agentName: 'Parser', action: 'IDP Feature Extraction', status: 'active', description: 'Decomposing clinical reports into vector components.' });
      const currentText = activeReports.map(r => r.unstructuredText).join('\n');
      const parsedData = await runParserAgent(currentText);
      updateLastStep({ status: 'completed', metrics: parsedData.metrics });

      addStep({ agentName: 'Verifier', action: 'Semantic Verification', status: 'active', description: 'Cross-checking reported capabilities with public registry.' });
      const verification = await runVerifierAgent(parsedData, currentText);
      updateLastStep({ status: 'completed', metrics: verification.metrics });

      addStep({ agentName: 'Predictor', action: 'Gap Forecasting', status: 'active', description: 'Analyzing risk vectors for medical desert expansion.' });
      const prediction = await runPredictorAgent(activeReports);
      updateLastStep({ status: 'completed', metrics: prediction.metrics });

      addStep({ agentName: 'Strategist', action: 'Strategic RAG Synthesis', status: 'active', description: 'Synthesizing final regional resource model.' });
      const strategyResponse = await runStrategistAgent(activeReports, userLocation);
      updateLastStep({ status: 'completed', metrics: strategyResponse.metrics });

      setPlan(strategyResponse.text);
      if (strategyResponse.grounding) setGroundingLinks(prev => [...prev, ...strategyResponse.grounding]);
    } catch (err) {
      console.error('Agent workflow failed:', err);
      addStep({ agentName: 'Strategist', action: 'Error Handling', status: 'error', description: 'Inference core connection failed.' });
    } finally {
      setIsThinking(false);
    }
  };

  const handleInterventionProtocol = async (report: HospitalReport) => {
    setSelectedReport(null);
    setIsThinking(true);
    setViewState('analysis');
    setSteps([]);
    setPlan(null);

    try {
      addStep({ agentName: 'Matcher', action: 'Tactical Deployment', status: 'active', description: `Initializing intervention protocol for ${report.facilityName}...` });
      const matching = await runMatcherAgent([report]);
      updateLastStep({ status: 'completed', description: `Calculated specialist allocation matrix for ${report.facilityName}.`, metrics: matching.metrics });

      addStep({ agentName: 'Strategist', action: 'Intervention Synthesis', status: 'active', description: 'Generating final deployment orders.' });
      const res = await runQueryAgent(`Create a detailed tactical intervention plan for ${report.facilityName} addressing these specific gaps: ${report.extractedData?.gaps.join(', ')}. Include estimated costs and specialist sourcing.`, [report]);
      updateLastStep({ status: 'completed', metrics: res.metrics });
      
      setPlan(res.text);
      setGroundingLinks(res.grounding || []);
    } catch (err) {
      console.error('Intervention failed:', err);
    } finally {
      setIsThinking(false);
    }
  };

  const handleQuery = async () => {
    if (!query.trim()) return;
    setIsThinking(true);
    setViewState('analysis');
    try {
      const res = await runQueryAgent(query, reports);
      setPlan(res.text);
      setGroundingLinks(res.grounding || []);
    } catch (err) {
      console.error('Query failed:', err);
    } finally {
      setIsThinking(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    setTimeout(() => {
      const userData = { email: 'operator@vip.layer', name: 'Verified Operator', role: 'Federated Analyst' };
      setUser(userData);
      localStorage.setItem('vip_user', JSON.stringify(userData));
      setIsLoginOpen(false);
      setHasLaunched(true);
      setIsGoogleLoading(false);
    }, 1500);
  };

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const searchStr = (r.facilityName + ' ' + r.region).toLowerCase();
      const matchesSearch = searchStr.includes(kbSearch.toLowerCase());
      const matchesRegion = kbFilterRegion === 'All' || r.region === kbFilterRegion;
      return matchesSearch && matchesRegion;
    });
  }, [reports, kbSearch, kbFilterRegion]);

  const filteredAudit = useMemo(() => {
    return MOCK_AUDIT.filter(log => auditFilter === 'all' || log.status === auditFilter);
  }, [auditFilter]);

  const handleLogout = () => {
    localStorage.removeItem('vip_user');
    setUser(null);
    setHasLaunched(false);
    setViewState('dashboard');
    setShowUserMenu(false);
  };

  const handleDesertClick = useCallback((desert: MedicalDesert) => setSelectedDesert(desert), []);
  const handleClearSelection = useCallback(() => setSelectedDesert(null), []);

  const NavItem = ({ icon: Icon, label, id, badge }: { icon: any, label: string, id: ViewState, badge?: string }) => (
    <button 
      onClick={() => { setViewState(id); setIsSidebarOpen(false); }}
      className={`relative flex items-center gap-4 w-full px-5 py-6 rounded-2xl transition-all duration-500 group overflow-hidden whitespace-nowrap mb-2 ${
        viewState === id 
          ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 sidebar-glow shadow-lg' 
          : 'text-[var(--text-muted)] hover:bg-white/[0.04] border border-transparent'
      }`}
    >
      {viewState === id && (
        <motion.div layoutId="active-pill" className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-emerald-500 rounded-r-full" />
      )}
      <Icon className={`w-5 h-5 flex-shrink-0 transition-all duration-500 ${viewState === id ? 'scale-110 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'group-hover:scale-110'}`} />
      <span className={`text-sm font-bold tracking-tight truncate transition-all duration-300 ${viewState === id ? 'translate-x-1 font-extrabold' : 'group-hover:translate-x-1'}`}>{label}</span>
      {badge && <span className="ml-auto px-2 py-0.5 bg-emerald-500/20 rounded-lg text-[9px] font-black text-emerald-400 border border-emerald-500/20 uppercase tracking-tighter">{badge}</span>}
    </button>
  );

  return (
    <div className={`flex h-screen overflow-hidden bg-[var(--bg-deep)] text-[var(--text-main)] font-['Plus_Jakarta_Sans'] transition-colors duration-300`}>
      <AnimatePresence>{!hasLaunched && <LandingPage onLaunch={() => setHasLaunched(true)} onSignIn={() => setIsLoginOpen(true)} onGetStarted={() => setIsGetStartedOpen(true)} user={user} />}</AnimatePresence>

      <AnimatePresence>{isSidebarOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden" />}</AnimatePresence>

      <aside className={`fixed inset-y-0 left-0 w-80 lg:relative lg:block z-[110] border-r border-white/[0.03] p-6 flex flex-col h-full bg-[var(--sidebar-bg)] transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center gap-4 mb-10 px-2 flex-shrink-0">
          <motion.div whileHover={{ rotate: 180 }} className="relative bg-gradient-to-br from-emerald-400 to-emerald-600 p-2.5 rounded-2xl shadow-emerald-500/30 shadow-xl"><Activity className="text-white w-6 h-6" /></motion.div>
          <div><h1 className="text-lg font-extrabold tracking-tighter text-[var(--text-main)]">VIP LAYER</h1><p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest leading-none">Global Intelligence</p></div>
        </div>
        
        <nav className="flex flex-col gap-1 flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
          <div className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] mb-4 mt-2 px-4 sticky top-0 bg-[var(--sidebar-bg)] py-2 z-10">Core Systems</div>
          <NavItem icon={LayoutDashboard} label="Strategic Hub" id="dashboard" />
          <NavItem icon={MapIcon} label="Regional Deserts" id="map" badge={`${deserts.length} Nodes`} />
          <NavItem icon={TrendingUp} label="Agent Reasoning" id="analysis" />
          <div className="mt-8 text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] mb-4 px-4 sticky top-0 bg-[var(--sidebar-bg)] py-2 z-10">Intelligence Tools</div>
          <NavItem icon={Database} label="Knowledge Matrix" id="simulation" badge={isLiveMode ? "WEB LIVE" : "MOCK"} />
          <NavItem icon={ClipboardList} label="Audit Protocol" id="audit" />
        </nav>

        <div className="mt-auto pt-6 flex-shrink-0 border-t border-white/5">
          <div className="p-5 glass-card rounded-[2.5rem] border-emerald-500/10 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest leading-none">{isLiveMode ? 'Live Network Active' : 'Offline Buffer'}</span>
              <button onClick={() => setIsLiveMode(!isLiveMode)} className={`p-1.5 rounded-lg transition-all ${isLiveMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-600'}`}>
                {isLiveMode ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              </button>
            </div>
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleAgenticWorkflow} disabled={isThinking} className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-emerald-950 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2.5 shadow-xl">
              {isThinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
              Launch Synthesis
            </motion.button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-full relative bg-[var(--bg-deep)] transition-colors duration-300">
        <header className="sticky top-0 z-30 bg-[var(--header-bg)] backdrop-blur-3xl border-b border-white/[0.03] px-6 lg:px-12 py-7 flex items-center justify-between flex-shrink-0 transition-colors duration-300">
          <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2.5 bg-white/5 rounded-xl"><Menu className="w-5 h-5" /></button>
             <h2 className="text-xl lg:text-2xl font-black tracking-tighter capitalize truncate text-[var(--text-main)]">{viewState.replace('-', ' ')}</h2>
             
             <div className="hidden sm:flex items-center ml-4 gap-2">
                <button 
                  onClick={() => setIsLiveMode(!isLiveMode)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border transition-all duration-500 group ${isLiveMode ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.15)]' : 'bg-white/5 border-white/10 text-slate-500 opacity-60'}`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${isLiveMode ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></div>
                  <span className="text-[10px] font-black uppercase tracking-widest">{isLiveMode ? 'REAL-WORLD STREAMING' : 'STATIC NODE SYNC'}</span>
                  {isLiveMode && <Satellite className="w-3.5 h-3.5 animate-pulse" />}
                </button>
             </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-6">
             <div className="relative group hidden md:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-emerald-400 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Matrix Search..." 
                  className="bg-white/[0.03] border border-white/[0.05] rounded-2xl pl-11 pr-5 py-2.5 text-xs w-64 focus:ring-1 focus:ring-emerald-500/30 transition-all text-[var(--text-main)] placeholder:text-slate-700"
                  value={kbSearch}
                  onChange={(e) => setKbSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (viewState === 'simulation' ? null : handleQuery())}
                />
             </div>
             <button onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')} className="p-3 bg-white/5 hover:bg-emerald-500/10 border border-white/10 rounded-2xl transition-all group">
               {theme === 'dark' ? <Sun className="w-5 h-5 text-emerald-400" /> : <Moon className="w-5 h-5 text-emerald-500" />}
             </button>
             <div className="relative" ref={userMenuRef}>
               <div onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-3 pl-3 lg:pl-6 border-l border-white/10 cursor-pointer group">
                  <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 flex items-center justify-center text-xs font-bold ring-1 ring-white/10 group-hover:ring-emerald-500/50 transition-all text-white">
                    {user ? (user.name?.[0] || user.email?.[0]?.toUpperCase()) : '??'}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-700 group-hover:text-emerald-400 transition-all ${showUserMenu ? 'rotate-180' : ''}`} />
               </div>
               <AnimatePresence>{showUserMenu && user && <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="absolute top-full right-0 mt-4 w-48 bg-[var(--sidebar-bg)] border border-white/10 rounded-2xl shadow-4xl p-2 z-[1000] backdrop-blur-3xl"><button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-rose-500/10 text-rose-500 transition-colors group"><LogOut className="w-4 h-4" /><span className="text-xs font-black uppercase tracking-widest">Logout Protocol</span></button></motion.div>}</AnimatePresence>
             </div>
          </div>
        </header>

        <div ref={mainScrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-12 min-h-0 pb-48">
          <div className="max-w-7xl mx-auto h-full flex flex-col">
            {viewState === 'dashboard' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 lg:space-y-10 pb-48">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                  {[
                    { label: 'Real-time Nodes', val: reports.length.toString(), color: 'emerald', icon: Database, sub: 'Synced' },
                    { label: 'Medical Deserts', val: `${deserts.length} Clusters`, color: 'rose', icon: ShieldAlert, sub: 'Action Required' },
                    { label: 'Inference Confidence', val: '98.2%', color: 'blue', icon: Activity, sub: 'Optimized V4' },
                    { label: 'Verified Sources', val: groundingLinks.length.toString(), color: 'amber', icon: Globe, sub: 'Verified' }
                  ].map((stat, i) => (
                    <div key={i} className="glass-card p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] relative overflow-hidden group">
                      <div className="flex items-center justify-between mb-4 lg:mb-6">
                        <div className={`p-4 bg-${stat.color}-500/10 rounded-2xl text-${stat.color}-400 group-hover:bg-${stat.color}-500 transition-all duration-500`}><stat.icon className="w-6 h-6 lg:w-7 lg:h-7" /></div>
                        <span className={`text-${stat.color}-400 text-[9px] lg:text-[10px] font-black tracking-widest uppercase`}>{stat.sub}</span>
                      </div>
                      <h4 className="text-[var(--text-muted)] text-[9px] lg:text-[10px] font-black uppercase tracking-[0.3em] mb-1">{stat.label}</h4>
                      <p className="text-3xl lg:text-4xl font-black text-[var(--text-main)] tracking-tighter">{stat.val}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                  <div className="lg:col-span-2 glass-card p-6 lg:p-10 rounded-[2.5rem] min-h-[350px] lg:min-h-[440px] flex flex-col relative overflow-hidden group">
                    <h3 className="text-lg lg:text-xl font-black tracking-tight flex items-center gap-3 mb-10 text-[var(--text-main)]"><BarChart3 className="w-6 h-6 text-emerald-400" /> Regional Saturation</h3>
                    <div className="flex-1 flex items-end justify-between gap-3 lg:gap-6 px-4">
                      {[85, 45, 100, 75, 60, 95, 40, 70, 50, 80].map((h, i) => (
                        <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} className="flex-1 bg-gradient-to-t from-emerald-500/5 to-emerald-500/30 rounded-t-xl hover:from-emerald-500/20 transition-all duration-300" />
                      ))}
                    </div>
                  </div>
                  <div className="glass-card p-6 lg:p-10 rounded-[2.5rem] flex flex-col overflow-hidden">
                    <h3 className="text-lg lg:text-xl font-black tracking-tight flex items-center gap-3 mb-10 text-[var(--text-main)]"><Satellite className="w-6 h-6 text-blue-400" /> Logic Signals</h3>
                    <div className="space-y-6 flex-1 overflow-y-auto pr-4 custom-scrollbar">
                      {MOCK_AUDIT.map((log) => (
                        <div key={log.id} className="flex gap-4 group pb-4 border-b border-white/[0.02] last:border-0">
                          <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${log.status === 'success' ? 'bg-emerald-500' : 'bg-rose-500'} shadow-[0_0_8px_rgba(16,185,129,0.3)]`}></div>
                          <div><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{log.timestamp}</span><p className="text-xs font-bold leading-tight text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors">{log.event}</p></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            {viewState === 'map' && (
              <div className="flex-1 min-h-[400px] lg:min-h-[600px] rounded-[2rem] lg:rounded-[3.5rem] overflow-hidden glass-card relative group shadow-2xl mb-48">
                 <RegionalMap deserts={deserts} selectedDesertId={selectedDesert?.id} onDesertClick={handleDesertClick} onClearSelection={handleClearSelection} theme={theme} />
                 <AnimatePresence>
                  {selectedDesert && (
                    <motion.div initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 300, opacity: 0 }} className="absolute top-4 lg:top-10 right-4 lg:right-10 w-72 lg:w-85 bg-[var(--sidebar-bg)] border border-white/10 rounded-[2rem] p-6 lg:p-10 shadow-4xl z-50 backdrop-blur-3xl">
                        <div className="flex justify-between items-start mb-8"><h3 className="text-2xl font-black tracking-tighter text-[var(--text-main)]">{selectedDesert.region}</h3><button onClick={handleClearSelection} className="p-2.5 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><X className="w-4 h-4 text-slate-500" /></button></div>
                        <div className="space-y-6"><div><p className="text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest">Detected Infrastructure Gaps</p><div className="flex flex-wrap gap-2">{selectedDesert.primaryGaps.map(g => <span key={g} className="text-[9px] font-black bg-rose-500/10 text-rose-400 px-3 py-1.5 rounded-xl border border-rose-500/20">{g}</span>)}</div></div></div>
                    </motion.div>
                  )}
                 </AnimatePresence>
              </div>
            )}

            {viewState === 'analysis' && (
               <div className="flex flex-col gap-10 pb-48">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { label: 'Active Reasoning Nodes', val: steps.length || '0', sub: 'Federated Matrix', icon: Cpu, color: 'emerald' },
                      { label: 'Token Ingestion Rate', val: isThinking ? '2.4k/s' : 'Idle', sub: 'Gemini Logic', icon: Layers, color: 'blue' },
                      { label: 'Logic Grounding', val: plan ? 'Verified' : 'Ready', sub: 'Search Grounded', icon: Globe, color: 'amber' },
                      { label: 'Plan Distribution', val: plan ? 'Broadcast' : 'Pending', sub: 'Regional Relay', icon: Share2, color: 'rose' }
                    ].map((hud, i) => (
                      <div key={i} className="glass-card p-6 rounded-[2rem] border-white/5 relative overflow-hidden group transition-all duration-300 hover:border-white/10">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><hud.icon className="w-12 h-12" /></div>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{hud.label}</p>
                        <h4 className="text-xl font-black text-[var(--text-main)]">{hud.val}</h4>
                        <p className={`text-[9px] font-black text-${hud.color}-500/60 uppercase tracking-widest mt-1`}>{hud.sub}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 min-h-0">
                    <div className="lg:col-span-4 h-full"><AgentTrace steps={steps} /></div>
                    <div className="lg:col-span-8 space-y-8 h-full flex flex-col min-h-0">
                      <div ref={planContainerRef} className="glass-card rounded-[2.5rem] lg:rounded-[3.5rem] p-6 lg:p-12 h-full relative overflow-hidden flex flex-col min-h-[600px] shadow-2xl">
                          {isThinking ? (
                            <div className="flex flex-col items-center justify-center flex-1 gap-12 text-center">
                                <div className="relative">
                                  <div className="w-32 lg:w-48 h-32 lg:h-48 rounded-full border-2 border-emerald-500/10 animate-spin-slow"></div>
                                  <div className="absolute inset-0 m-auto w-24 lg:w-32 h-24 lg:h-32 rounded-full border-t-2 border-emerald-500 animate-spin"></div>
                                  <Cpu className="absolute inset-0 m-auto w-8 lg:w-10 h-8 lg:h-10 text-emerald-400" />
                                </div>
                                <div>
                                  <h3 className="text-xl lg:text-3xl font-black tracking-tighter text-[var(--text-main)] mb-4">Synthesizing Regional Strategy...</h3>
                                  <p className="text-emerald-500/60 font-black uppercase text-[10px] tracking-widest animate-pulse flex items-center justify-center gap-2">
                                    <Globe className="w-4 h-4"/> Multi-Agent Consensus Protocol Active
                                  </p>
                                </div>
                            </div>
                          ) : plan ? (
                            <div className="overflow-y-auto pr-6 custom-scrollbar flex-1">
                                <div className="prose prose-invert prose-emerald max-w-none">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
                                      <div className="flex items-center gap-4">
                                        <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                                          <Terminal className="w-6 h-6 text-emerald-400" />
                                        </div>
                                        <div>
                                          <h2 className="text-2xl lg:text-4xl font-black tracking-tighter m-0 text-[var(--text-main)]">Strategic Synthesis Report</h2>
                                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Plan V4.2.1-SECURE</p>
                                        </div>
                                      </div>
                                      <div className="flex gap-3">
                                        <button onClick={handleAgenticWorkflow} className="px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black text-emerald-400 uppercase tracking-widest hover:bg-emerald-500/10 transition-all flex items-center gap-2">
                                          <RefreshCw className="w-3.5 h-3.5" /> Re-Synthesize
                                        </button>
                                        <button className="px-5 py-3 bg-emerald-500 text-emerald-950 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center gap-2">
                                          <Share2 className="w-3.5 h-3.5" /> Broadcast Protocol
                                        </button>
                                      </div>
                                  </div>
                                  
                                  <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="relative"
                                  >
                                    <div className="absolute -left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500/50 to-transparent rounded-full opacity-20 hidden lg:block"></div>
                                    <div className="text-[var(--text-muted)] text-base lg:text-lg leading-[2] whitespace-pre-wrap font-medium bg-emerald-500/[0.01] border border-white/[0.04] p-8 lg:p-14 rounded-[2.5rem] lg:rounded-[3.5rem] shadow-inner relative group backdrop-blur-sm overflow-hidden">
                                      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-700 pointer-events-none"><Zap className="w-24 h-24 text-emerald-400" /></div>
                                      <MarkdownRenderer content={plan} />
                                    </div>
                                  </motion.div>
                                </div>
                                {groundingLinks.length > 0 && (
                                  <div className="mt-12 lg:mt-24 pt-10 border-t border-white/5">
                                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-10 flex items-center gap-3">
                                        <Globe className="w-4 h-4 text-emerald-500/50" />
                                        Contextual Citations & Source Grounding
                                      </h4>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {groundingLinks.map((link, idx) => (
                                          <a key={idx} href={link.web?.uri || link.maps?.uri} target="_blank" rel="noreferrer" className="flex items-center justify-between p-5 bg-white/[0.02] rounded-[1.5rem] border border-white/[0.05] hover:bg-emerald-500/10 transition-all group shadow-xl">
                                            <span className="text-[9px] font-black text-slate-500 group-hover:text-[var(--text-main)] truncate uppercase tracking-widest">{link.web?.title || link.maps?.title || "Data Node Source"}</span>
                                            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
                                          </a>
                                        ))}
                                      </div>
                                  </div>
                                )}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center flex-1 text-slate-700 gap-8">
                                <div className="relative group">
                                  <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full scale-150 group-hover:scale-[2] transition-transform duration-700"></div>
                                  <div className="relative p-10 bg-white/5 rounded-full border border-white/10 mb-6">
                                    <Sparkles className="w-16 h-16 text-emerald-400" />
                                  </div>
                                </div>
                                <div className="text-center space-y-4 max-w-sm">
                                  <h3 className="text-2xl font-black tracking-tighter text-[var(--text-main)]">Agentic Engine Ready</h3>
                                  <p className="text-sm font-bold text-[var(--text-muted)] leading-relaxed">Click below to begin real-world discovery and synthesis.</p>
                                </div>
                                <motion.button 
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={handleAgenticWorkflow}
                                  className="mt-6 px-10 py-5 bg-emerald-500 text-emerald-950 font-black uppercase tracking-widest text-[11px] rounded-[2rem] flex items-center gap-3 shadow-2xl shadow-emerald-500/20"
                                >
                                  <Wand2 className="w-5 h-5" />
                                  Initialize Global Synthesis
                                </motion.button>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
               </div>
            )}

            {viewState === 'simulation' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 overflow-y-auto pr-2 custom-scrollbar flex-1 pb-48">
                {filteredReports.map(report => (
                  <motion.div key={report.id} whileHover={{ scale: 1.02, y: -5 }} onClick={() => setSelectedReport(report)} className="glass-card p-6 lg:p-10 rounded-[2rem] lg:rounded-[2.5rem] border border-white/5 hover:border-emerald-500/30 transition-all group flex flex-col min-h-[320px] cursor-pointer shadow-lg hover:shadow-2xl">
                    <div className="flex justify-between items-start mb-6"><div className="p-3 bg-emerald-500/10 rounded-2xl group-hover:bg-emerald-500 group-hover:text-emerald-950 transition-all duration-300"><Database className="w-5 h-5" /></div><span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-white/5 opacity-50">{isLiveMode ? 'LIVE STREAM' : 'STATIC BUFFER'}</span></div>
                    <h4 className="text-lg lg:text-xl font-black mb-1 group-hover:text-emerald-400 transition-colors duration-300 text-[var(--text-main)]">{report.facilityName}</h4>
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-8 flex items-center gap-2"><MapPin className="w-3 h-3 text-emerald-500" /> {report.region}</p>
                    <div className="space-y-4 flex-1">
                      <div className="flex flex-wrap gap-2">
                        {report.extractedData?.equipmentList?.slice(0, 3).map(e => <span key={e.name} className={`text-[9px] font-black px-3 py-1.5 rounded-xl border ${e.status === 'Operational' ? 'text-emerald-400 border-emerald-500/10' : 'text-rose-400 border-rose-500/10'}`}>{e.name}</span>)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            
            {viewState === 'audit' && (
               <div className="glass-card p-6 lg:p-12 rounded-[2.5rem] lg:rounded-[3.5rem] h-full flex flex-col min-h-0 mb-48 shadow-2xl">
                  <h3 className="text-2xl lg:text-3xl font-black tracking-tighter mb-12 text-[var(--text-main)]">Full Audit Protocol Log</h3>
                  <div className="space-y-4 overflow-y-auto pr-4 custom-scrollbar flex-1 pb-10">
                    {filteredAudit.map((log) => (
                      <div key={log.id} className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-[1.5rem] flex items-center justify-between gap-4 hover:bg-white/[0.04] transition-all">
                         <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{log.timestamp} - {log.user}</span>
                            <p className="text-xs lg:text-sm font-bold text-[var(--text-muted)]">{log.event}</p>
                         </div>
                         <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase border tracking-widest ${log.status === 'success' ? 'text-emerald-400 border-emerald-500/10' : 'text-rose-400 border-rose-500/10'}`}>{log.status}</div>
                      </div>
                    ))}
                  </div>
               </div>
            )}
          </div>
        </div>
      </main>

      <ReportDetail report={selectedReport} onClose={() => setSelectedReport(null)} onIntervention={handleInterventionProtocol} />
      <AIChatBot reports={reports} deserts={deserts} />

      <AnimatePresence>
        {isLoginOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsLoginOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="relative w-full max-w-md glass-card rounded-[3rem] p-10 sm:p-12 border-white/10 shadow-4xl max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <button onClick={() => setIsLoginOpen(false)} className="absolute top-8 right-8 p-2 text-slate-500 hover:text-[var(--text-main)] transition-colors"><X className="w-5 h-5" /></button>
              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6"><Lock className="w-8 h-8 text-emerald-400" /></div>
                <h3 className="text-3xl font-black tracking-tighter mb-2 text-[var(--text-main)]">Protocol Access</h3>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Identify yourself to the core nodes</p>
              </div>
              <LoginForm onLogin={(userData) => { setUser(userData); localStorage.setItem('vip_user', JSON.stringify(userData)); setIsLoginOpen(false); setHasLaunched(true); }} />
              <div className="relative my-10"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div><div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest"><span className="bg-[var(--sidebar-bg)] px-4 text-slate-500">or biometric sync</span></div></div>
              <button 
                onClick={handleGoogleLogin} 
                disabled={isGoogleLoading}
                className="w-full py-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/5 transition-all flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest disabled:opacity-50 text-[var(--text-main)]"
              >
                {isGoogleLoading ? (
                   <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                ) : (
                  <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="G" /> 
                )}
                {isGoogleLoading ? "Verifying Federated Identity..." : "Continue with Google"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isGetStartedOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsGetStartedOpen(false)} className="fixed inset-0 z-[900] bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-full w-full sm:w-[500px] z-[950] bg-[var(--sidebar-bg)] border-l border-white/10 shadow-4xl p-10 sm:p-16 flex flex-col backdrop-blur-3xl bg-opacity-95">
              <button onClick={() => setIsGetStartedOpen(false)} className="absolute top-10 right-10 p-2 text-slate-500 hover:text-[var(--text-main)] transition-colors"><X className="w-6 h-6" /></button>
              <div className="mb-12">
                <div className="p-4 bg-emerald-500/10 rounded-2xl w-fit mb-8"><UserPlus className="w-10 h-10 text-emerald-400" /></div>
                <h3 className="text-4xl font-black tracking-tighter mb-4 text-[var(--text-main)]">Initialize Operator</h3>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Configure credentials and clearance levels</p>
              </div>
              <GetStartedForm onSignup={(userData) => { setUser(userData); localStorage.setItem('vip_user', JSON.stringify(userData)); setIsGetStartedOpen(false); setHasLaunched(true); }} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const LoginForm: React.FC<{ onLogin: (data: any) => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { onLogin({ email, name: email.split('@')[0], role: 'Verified Analyst' }); setLoading(false); }, 1000);
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Email Sequence</label><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="operator@vip.layer" className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/30 text-[var(--text-main)]" /></div>
      <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Access Key</label><input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/30 text-[var(--text-main)]" /></div>
      <button type="submit" disabled={loading} className="w-full py-5 bg-emerald-500 text-emerald-950 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/10">{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Identity Sequence"}</button>
    </form>
  );
};

const GetStartedForm: React.FC<{ onSignup: (data: any) => void }> = ({ onSignup }) => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { onSignup(formData); setLoading(false); }, 1000);
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-3"><label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Operator Designation</label><input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} type="text" placeholder="Designation Name" className="w-full bg-white/[0.02] border border-white/5 rounded-[1.5rem] px-6 py-5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/30 text-[var(--text-main)]" /></div>
      <div className="space-y-3"><label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Primary Email Link</label><input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} type="email" placeholder="agent@vip.layer" className="w-full bg-white/[0.02] border border-white/5 rounded-[1.5rem] px-6 py-5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/30 text-[var(--text-main)]" /></div>
      <div className="space-y-3"><label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Encryption Token</label><input value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} type="password" placeholder="••••••••••••" className="w-full bg-white/[0.02] border border-white/5 rounded-[1.5rem] px-6 py-5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/30 text-[var(--text-main)]" /></div>
      <button type="submit" disabled={loading} className="w-full py-6 bg-emerald-500 text-emerald-950 text-xs font-black uppercase tracking-widest rounded-[2rem] hover:bg-emerald-400 transition-all flex items-center justify-center gap-3 shadow-xl">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Initialize Node Proxy Access"}
      </button>
    </form>
  );
};

export default App;
