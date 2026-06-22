import React, { useState } from 'react';
import { 
  FileText, UserPlus, Trash2, Key, Zap, 
  Search, Filter, Download,
  ChevronLeft, ChevronRight, CheckCircle, 
  Radio, Globe, Server, Activity
} from 'lucide-react';
import { AuditLog } from './types';

interface AdminAuditLogsProps {
  logs?: AuditLog[];
  totalActions?: string;
  trend?: string;
  isLive?: boolean;
}

const DEFAULT_LOGS: AuditLog[] = [
  { id: '1', action: 'JD Created', user: { name: 'Elena Sterling' }, timestamp: '2023-11-24 14:22:10', details: 'JD123: Sr. AI Architect', status: 'success', icon: FileText },
  { id: '2', action: 'User Assigned', user: { name: 'Alex Marcus' }, timestamp: '2023-11-24 13:45:02', details: 'PM1: Tech Lead - Retail', status: 'success', icon: UserPlus },
  { id: '3', action: 'Profile Deleted', user: { name: 'System (Auto)' }, timestamp: '2023-11-24 12:10:55', details: 'USR_992 (GDPR Purge)', status: 'success', icon: Trash2 },
  { id: '4', action: 'Password Reset', user: { name: 'David Wu' }, timestamp: '2023-11-24 11:30:41', details: 'Self-service reset', status: 'success', icon: Key },
  { id: '5', action: 'AI Rank Updated', user: { name: 'Aether Engine' }, timestamp: '2023-11-24 10:05:12', details: 'BATCH_77: Rescoring complete', status: 'success', icon: Zap }
];

