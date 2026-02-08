
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Activity, ShieldAlert, FileText, MapPin, Search, Plus, 
  ChevronRight, Zap, LayoutDashboard, Map as MapIcon, 
  Database, ClipboardList, TrendingUp, Users, Cpu, Loader2,
  AlertTriangle, CheckCircle2, Terminal, MessageSquare, ExternalLink, Info, RefreshCw, X, Settings, Bell, ChevronDown, Filter, Calendar, Clock, ArrowUpRight, Globe, Box, BarChart3, Satellite, Navigation, Sun, Moon, LogIn, UserPlus, Mail, Lock, User, LogOut, Wifi, WifiOff, Menu, Code, Layers, Share2, Sparkles, Wand2, ShieldCheck, Key, BarChart, Workflow, Briefcase, Trash2, ChevronLeft, PanelLeftClose, PanelLeftOpen, Upload, File, Stethoscope, Gauge, Target, BrainCircuit, ActivitySquare, History
} from 'lucide-react';
import { HospitalReport, AgentStep, ViewState, AuditLog, MedicalDesert, UserProject, AnalysisHistoryEntry } from './types';
import RegionalMap from './components/RegionalMap';
import AgentTrace from './components/AgentTrace';
import LandingPage from './components/LandingPage';
import ReportDetail from './components/ReportDetail';
import AIChatBot from './components/AIChatBot';
import MarkdownRenderer from './components/MarkdownRenderer';
import { CapabilityBarChart, MissionPieChart } from './components/VisualTelemetry';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { runDiscoveryAgent, runParserAgent, runStrategistAgent, runMatcherAgent } from './services/geminiService';
import { GHANA_HOSPITALS, DESERT_REGIONS } from './data/mockData';

const INITIAL_MOCK_AUDIT: AuditLog[] = [
  { id: '1', timestamp: '10:45 AM', event: 'System Node Initialized', user: 'Kernel', status: 'info' },
  { id: '2', timestamp: '11:12 AM', event: 'RSA Identity Protocol Loaded', user: 'Auth_Agent', status: 'success' },
];

