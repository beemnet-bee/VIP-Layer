
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles, Zap, ShieldCheck, Terminal, Database, Activity } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { HospitalReport, MedicalDesert } from '../types';
import MarkdownRenderer from './MarkdownRenderer';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface Props {
  reports: HospitalReport[];
  deserts: MedicalDesert[];
}

const AIChatBot: React.FC<Props> = ({ reports, deserts }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Protocol initialized. I am your VIP Layer assistant. How can I help you analyze healthcare infrastructure gaps today?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isLoading, isOpen]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const contextSummary = `
        CURRENT_ENVIRONMENT_DATA:
        Active Hospitals: ${reports.length} facilities detected.
        Top Hospitals: ${reports.slice(0, 3).map(r => r.facilityName).join(', ')}.
        Critical Deserts: ${deserts.filter(d => d.severity > 85).length} regions requiring immediate intervention.
        Key Identified Gaps: ${Array.from(new Set(deserts.flatMap(d => d.primaryGaps))).slice(0, 5).join(', ')}.
      `;

      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: `
            You are the VIP Layer AI Assistant. You specialize in healthcare planning and medical desert analysis in Ghana.
            Your responses should be technical, strategic, and concise. 
            Use the following real-time data context to inform your answers:
            ${contextSummary}
            
            Always cite data points from the VIP network when relevant. Use Google Search grounding to find recent news or context about facility names mentioned.
          `,
        },
      });

      const response = await chat.sendMessage({ message: userMessage });
      const botText = response.text || "Connection refused by reasoning core.";
      
      setMessages(prev => [...prev, { role: 'model', text: botText }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'model', text: 'Logic Stream Error: Connection to inference core timed out.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[200]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.9, y: 30, filter: 'blur(10px)' }}
            className="absolute bottom-24 right-0 w-[90vw] sm:w-[480px] max-h-[calc(100vh-120px)] h-[680px] bg-[var(--sidebar-bg)] border border-white/20 rounded-[3rem] shadow-[0_20px_80px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden backdrop-blur-[40px] ring-1 ring-white/10"
          >
            <div className="p-7 border-b border-white/10 bg-gradient-to-r from-emerald-500/15 to-blue-500/5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/30 blur-xl rounded-xl animate-pulse"></div>
                  <div className="relative p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/40 text-emerald-500">
                    <Bot className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-black text-[var(--text-main)] tracking-tight uppercase flex items-center gap-2">
                    VIP CO-PILOT
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                    <span className="text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.2em]">Context Synced</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2.5 hover:bg-black/5 rounded-2xl text-slate-500 hover:text-[var(--text-main)] transition-all duration-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-7 space-y-8 custom-scrollbar bg-gradient-to-b from-transparent to-black/[0.02]">
              {messages.map((m, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={i} 
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[95%] flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-9 h-9 rounded-2xl flex-shrink-0 flex items-center justify-center border shadow-lg ${
                      m.role === 'user' 
                        ? 'bg-emerald-500 border-emerald-400 text-emerald-950' 
                        : 'bg-[var(--bg-deep)] border-white/20 text-slate-400'
                    }`}>
                      {m.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                    </div>
                    <div className={`p-6 rounded-[2rem] text-[13px] font-medium leading-[1.7] shadow-xl transition-all duration-500 ${
                      m.role === 'user' 
                        ? 'bg-emerald-500 text-emerald-950 border border-emerald-400 rounded-tr-none' 
                        : 'bg-white/[0.08] dark:bg-white/[0.04] text-[var(--text-main)] border border-white/20 rounded-tl-none overflow-x-auto shadow-inner'
                    }`}>
                      {m.role === 'model' ? <MarkdownRenderer content={m.text} /> : m.text}
                    </div>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-4">
                    <div className="w-9 h-9 rounded-2xl bg-black/5 border border-white/20 text-slate-400 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    </div>
                    <div className="p-5 px-8 rounded-3xl rounded-tl-none bg-white/[0.08] dark:bg-white/[0.04] border border-white/20 flex gap-2">
                      <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-emerald-500/60 rounded-full"></motion.span>
                      <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-emerald-500/60 rounded-full"></motion.span>
                      <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-emerald-500/60 rounded-full"></motion.span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-7 border-t border-white/10 bg-[var(--sidebar-bg)] flex-shrink-0">
              <div className="relative group">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Inquire from data nodes..."
                  className="w-full bg-black/5 border border-white/20 rounded-2xl py-6 pl-6 pr-16 text-xs focus:ring-1 focus:ring-emerald-500/40 focus:outline-none transition-all placeholder:text-slate-500 text-[var(--text-main)]"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-4 bg-emerald-500 text-emerald-950 rounded-xl disabled:opacity-20 transition-all hover:bg-emerald-400 active:scale-95 shadow-lg shadow-emerald-500/20"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-18 h-18 sm:w-20 sm:h-20 rounded-full shadow-[0_0_50px_rgba(16,185,129,0.3)] flex items-center justify-center transition-all duration-500 relative group overflow-hidden ${
          isOpen ? 'bg-[var(--bg-deep)] text-[var(--text-main)] border border-white/20' : 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-emerald-950'
        }`}
      >
        <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-ping opacity-20 pointer-events-none"></div>
        <motion.div 
           animate={{ rotate: 360 }}
           transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
           className="absolute inset-2 border border-dashed border-emerald-950/20 rounded-full pointer-events-none"
        ></motion.div>
        {isOpen ? <X className="w-8 h-8" /> : <MessageSquare className="w-8 h-8" />}
      </motion.button>
    </div>
  );
};

export default AIChatBot;