const AdminAuditLogs: React.FC<AdminAuditLogsProps> = ({
  logs = DEFAULT_LOGS,
  totalActions = '1,284',
  trend = '+12%',
  isLive = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-10 space-y-12 animate-in fade-in slide-in-from-top-4 duration-1000">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-5xl font-black text-white tracking-tighter mb-3 uppercase">Security Audit Ledger</h1>
          <p className="text-slate-500 max-w-2xl text-xl font-medium leading-relaxed opacity-80">
            Real-time oversight of system-wide administrative actions and security events. Authenticate and monitor every identity interaction.
          </p>
        </div>
        <div className="flex items-center gap-4">
           <button className="flex items-center gap-3 bg-slate-900/60 hover:bg-slate-800 text-slate-300 px-8 py-4 rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.2em] transition-all border border-white/5 shadow-2xl active:scale-95 group">
             <Filter size={18} className="group-hover:rotate-12 transition-transform" />
             Granular Filter
           </button>
           <button className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.2em] transition-all shadow-[0_20px_40px_rgba(79,70,229,0.3)] active:scale-95 group overflow-hidden relative">
             <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
             <Download size={18} className="relative z-10" />
             <span className="relative z-10">Export Vault</span>
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 p-10 rounded-[2.5rem] group relative overflow-hidden shadow-2xl ring-1 ring-white/[0.02]">
             <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500/40" />
             <div className="text-slate-500 uppercase tracking-[0.3em] text-[10px] font-black mb-4 opacity-70">Total System Actions (24H)</div>
             <div className="text-6xl font-black text-white tracking-tighter mb-8 flex items-baseline gap-4 group-hover:scale-105 transition-transform duration-700">
                {totalActions}
                <span className="text-emerald-400 text-sm font-black flex items-center gap-1 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  <ArrowUpRight size={16} /> {trend}
                </span>
             </div>
             <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black tracking-widest text-slate-600 opacity-60 uppercase">
                   <span>Throughput</span>
                   <span>{trend.includes('+') ? 'EXCEEDING' : 'STABLE'}</span>
                </div>
                <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden shadow-inner border border-white/5 p-0.5">
                   <div className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-1000 w-[72%] group-hover:w-[78%]" />
                </div>
             </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 p-10 rounded-[2.5rem] flex items-center gap-10 shadow-2xl relative group ring-1 ring-white/[0.02]">
             <div className="w-24 h-24 rounded-[2rem] border-4 border-emerald-500/10 flex items-center justify-center relative bg-emerald-500/[0.02] shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-transform duration-700 group-hover:rotate-12">
                <CheckCircle size={48} className="text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <div className="absolute inset-2 border border-emerald-500/20 rounded-[1.5rem] animate-ping opacity-20" />
             </div>
             <div className="flex-1">
                <div className="text-emerald-400 font-black text-xl mb-3 tracking-tight uppercase group-hover:translate-x-1 transition-transform">Perfect Health</div>
                <p className="text-slate-500 text-sm font-medium leading-relaxed opacity-80">AI policy enforcement operating at nominal parameters. No cryptographic anomalies detected in ingress traffic.</p>
             </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group ring-1 ring-white/[0.02] hidden lg:block">
            <div className="flex items-center justify-between mb-8">
               <div className="text-slate-500 uppercase tracking-[0.3em] text-[10px] font-black opacity-70">Infrastructure Nodes</div>
               <Activity size={18} className="text-indigo-400 animate-pulse" />
            </div>
            <div className="flex gap-4">
               {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex-1 bg-black/30 border border-white/5 rounded-2xl p-4 transition-all hover:bg-white/[0.02] hover:scale-105 cursor-default">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center mb-3">
                       {i === 0 ? <Globe size={14} className="text-blue-400" /> : <Server size={14} className="text-indigo-400" />}
                    </div>
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-tighter mb-1">NODE_{i+1}</div>
                    <div className="text-xs font-bold text-white uppercase font-mono">ACTIVE</div>
                  </div>
               ))}
            </div>
        </div>
      </div>

      <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.6)] ring-1 ring-white/[0.02]">
        <div className="p-10 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="relative w-full md:w-[32rem]">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 transition-colors group-focus-within:text-indigo-400" size={22} />
              <input 
                type="text"
                placeholder="Query system ledger..."
                className="w-full bg-black/50 border border-white/5 rounded-2xl py-5 pl-16 pr-8 text-white text-sm font-bold placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner uppercase tracking-wider"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           {isLive && (
             <div className="flex items-center gap-4 text-emerald-400 font-black text-[10px] tracking-[0.3em] animate-pulse bg-emerald-500/5 px-6 py-3 rounded-full ring-1 ring-emerald-500/30 shadow-2xl">
                <Radio size={14} className="fill-current" />
                LIVE AUDIT STREAM SYNCHRONIZED
             </div>
           )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-slate-500 text-[10px] font-black uppercase tracking-[0.25em] bg-white/[0.01]">
                <th className="px-12 py-8">Action Protocol</th>
                <th className="px-12 py-8">Identity Agent</th>
                <th className="px-12 py-8">Temporal Sync</th>
                <th className="px-12 py-8">Metadata details</th>
                <th className="px-12 py-8 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="group hover:bg-indigo-500/[0.02] transition-colors duration-500 cursor-default">
                  <td className="px-12 py-10">
                    <div className="flex items-center gap-6">
                      <div className="p-4 bg-slate-800/80 text-indigo-400 rounded-2xl border border-white/10 shadow-inner group-hover:scale-110 group-hover:rotate-2 transition-all duration-500 shadow-2xl">
                        <log.icon size={24} strokeWidth={2.5} />
                      </div>
                      <span className="text-white font-black tracking-tight text-xl uppercase group-hover:text-indigo-400 transition-colors">{log.action}</span>
                    </div>
                  </td>
                  <td className="px-12 py-10">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-700/5 border border-emerald-500/20 flex items-center justify-center text-sm text-emerald-400 font-black shadow-lg shadow-emerald-500/5 group-hover:rotate-6 transition-transform">
                        {log.user.name.charAt(0)}
                      </div>
                      <span className="text-slate-400 font-bold tracking-tight text-lg opacity-90">{log.user.name}</span>
                    </div>
                  </td>
                  <td className="px-12 py-10">
                    <div className="flex flex-col gap-1">
                      <span className="text-white font-mono font-bold text-sm tracking-tighter opacity-80">{log.timestamp.split(' ')[0]}</span>
                      <span className="text-slate-600 font-mono text-xs font-black uppercase tracking-widest">{log.timestamp.split(' ')[1]}</span>
                    </div>
                  </td>
                  <td className="px-12 py-10">
                    <code className="px-5 py-2.5 bg-black/40 text-indigo-400 rounded-xl text-xs font-mono font-bold border border-white/5 shadow-inner tracking-tight group-hover:border-indigo-500/30 transition-all">
                      {log.details}
                    </code>
                  </td>
                  <td className="px-12 py-10 text-right">
                    <span className="px-6 py-2.5 rounded-xl bg-emerald-500/5 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                      VERIFIED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-10 border-t border-white/5 bg-black/20 flex items-center justify-between">
           <span className="text-[10px] text-slate-600 font-black tracking-[0.2em] uppercase opacity-60">Displaying entries 1-5 of {totalActions} across secure ledger</span>
           <div className="flex items-center gap-4">
              <button className="p-4 text-slate-600 hover:text-white transition-all hover:bg-white/5 rounded-2xl"><ChevronLeft size={24} /></button>
              <div className="flex items-center gap-3">
                <button className="w-12 h-12 bg-indigo-600 text-white rounded-2xl font-black text-xs shadow-[0_10px_20px_rgba(79,70,229,0.3)] border border-indigo-400/20">01</button>
                <button className="w-12 h-12 bg-slate-800/40 text-slate-500 rounded-2xl hover:text-white hover:bg-slate-700/60 transition-all font-black text-xs border border-white/5">02</button>
                <button className="w-12 h-12 bg-slate-800/40 text-slate-500 rounded-2xl hover:text-white hover:bg-slate-700/60 transition-all font-black text-xs border border-white/5">03</button>
              </div>
              <button className="p-4 text-slate-600 hover:text-white transition-all hover:bg-white/5 rounded-2xl"><ChevronRight size={24} /></button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAuditLogs;

const ArrowUpRight: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M7 17L17 7" />
    <polyline points="7 7 17 7 17 17" />
  </svg>
);