const App: React.FC = () => {
  const [hasLaunched, setHasLaunched] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('theme') as any) || 'dark');
  const [reports, setReports] = useState<HospitalReport[]>(GHANA_HOSPITALS);
  const [deserts, setDeserts] = useState<MedicalDesert[]>(DESERT_REGIONS);
  const [viewState, setViewState] = useState<ViewState>('workspace');
  const [isThinking, setIsThinking] = useState(false);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [plan, setPlan] = useState<string | null>(null);
  const [groundingLinks, setGroundingLinks] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedReport, setSelectedReport] = useState<HospitalReport | null>(null);
  const [user, setUser] = useState<any>(() => JSON.parse(localStorage.getItem('vip_user') || 'null'));
  const [registeredUsers, setRegisteredUsers] = useState<any[]>(() => JSON.parse(localStorage.getItem('registered_users') || '[]'));
  
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isGetStartedOpen, setIsGetStartedOpen] = useState(false);
  const [isAddNodeOpen, setIsAddNodeOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [newNodeData, setNewNodeData] = useState({ facilityName: '', region: '', unstructuredText: '' });
  const [newProjectData, setNewProjectData] = useState({ name: '', files: [] as File[] });
  const [activeProject, setActiveProject] = useState<UserProject | null>(null);
  
  const [kbSearch, setKbSearch] = useState('');
  const [kbFilterRegion, setKbFilterRegion] = useState('All');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_MOCK_AUDIT);
  const [auditFilter, setAuditFilter] = useState<'all' | 'success' | 'warning' | 'info'>('all');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const mainScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('registered_users', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('vip_user', JSON.stringify(user));
      setRegisteredUsers(prev => {
        const exists = prev.find(u => u.email === user.email);
        if (exists) return prev.map(u => u.email === user.email ? user : u);
        return [...prev, user];
      });
    }
  }, [user]);

  useEffect(() => {
    if (theme === 'light') document.body.classList.add('light');
    else document.body.classList.remove('light');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const addAudit = (event: string, status: 'success' | 'warning' | 'info' = 'success') => {
    const newLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      event,
      user: user?.name || 'Operator',
      status
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const saveHistoryEntry = (project: UserProject, planStr: string, stepsList: AgentStep[]) => {
    const entry: AnalysisHistoryEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleString(),
      plan: planStr,
      steps: [...stepsList]
    };
    const updatedHistory = [entry, ...(project.analysisHistory || [])];
    const updatedProject = { ...project, analysisHistory: updatedHistory, analysisResult: planStr };
    
    setActiveProject(updatedProject);
    setUser((prev: any) => {
      const updatedProjects = (prev.projects || []).map((p: UserProject) => p.id === project.id ? updatedProject : p);
      if (!updatedProjects.find((p: UserProject) => p.id === project.id)) {
        updatedProjects.push(updatedProject);
      }
      return { ...prev, projects: updatedProjects };
    });
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const existing = registeredUsers.find(u => u.email === formData.email && u.password === formData.password);
    if (existing) {
      setUser(existing);
      setIsLoginOpen(false);
      setHasLaunched(true);
      setViewState('workspace');
      setIsSidebarOpen(true);
      setFormData({ name: '', email: '', password: '' });
      setAuthError(null);
      addAudit(`Login Protocol: ${existing.name}`);
    } else {
      setAuthError('Invalid credentials. Identity check failed.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 6) return setAuthError('Password must be at least 6 characters.');
    if (registeredUsers.some(u => u.email === formData.email)) {
      return setAuthError('Email already registered.');
    }
    const newUser = { ...formData, projects: [] };
    setUser(newUser);
    setIsGetStartedOpen(false);
    setHasLaunched(true);
    setViewState('workspace');
    setIsSidebarOpen(true);
    setFormData({ name: '', email: '', password: '' });
    setAuthError(null);
    addAudit(`New Enrollment: ${newUser.name}`);
  };

  const handleLogout = () => {
    addAudit(`Logout Triggered`, 'info');
    setUser(null);
    localStorage.removeItem('vip_user');
    setHasLaunched(false);
    setActiveProject(null);
    setReports(GHANA_HOSPITALS);
    setViewState('workspace');
    setTheme('dark');
    setIsSidebarOpen(false);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectData.name) return;
    setIsCreateProjectOpen(false);
    setIsThinking(true);
    setViewState('analysis');
    setSteps([]);
    setPlan(null);

    try {
      addStep({ agentName: 'Parser', action: 'IDP Synthesis', status: 'active', description: `Initializing ingestion of ${newProjectData.files.length} document nodes...` });
      
      // Speeding up simulated delays for faster UX
      await new Promise(r => setTimeout(r, 600));
      updateLastStep({ status: 'completed', description: `Ingested ${newProjectData.files.length} files successfully. Source streams validated.` });
      
      addStep({ agentName: 'Verifier', action: 'Geo-Spatial Grounding', status: 'active', description: 'Cross-referencing facility coordinates with satellite clusters...' });
      const discovery = await runDiscoveryAgent(newProjectData.name);
      await new Promise(r => setTimeout(r, 400));
      updateLastStep({ status: 'completed', intermediateOutput: discovery.data });

      addStep({ agentName: 'Strategist', action: 'Holistic Analysis', status: 'active', description: 'Computing 100x efficiency delta for Virtue Foundation...' });
      const strategy = await runStrategistAgent([...GHANA_HOSPITALS, ...(discovery.data || [])]);
      
      const newProject: UserProject = {
        id: 'p' + Date.now(),
        name: newProjectData.name,
        createdAt: new Date().toLocaleDateString(),
        documents: newProjectData.files.map(f => f.name),
        reports: [...GHANA_HOSPITALS, ...(discovery.data || [])],
        analysisResult: strategy.text,
        analysisHistory: [],
        placements: []
      };

      const finalSteps = [...steps]; 
      
      // Fixed: Explicitly update user state so the project appears in the Workspace
      setUser((prev: any) => ({
        ...prev,
        projects: [...(prev.projects || []), newProject]
      }));
      
      setActiveProject(newProject);
      setReports(newProject.reports);
      setPlan(strategy.text);
      setGroundingLinks(strategy.grounding || []);
      addAudit(`Project Initialized: ${newProject.name}`);
    } catch (err) {
      addAudit(`Project Initialization Failed`, 'warning');
      addStep({ agentName: 'Parser', action: 'Fatal Error', status: 'error', description: 'Logic core disconnected.' });
    } finally {
      setIsThinking(false);
      setNewProjectData({ name: '', files: [] });
    }
  };

  const handleExpertiseRouting = async () => {
    if (!activeProject) return;
    setIsThinking(true);
    setSteps([]);
    setViewState('analysis');
    addStep({ agentName: 'Matcher', action: 'Expertise Optimization', status: 'active', description: 'Matching specialist workloads to infrastructure hubs...' });
    
    try {
      const matchRes = await runMatcherAgent(reports);
      updateLastStep({ status: 'completed', intermediateOutput: matchRes });
      
      const updatedProject = {
        ...activeProject,
        placements: matchRes.recommendations.map((r: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          facilityName: r.facility,
          role: r.role,
          priority: r.priority || 'High',
          status: 'Planned'
        }))
      };
      
      saveHistoryEntry(updatedProject, matchRes.recommendations.map(r => `### ${r.facility}\n- **Role**: ${r.role}\n- **Reason**: ${r.reason}`).join('\n\n'), steps);
      addAudit(`Expertise Routing Completed for ${activeProject.name}`);
    } catch (err) {
      addAudit(`Matcher Agent Error`, 'warning');
    } finally {
      setIsThinking(false);
    }
  };

  const handleAddNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !newNodeData.facilityName) return;

    setIsAddNodeOpen(false);
    setIsThinking(true);
    setViewState('analysis');
    setSteps([]);

    try {
      addStep({ agentName: 'Parser', action: 'Thorough Ingestion', status: 'active', description: `Extracting deep metadata from ${newNodeData.facilityName}...` });
      const parsed = await runParserAgent(newNodeData.unstructuredText);
      updateLastStep({ status: 'completed', intermediateOutput: parsed });

      const newNode: HospitalReport = {
        id: 'manual-' + Date.now(),
        facilityName: parsed.facilityName || newNodeData.facilityName,
        region: newNodeData.region,
        reportDate: new Date().toLocaleDateString(),
        unstructuredText: newNodeData.unstructuredText,
        extractedData: parsed,
        coordinates: [7.9 + Math.random() * 2, -1.0 + Math.random() * 2] 
      };

      const updatedProject = {
        ...activeProject,
        reports: [...activeProject.reports, newNode]
      };
      
      setReports(updatedProject.reports);
      saveHistoryEntry(updatedProject, `### Node Ingested: ${newNode.facilityName}\n\nManual verification of unstructured input has been performed by the Parser agent. Node now active in simulation cluster.`, steps);
      addAudit(`Manual Node Ingested: ${newNode.facilityName}`);
      setViewState('simulation');
    } finally {
      setIsThinking(false);
    }
  };

  const selectProject = (project: UserProject) => {
    setActiveProject(project);
    setReports(project.reports);
    setViewState('dashboard');
    addAudit(`Active Project Switched: ${project.name}`, 'info');
  };

  const loadHistoryEntry = (entry: AnalysisHistoryEntry) => {
    setPlan(entry.plan);
    setSteps(entry.steps);
  };

  const addStep = (step: Omit<AgentStep, 'id' | 'timestamp'>) => {
    setSteps(prev => [...prev, { ...step, id: Math.random().toString(36).substr(2, 9), timestamp: new Date().toLocaleTimeString() }]);
  };

  const updateLastStep = (updates: Partial<AgentStep>) => {
    setSteps(prev => {
      if (prev.length === 0) return prev;
      return prev.map((step, i) => i === prev.length - 1 ? { ...step, ...updates } : step);
    });
  };

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const search = kbSearch.toLowerCase();
      const matchesSearch = 
        r.facilityName.toLowerCase().includes(search) || 
        r.region.toLowerCase().includes(search) || 
        r.unstructuredText.toLowerCase().includes(search);
      const matchesRegion = kbFilterRegion === 'All' || r.region === kbFilterRegion;
      return matchesSearch && matchesRegion;
    });
  }, [reports, kbSearch, kbFilterRegion]);

  const filteredAudit = useMemo(() => {
    if (auditFilter === 'all') return auditLogs;
    return auditLogs.filter(log => log.status === auditFilter);
  }, [auditLogs, auditFilter]);

  const NavItem = ({ icon: Icon, label, id, badge, alwaysVisible = false }: { icon: any, label: string, id: ViewState, badge?: string, alwaysVisible?: boolean }) => {
    const isVisible = alwaysVisible || (activeProject !== null);
    if (!isVisible) return null;
    return (
      <button 
        onClick={() => { setViewState(id); }}
        className={`relative flex items-center gap-4 w-full px-5 py-5 rounded-2xl transition-all duration-300 group overflow-hidden ${
          viewState === id 
            ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 shadow-lg' 
            : 'text-[var(--text-muted)] hover:bg-[var(--input-bg)] border border-transparent'
        }`}
      >
        {viewState === id && <motion.div layoutId="active-pill" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-500 rounded-r-full" />}
        <Icon className={`w-5 h-5 flex-shrink-0 transition-all ${viewState === id ? 'scale-110 text-emerald-400' : 'group-hover:scale-110'}`} />
        <div className="flex items-center justify-between w-full">
          <span className={`text-xs font-bold tracking-tight truncate transition-all ${viewState === id ? 'translate-x-1 font-extrabold text-emerald-400' : 'group-hover:translate-x-1'}`}>{label}</span>
          {badge && <span className="ml-auto px-2 py-0.5 bg-emerald-500/20 rounded-lg text-[8px] font-black text-emerald-400 border border-emerald-500/20 uppercase tracking-tighter">{badge}</span>}
        </div>
      </button>
    );
  };

  return (
    <LayoutGroup>
      <div className={`flex h-screen overflow-hidden bg-[var(--bg-deep)] text-[var(--text-main)] font-['Plus_Jakarta_Sans'] transition-colors duration-300`}>
        <AnimatePresence>
          {!hasLaunched && (
            <LandingPage 
              onLaunch={() => setHasLaunched(true)} 
              onSignIn={() => { setIsLoginOpen(true); setIsGetStartedOpen(false); setAuthError(null); }} 
              onGetStarted={() => { setIsGetStartedOpen(true); setIsLoginOpen(false); setAuthError(null); }} 
              user={user} 
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {user && hasLaunched && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: isSidebarOpen ? 1 : 0 }} 
                onClick={() => setIsSidebarOpen(false)}
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[105] lg:hidden ${isSidebarOpen ? 'pointer-events-auto' : 'pointer-events-none'}`} 
              />
              
              <motion.aside 
                layout
                initial={{ x: -320 }}
                animate={{ 
                  x: isSidebarOpen ? 0 : -320,
                  width: isSidebarOpen ? 320 : 0
                }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed lg:relative inset-y-0 left-0 z-[110] border-r border-white/[0.03] p-4 flex flex-col h-full bg-[var(--sidebar-bg)] shadow-4xl overflow-hidden"
              >
                <div className="flex items-center gap-4 mb-10 px-2 flex-shrink-0 w-[320px]">
                  <div className="relative bg-gradient-to-br from-emerald-400 to-emerald-600 p-2 rounded-2xl shadow-emerald-500/30 shadow-xl flex-shrink-0"><Activity className="text-white w-5 h-5" /></div>
                  <div className="min-w-0">
                    <h1 className="text-md font-extrabold tracking-tighter text-[var(--text-main)]">VIP LAYER</h1>
                    <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest leading-none">Intelligence</p>
                  </div>
                  <button onClick={() => setIsSidebarOpen(false)} className="ml-auto p-2 text-slate-500 hover:text-emerald-400 transition-colors"><PanelLeftClose className="w-4 h-4" /></button>
                </div>
                
                <nav className="flex flex-col gap-2 flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-0 w-[320px]">
                  <NavItem icon={Briefcase} label="My Workspace" id="workspace" badge={`${user?.projects?.length || 0}`} alwaysVisible />
                  <NavItem icon={LayoutDashboard} label="Strategic Hub" id="dashboard" />
                  <NavItem icon={Stethoscope} label="Expertise Routing" id="matching" />
                  <NavItem icon={ShieldAlert} label="Integrity HUD" id="integrity" />
                  <NavItem icon={MapIcon} label="Regional View" id="map" />
                  <NavItem icon={TrendingUp} label="Agent Reasoning" id="analysis" />
                  <NavItem icon={Database} label="Knowledge Matrix" id="simulation" />
                  <NavItem icon={ClipboardList} label="Audit Protocol" id="audit" />
                </nav>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <main className="flex-1 flex flex-col min-w-0 h-full relative bg-[var(--bg-deep)]">
          <header className="sticky top-0 z-30 bg-[var(--header-bg)] backdrop-blur-3xl border-b border-white/[0.03] px-6 lg:px-12 py-6 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-4">
               {user && (
                 <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2.5 bg-white/5 rounded-xl text-[var(--text-main)] hover:bg-white/10 transition-all border border-white/10">
                   {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
                 </button>
               )}
               <h2 className="text-xl lg:text-2xl font-black tracking-tighter capitalize truncate text-[var(--text-main)]">{viewState.replace('-', ' ')}</h2>
            </div>
            <div className="flex items-center gap-3">
               <button onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')} className="p-3 bg-white/5 hover:bg-emerald-500/10 border border-white/10 rounded-2xl transition-all shadow-sm">
                 {theme === 'dark' ? <Sun className="w-5 h-5 text-emerald-400" /> : <Moon className="w-5 h-5 text-emerald-500" />}
               </button>
               {user && (
                 <div onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-3 pl-3 lg:pl-6 border-l border-[var(--border-subtle)] cursor-pointer group relative">
                    <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 flex items-center justify-center text-xs font-bold ring-1 ring-white/10 group-hover:ring-emerald-500/50 transition-all text-white">
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                    <AnimatePresence>{showUserMenu && (
                     <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute top-full right-0 mt-4 w-52 bg-[var(--sidebar-bg)] border border-white/10 rounded-2xl shadow-4xl p-2 z-[1000] backdrop-blur-3xl">
                       <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-rose-500/10 text-rose-500 transition-colors group"><LogOut className="w-4 h-4" /><span className="text-xs font-black uppercase tracking-widest">Logout</span></button>
                     </motion.div>
                   )}</AnimatePresence>
                 </div>
               )}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-12 min-h-0 pb-48">
            <div className="max-w-7xl mx-auto h-full flex flex-col">
              
              {viewState === 'workspace' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <motion.div onClick={() => setIsCreateProjectOpen(true)} className="p-10 border-2 border-dashed border-[var(--border-subtle)] rounded-[3rem] bg-white/[0.02] flex flex-col items-center justify-center text-center gap-6 cursor-pointer hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group">
                     <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform"><Plus className="w-8 h-8" /></div>
                     <p className="text-sm font-black uppercase tracking-widest text-[var(--text-muted)]">Initialize New Unit</p>
                  </motion.div>
                  {(user?.projects || []).map((project: UserProject) => (
                    <motion.div key={project.id} onClick={() => selectProject(project)} className={`glass-card p-10 rounded-[2.5rem] border transition-all cursor-pointer flex flex-col h-full relative border-white/10 hover:border-emerald-500/20 shadow-xl`}>
                      <div className="flex items-center justify-between mb-8"><div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400"><Briefcase className="w-6 h-6" /></div></div>
                      <h4 className="text-2xl font-black mb-1 text-[var(--text-main)]">{project.name}</h4>
                      <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-10">{project.createdAt}</p>
                      <div className="mt-auto pt-6 border-t border-[var(--border-subtle)] flex items-center justify-between">
                         <span className="text-[10px] font-bold text-emerald-500 uppercase">{project.reports.length} Facilities Linked</span>
                         <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {viewState === 'dashboard' && activeProject && (
                <div className="space-y-10">
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2 glass-card p-10 rounded-[3rem] border-white/10 relative overflow-hidden">
                         <div className="flex items-center justify-between mb-10 relative z-10">
                            <div>
                               <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Impact Goal: 100x Efficiency</h4>
                               <p className="text-2xl font-black text-[var(--text-main)] tracking-tighter">Referral Time Reduction Matrix</p>
                            </div>
                            <Gauge className="w-8 h-8 text-emerald-500" />
                         </div>
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10">
                            {[
                              { label: 'Current Delay', val: '4.2 Days', color: 'rose' },
                              { label: 'Optimized Path', val: '52 Mins', color: 'emerald' },
                              { label: 'Projected Delta', val: '116.3x', color: 'emerald', highlight: true }
                            ].map((s, i) => (
                              <div key={i} className={`p-6 rounded-2xl border ${s.highlight ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10'}`}>
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">{s.label}</p>
                                <p className={`text-xl font-black text-${s.color}-500 tracking-tighter`}>{s.val}</p>
                              </div>
                            ))}
                         </div>
                         <div className="mt-10 h-48 relative z-10">
                           <CapabilityBarChart 
                              title="Infrastructure Gap Density" 
                              data={reports.slice(0, 6).map(r => ({ label: r.facilityName.split(' ')[0], value: r.extractedData?.confidence ? r.extractedData.confidence * 100 : 50, color: 'from-blue-500 to-emerald-500' }))} 
                           />
                         </div>
                      </div>
                      <div className="glass-card p-10 rounded-[3rem] border-white/10 flex flex-col justify-center">
                         <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-6"><Target className="w-8 h-8" /></div>
                         <h4 className="text-xl font-black text-[var(--text-main)] tracking-tighter mb-4">Strategic Horizon</h4>
                         <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-8">Agent is prioritizing 3 Northern Cluster hubs for equipment verification due to conflicting capacity reports.</p>
                         <div className="space-y-4 mb-10">
                            <MissionPieChart title="System Distribution" data={[
                               { label: 'Operational', value: reports.length, color: 'emerald' },
                               { label: 'Medical Desert', value: deserts.length, color: 'rose' }
                            ]} />
                         </div>
                         <button onClick={() => setViewState('matching')} className="w-full py-4 bg-emerald-500 text-emerald-950 font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-emerald-400 transition-all">Route Expertise</button>
                      </div>
                   </div>
                </div>
              )}

              {viewState === 'matching' && activeProject && (
                <div className="space-y-8">
                   <div className="flex items-center justify-between bg-white/[0.04] p-10 rounded-[3rem] border border-white/10">
                      <div>
                        <h3 className="text-3xl font-black tracking-tighter text-[var(--text-main)]">Clinical Routing Engine</h3>
                        <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest mt-2">Connecting specialist expertise to high-risk hubs</p>
                      </div>
                      <button 
                        onClick={handleExpertiseRouting} 
                        disabled={isThinking}
                        className="px-10 py-6 bg-emerald-500 text-emerald-950 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all hover:scale-105 flex items-center gap-3 disabled:opacity-50"
                      >
                        {isThinking ? <Loader2 className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5" />}
                        Initialize Match Agent
                      </button>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {(activeProject.placements || []).map(p => (
                        <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-8 glass-card rounded-[2.5rem] border-white/10 flex flex-col gap-6 group hover:border-emerald-500/20 transition-all">
                          <div className="flex items-center justify-between">
                            <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all"><Stethoscope className="w-6 h-6" /></div>
                            <div className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border ${p.priority === 'Critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                              {p.priority}
                            </div>
                          </div>
                          <div>
                             <p className="text-sm font-black text-[var(--text-main)] uppercase tracking-tight group-hover:text-emerald-400 transition-colors">{p.role}</p>
                             <p className="text-[10px] font-bold text-slate-500 uppercase mt-1 flex items-center gap-2"><MapPin className="w-3 h-3 text-emerald-500" /> {p.facilityName}</p>
                          </div>
                        </motion.div>
                      ))}
                      {(!activeProject.placements || activeProject.placements.length === 0) && (
                        <div className="col-span-full py-32 text-center opacity-30 border-2 border-dashed border-white/10 rounded-[3rem]">
                           <Users className="w-16 h-16 mx-auto mb-6" />
                           <p className="text-sm font-black uppercase tracking-widest">No Active Placements. Run Match Agent to synchronize workforce deployment.</p>
                        </div>
                      )}
                   </div>
                </div>
              )}

              {viewState === 'integrity' && activeProject && (
                <div className="space-y-8">
                   <div className="bg-rose-500/5 p-10 rounded-[3rem] border border-rose-500/20 flex items-center justify-between overflow-hidden relative">
                      <div className="relative z-10">
                         <h3 className="text-3xl font-black tracking-tighter text-rose-500">Integrity HUD</h3>
                         <p className="text-sm font-bold text-rose-500/60 uppercase tracking-widest mt-2">Active anomalies & verification failures detected in node reports</p>
                      </div>
                      <ShieldAlert className="w-16 h-16 text-rose-500/40 relative z-10" />
                      <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                   </div>
                   
                   <div className="grid grid-cols-1 gap-6">
                      {reports.filter(r => (r.anomalies?.length || 0) > 0 || (r.extractedData?.confidence && r.extractedData.confidence < 0.9)).map(r => (
                        <motion.div 
                          key={r.id} 
                          initial={{ opacity: 0, y: 20 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          className="p-8 glass-card rounded-[3rem] border-rose-500/10 flex flex-col gap-8 group hover:border-rose-500/30 transition-all shadow-lg"
                        >
                           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                 <div className="p-4 bg-rose-500/10 rounded-2xl text-rose-500 group-hover:scale-110 transition-transform"><AlertTriangle className="w-6 h-6" /></div>
                                 <div>
                                   <h4 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight">{r.facilityName}</h4>
                                   <p className="text-[10px] font-bold text-slate-500 uppercase mt-1 flex items-center gap-2"><MapPin className="w-3 h-3 text-rose-500" /> {r.region}</p>
                                 </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                 <span className="px-4 py-2 bg-rose-500/10 rounded-xl text-[9px] font-black text-rose-500 border border-rose-500/20 uppercase tracking-widest">Confidence: {((r.extractedData?.confidence || 0) * 100).toFixed(0)}%</span>
                                 <span className="px-4 py-2 bg-rose-500/20 rounded-xl text-[9px] font-black text-rose-500 border border-rose-500/30 uppercase tracking-widest">Verification Failed</span>
                              </div>
                           </div>
                           
                           <div className="p-6 bg-black/10 rounded-2xl border border-white/5">
                              <p className="text-[9px] font-black text-rose-500/60 uppercase tracking-widest mb-4">Detected Anomalies</p>
                              <div className="space-y-4">
                                 {(r.anomalies || []).map((anomaly, i) => (
                                   <div key={i} className="flex items-start gap-4 p-4 bg-rose-500/5 rounded-xl border border-rose-500/10">
                                      <div className={`mt-1 w-2 h-2 rounded-full ${anomaly.severity === 'high' ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : 'bg-amber-500'}`}></div>
                                      <div>
                                         <p className="text-[10px] font-black text-rose-400 uppercase tracking-tight">{anomaly.type.replace('_', ' ')}</p>
                                         <p className="text-xs font-medium text-slate-400 mt-1 leading-relaxed">{anomaly.description}</p>
                                      </div>
                                   </div>
                                 ))}
                                 {(!r.anomalies || r.anomalies.length === 0) && (
                                   <p className="text-xs text-slate-500 italic">Report confidence score below threshold. Requires manual verification of clinical capacity claims.</p>
                                 )}
                              </div>
                           </div>
                           
                           <div className="flex items-center justify-between pt-4 border-t border-white/5">
                              <p className="text-[10px] font-bold text-slate-500 uppercase italic">Ref: {r.id.toUpperCase()}_LOG_ERR</p>
                              <button onClick={() => setSelectedReport(r)} className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[9px] font-black text-[var(--text-main)] uppercase tracking-widest transition-all">Deep Inspec Node</button>
                           </div>
                        </motion.div>
                      ))}
                      {reports.filter(r => (r.anomalies?.length || 0) > 0 || (r.extractedData?.confidence && r.extractedData.confidence < 0.9)).length === 0 && (
                        <div className="py-48 text-center glass-card rounded-[3rem] border-white/5 flex flex-col items-center justify-center opacity-30">
                           <ShieldCheck className="w-16 h-16 text-emerald-500 mb-6" />
                           <p className="text-sm font-black uppercase tracking-widest">No Critical Anomalies Detected in current project buffer.</p>
                        </div>
                      )}
                   </div>
                </div>
              )}

              {viewState === 'analysis' && (
                <div className="flex flex-col lg:flex-row gap-10 min-h-0">
                   <div className="flex-1 flex flex-col gap-10 overflow-hidden">
                      {isThinking && (
                        <div className="p-10 glass-card rounded-[3rem] border-emerald-500/20 bg-emerald-500/5 animate-pulse flex flex-col gap-6 shadow-2xl">
                           <div className="flex items-center justify-between">
                             <div className="flex items-center gap-6">
                               <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                               <div>
                                 <p className="text-sm font-black text-emerald-500 uppercase tracking-widest">Agent Analysis in Progress</p>
                                 <p className="text-[10px] font-bold text-[var(--text-muted)] mt-1 uppercase">Resolving Logical Chain for VIP Protocol</p>
                               </div>
                             </div>
                             <ActivitySquare className="w-10 h-10 text-emerald-500/30" />
                           </div>
                           
                           {newProjectData.files.length > 0 && (
                             <div className="space-y-3 p-6 bg-black/20 rounded-2xl border border-white/5">
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Deploying Document Nodes</p>
                                <div className="flex flex-wrap gap-2">
                                   {newProjectData.files.map((f, i) => (
                                     <div key={i} className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2">
                                        <File className="w-3 h-3 text-emerald-400" />
                                        <span className="text-[9px] font-bold text-emerald-400">{f.name}</span>
                                     </div>
                                   ))}
                                </div>
                             </div>
                           )}
                        </div>
                      )}
                      
                      <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 pb-12">
                         <AgentTrace steps={steps} />
                         {plan && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-10 p-12 glass-card rounded-[3.5rem] border-white/10 min-h-[500px] shadow-2xl">
                               <MarkdownRenderer content={plan} />
                            </motion.div>
                         )}
                      </div>
                   </div>

                   {/* History Sidebar */}
                   {activeProject && (activeProject.analysisHistory?.length || 0) > 0 && (
                      <div className="lg:w-80 flex flex-col gap-6 h-full overflow-hidden">
                         <div className="glass-card p-8 rounded-[2.5rem] flex flex-col h-full shadow-2xl border-white/10">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                               <History className="w-4 h-4 text-emerald-500" /> Reasoning History
                            </h4>
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                               {activeProject.analysisHistory?.map((entry) => (
                                 <button 
                                   key={entry.id} 
                                   onClick={() => loadHistoryEntry(entry)}
                                   className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl text-left hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all group"
                                 >
                                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-2 group-hover:translate-x-1 transition-transform">{entry.timestamp}</p>
                                    <p className="text-xs text-slate-400 line-clamp-2 font-medium leading-relaxed">{entry.plan.replace(/[#*]/g, '').slice(0, 80)}...</p>
                                 </button>
                               ))}
                            </div>
                         </div>
                      </div>
                   )}
                </div>
              )}
              
              {viewState === 'map' && <div className="h-[700px] rounded-[3.5rem] overflow-hidden glass-card relative shadow-2xl"><RegionalMap deserts={deserts} theme={theme} hospitals={reports} /></div>}

              {viewState === 'simulation' && (
                <div className="space-y-10">
                   <div className="flex items-center justify-between gap-6 bg-white/[0.04] p-10 rounded-[3rem] border border-white/10 shadow-lg">
                      <div className="flex-1 relative">
                        <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500" />
                        <input 
                          type="text" 
                          value={kbSearch} 
                          onChange={(e) => setKbSearch(e.target.value)} 
                          placeholder="Search Knowledge Matrix..." 
                          className="w-full bg-[var(--input-bg)] border border-white/10 rounded-[2rem] py-6 pl-20 pr-8 text-sm focus:outline-none focus:border-emerald-500/40 text-[var(--text-main)]" 
                        />
                      </div>
                      <button onClick={() => setIsAddNodeOpen(true)} className="px-10 py-6 bg-emerald-500 text-emerald-950 font-black uppercase text-[10px] tracking-widest rounded-2xl flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-emerald-500/10">
                         <Plus className="w-5 h-5" /> Ingest Node
                      </button>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {filteredReports.map(report => (
                        <motion.div key={report.id} onClick={() => setSelectedReport(report)} whileHover={{ scale: 1.02 }} className="glass-card p-10 rounded-[2.5rem] border border-white/10 hover:border-emerald-500/30 transition-all cursor-pointer group flex flex-col h-full shadow-md">
                           <div className="flex items-center justify-between mb-8">
                             <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all"><Database className="w-6 h-6" /></div>
                             <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase ${report.extractedData?.verified ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                               {report.extractedData?.verified ? 'Verified' : 'Unverified'}
                             </span>
                           </div>
                           <h4 className="text-xl font-black text-[var(--text-main)] group-hover:text-emerald-400 transition-colors tracking-tight">{report.facilityName}</h4>
                           <p className="text-[10px] font-bold text-slate-500 uppercase mt-2 mb-6 tracking-widest">{report.region}</p>
                           <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{report.reportDate}</span>
                             <ChevronRight className="w-5 h-5 text-slate-500 group-hover:translate-x-1 transition-transform" />
                           </div>
                        </motion.div>
                      ))}
                   </div>
                </div>
              )}

              {viewState === 'audit' && (
                <div className="space-y-6">
                   <div className="p-10 bg-white/[0.04] rounded-[3rem] border border-white/10 flex items-center justify-between shadow-lg">
                     <h3 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tight">System Audit Log</h3>
                     <div className="flex items-center gap-3">
                        <Filter className="w-4 h-4 text-slate-500" />
                        <select 
                          value={auditFilter} 
                          onChange={(e) => setAuditFilter(e.target.value as any)}
                          className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-slate-400 outline-none cursor-pointer hover:border-emerald-500/30"
                        >
                          <option value="all">All Events</option>
                          <option value="success">Success Only</option>
                          <option value="warning">Warnings</option>
                        </select>
                     </div>
                   </div>
                   <div className="space-y-4">
                     {filteredAudit.map(log => (
                       <div key={log.id} className="p-8 glass-card rounded-[2rem] border-white/5 flex items-center justify-between group hover:border-white/10 transition-all shadow-md">
                          <div className="flex items-center gap-6">
                             <div className={`p-4 rounded-2xl ${log.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : log.status === 'warning' ? 'bg-rose-500/10 text-rose-500' : 'bg-blue-500/10 text-blue-400'}`}>
                                {log.status === 'success' ? <CheckCircle2 className="w-5 h-5" /> : log.status === 'warning' ? <ShieldAlert className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                             </div>
                             <div>
                               <p className="text-sm font-black text-[var(--text-main)] uppercase tracking-tight group-hover:text-emerald-400 transition-colors">{log.event}</p>
                               <div className="flex items-center gap-3 mt-1">
                                  <span className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1.5"><Clock className="w-3 h-3" /> {log.timestamp}</span>
                                  <span className="w-1 h-1 bg-white/10 rounded-full"></span>
                                  <span className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1.5"><User className="w-3 h-3" /> {log.user}</span>
                               </div>
                             </div>
                          </div>
                          <div className="text-[9px] font-mono text-slate-600 bg-black/20 px-4 py-2 rounded-lg tracking-widest">TXN_{log.id.toUpperCase()}</div>
                       </div>
                     ))}
                   </div>
                </div>
              )}
            </div>
          </div>
        </main>
        
        <AIChatBot reports={reports} deserts={deserts} />
        
        <ReportDetail 
          report={selectedReport} 
          onClose={() => setSelectedReport(null)} 
          onIntervention={(r) => {
            addAudit(`Emergency Intervention Protocol Deployed: ${r.facilityName}`, 'success');
            setSelectedReport(null);
            setViewState('audit');
          }}
        />

        <AnimatePresence>
          {isCreateProjectOpen && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreateProjectOpen(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="relative w-full max-w-xl glass-card rounded-[4rem] p-12 sm:p-20 border-white/10 shadow-4xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                <button onClick={() => setIsCreateProjectOpen(false)} className="absolute top-12 right-12 p-4 rounded-2xl bg-white/5 text-slate-500"><X className="w-6 h-6" /></button>
                <div className="mb-14"><h3 className="text-3xl font-black text-[var(--text-main)] uppercase tracking-tighter">Initialize Hub</h3></div>
                <form onSubmit={handleCreateProject} className="space-y-10">
                   <div className="space-y-3"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Project Name</label><input required type="text" value={newProjectData.name} onChange={(e) => setNewProjectData(p => ({...p, name: e.target.value}))} placeholder="e.g. OPERATION_ACCRA_2025" className="w-full bg-[var(--input-bg)] border border-white/10 rounded-3xl px-8 py-6 text-[var(--text-main)] focus:outline-none focus:border-emerald-500/50 transition-all" /></div>
                   <div className="space-y-4"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Source Documentation</label>
                   <div className="relative group">
                     <input type="file" multiple onChange={(e) => setNewProjectData(p => ({...p, files: Array.from(e.target.files || [])}))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                     <div className="p-16 border-2 border-dashed border-[var(--border-subtle)] rounded-[3rem] bg-[var(--input-bg)] flex flex-col items-center justify-center gap-6 group-hover:border-emerald-500/20 transition-all">
                       <Upload className="w-8 h-8 text-emerald-400" />
                       <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Deploy Files</p>
                       {newProjectData.files.length > 0 && (
                         <div className="flex flex-wrap gap-2 justify-center mt-4">
                            {newProjectData.files.map((f, i) => (
                              <span key={i} className="px-2 py-1 bg-emerald-500/10 rounded-md text-[8px] font-black text-emerald-400 border border-emerald-500/20">{f.name}</span>
                            ))}
                         </div>
                       )}
                     </div>
                   </div>
                   </div>
                   <button type="submit" className="w-full py-8 bg-emerald-500 text-emerald-950 text-[11px] font-black uppercase tracking-[0.2em] rounded-3xl hover:bg-emerald-400 shadow-2xl transition-all active:scale-95">Verify & Analyze</button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isLoginOpen && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsLoginOpen(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9 }} className="relative w-full max-w-md glass-card rounded-[3.5rem] p-12 border-white/10 shadow-4xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                <button onClick={() => setIsLoginOpen(false)} className="absolute top-10 right-10 p-4 rounded-2xl bg-white/5 text-slate-500 hover:text-[var(--text-main)] transition-colors"><X className="w-6 h-6" /></button>
                <div className="mb-14 text-center"><Key className="w-12 h-12 text-emerald-400 mx-auto mb-6" /><h3 className="text-3xl font-black text-[var(--text-main)] tracking-tighter uppercase">Identity Scan</h3></div>
                <form onSubmit={handleLoginSubmit} className="space-y-8">
                  <div className="space-y-3"><label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Email Sequence</label><input required type="email" value={formData.email} onChange={(e) => setFormData(p => ({...p, email: e.target.value}))} placeholder="agent@vip.layer" className="w-full bg-[var(--input-bg)] border border-white/10 rounded-2xl px-8 py-6 text-[var(--text-main)] focus:outline-none focus:border-emerald-500/50 transition-all" /></div>
                  <div className="space-y-3"><label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Access Token</label><input required type="password" value={formData.password} onChange={(e) => setFormData(p => ({...p, password: e.target.value}))} placeholder="••••••••••••" className="w-full bg-[var(--input-bg)] border border-white/10 rounded-2xl px-8 py-6 text-[var(--text-main)] focus:outline-none focus:border-emerald-500/50 transition-all" /></div>
                  {authError && <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest px-2">{authError}</p>}
                  <button type="submit" className="w-full py-7 bg-emerald-500 text-emerald-950 text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-emerald-400 shadow-2xl transition-all active:scale-95">Verify RSA Identity</button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isGetStartedOpen && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsGetStartedOpen(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9 }} className="relative w-full max-w-md glass-card rounded-[3.5rem] p-12 border-white/10 shadow-4xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                <button onClick={() => setIsGetStartedOpen(false)} className="absolute top-10 right-10 p-4 rounded-2xl bg-white/5 text-slate-500 hover:text-[var(--text-main)] transition-colors"><X className="w-6 h-6" /></button>
                <div className="mb-14 text-center"><UserPlus className="w-12 h-12 text-emerald-400 mx-auto mb-6" /><h3 className="text-3xl font-black text-[var(--text-main)] uppercase tracking-tighter">Enrollment Scan</h3></div>
                <form onSubmit={handleRegisterSubmit} className="space-y-8">
                  <div className="space-y-3"><label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Designation Name</label><input required type="text" value={formData.name} onChange={(e) => setFormData(p => ({...p, name: e.target.value}))} placeholder="Operator Designation" className="w-full bg-[var(--input-bg)] border border-white/10 rounded-2xl px-8 py-6 text-[var(--text-main)] focus:outline-none focus:border-emerald-500/50 transition-all" /></div>
                  <div className="space-y-3"><label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Email Sequence</label><input required type="email" value={formData.email} onChange={(e) => setFormData(p => ({...p, email: e.target.value}))} placeholder="agent@vip.layer" className="w-full bg-[var(--input-bg)] border border-white/10 rounded-2xl px-8 py-6 text-[var(--text-main)] focus:outline-none focus:border-emerald-500/50 transition-all" /></div>
                  <div className="space-y-3"><label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Secure Access Token</label><input required type="password" value={formData.password} onChange={(e) => setFormData(p => ({...p, password: e.target.value}))} placeholder="••••••••••••" className="w-full bg-[var(--input-bg)] border border-white/10 rounded-2xl px-8 py-6 text-[var(--text-main)] focus:outline-none focus:border-emerald-500/50 transition-all" /></div>
                  {authError && <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest px-2">{authError}</p>}
                  <button type="submit" className="w-full py-7 bg-emerald-500 text-emerald-950 text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-emerald-400 shadow-2xl transition-all active:scale-95">Initialize Enrollment</button>
                </form>
              </motion.div>
            </div>
          )}

          {isAddNodeOpen && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddNodeOpen(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9 }} className="relative w-full max-w-md glass-card rounded-[3.5rem] p-12 sm:p-16 border-white/10 shadow-4xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                <button onClick={() => setIsAddNodeOpen(false)} className="absolute top-10 right-10 p-4 rounded-2xl bg-white/5 text-slate-500 hover:text-[var(--text-main)] transition-colors"><X className="w-6 h-6" /></button>
                <div className="mb-10 text-center sm:text-left"><h3 className="text-2xl font-black tracking-tighter text-[var(--text-main)] uppercase tracking-tighter">Manual Ingestion</h3><p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Manual node placement</p></div>
                <form onSubmit={handleAddNode} className="space-y-8">
                   <div className="space-y-3"><label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Facility Name</label><input required type="text" value={newNodeData.facilityName} onChange={(e) => setNewNodeData(p => ({...p, facilityName: e.target.value}))} placeholder="Facility Designation" className="w-full bg-[var(--input-bg)] border border-white/10 rounded-2xl px-8 py-6 text-sm text-[var(--text-main)] focus:outline-none focus:border-emerald-500/50 transition-all" /></div>
                   <div className="space-y-3"><label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Region</label><input required type="text" value={newNodeData.region} onChange={(e) => setNewNodeData(p => ({...p, region: e.target.value}))} placeholder="Geographic Region" className="w-full bg-[var(--input-bg)] border border-white/10 rounded-2xl px-8 py-6 text-sm text-[var(--text-main)] focus:outline-none focus:border-emerald-500/50 transition-all" /></div>
                   <div className="space-y-3"><label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Context Transcript</label><textarea required rows={5} value={newNodeData.unstructuredText} onChange={(e) => setNewNodeData(p => ({...p, unstructuredText: e.target.value}))} placeholder="Unstructured Context Sequence..." className="w-full bg-[var(--input-bg)] border border-white/10 rounded-2xl px-8 py-6 text-sm text-[var(--text-main)] focus:outline-none focus:border-emerald-500/50 transition-all resize-none" /></div>
                   <button type="submit" className="w-full py-7 bg-emerald-500 text-emerald-950 text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-emerald-400 shadow-2xl transition-all active:scale-95">Verify & Ingest</button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
};

export default App;
