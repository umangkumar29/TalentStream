import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Video, 
  Users, 
  MoreVertical, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Search,
  Bell,
  Settings,
  Workflow,
  Zap,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';

const interviews = [
  { id: 1, name: 'Siddharth Varma', role: 'Staff LLM Engineer', time: '10:00 AM - 11:30 AM', date: 'Oct 24', status: 'Upcoming', type: 'Virtual', recruiter: 'Sarah Sterling' },
  { id: 2, name: 'Amara Okafor', role: 'Principal ML Arch', time: '01:00 PM - 02:30 PM', date: 'Oct 24', status: 'Tentative', type: 'In-office', recruiter: 'Marcus Thorne' },
  { id: 3, name: 'Lena Schmidt', role: 'Lead AI Engineer', time: '04:30 PM - 06:00 PM', date: 'Oct 25', status: 'Confirmed', type: 'Virtual', recruiter: 'Sarah Sterling' },
];

export const TalentStreamScheduleInterview: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState('Oct 24');

  return (
    <div className="space-y-16 p-8 pb-32 relative min-h-screen">
      <div className="atmosphere" />
      
      {/* Dynamic Background Orbs */}
      <div className="absolute top-20 right-10 w-96 h-96 bg-talentstream-primary/5 blur-[150px] rounded-full animate-pulse-subtle" />
      <div className="absolute bottom-40 left-10 w-[600px] h-[600px] bg-talentstream-tertiary/5 blur-[180px] rounded-full animate-pulse-subtle" />
      
      {/* Search and User Identity Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex-1 max-w-xl relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] group-focus-within:text-[#6366F1] transition-colors" />
          <input 
            type="text" 
            placeholder="Search interviews or candidates..." 
            className="w-full pl-12 pr-4 py-3 bg-[#151B28] border border-[#1E2533] rounded-2xl text-[13px] font-semibold text-white placeholder:text-[#64748B] focus:outline-none focus:border-[#6366F1] transition-all"
          />
        </div>
        <div className="flex items-center gap-6">
           <div className="flex gap-4">
              <Zap className="w-5 h-5 text-[#6366F1] animate-pulse" />
              <div className="relative group cursor-pointer">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 absolute top-0 right-0 border-2 border-[#0A0E17]" />
                 <Workflow className="w-5 h-5 text-[#94A3B8] group-hover:text-white transition-all" />
              </div>
           </div>
           <div className="w-10 h-10 rounded-full bg-[#1E2533] border border-[#1E2533] overflow-hidden cursor-pointer hover:border-[#6366F1] transition-all shadow-xl">
              <img src="https://api.dicebear.com/7.x/shapes/svg?seed=Interview" alt="Interview" className="w-full h-full object-cover" />
           </div>
        </div>
      </div>

      {/* Main Header Information */}
      <div className="flex items-end justify-between mb-10">
         <div className="space-y-4 text-left">
            <p className="text-[10px] font-manrope font-black uppercase tracking-[0.4em] text-[#6366F1]">Operational Logistics</p>
            <h2 className="text-5xl font-manrope font-extrabold text-white tracking-tighter">Interview Matrix</h2>
            <p className="text-[#94A3B8] font-medium text-base opacity-70 max-w-2xl leading-relaxed">
              Orchestrate technical evaluations and leadership alignment sessions for shortlisted high-fidelity candidates.
            </p>
         </div>
         <button className="flex items-center gap-4 px-10 py-5 bg-gradient-to-r from-[#6366F1] to-[#4F46E5] rounded-[2rem] text-white font-manrope font-black text-sm shadow-xl shadow-indigo-500/20 hover:scale-[1.02] transition-all">
            <Plus className="w-5 h-5" /> Schedule Session
         </button>
      </div>

      <div className="grid grid-cols-12 gap-10">
        
        {/* Calendar View Column */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
           <div className="bg-[#151B28] border border-[#1E2533] p-10 rounded-[3rem] shadow-2xl overflow-hidden relative group">
              <div className="flex items-center justify-between mb-10 border-b border-[#1E2533] pb-8">
                 <div className="flex items-center gap-6">
                    <button className="p-3 bg-[#1E2533] border border-[#1E2533] rounded-xl text-[#64748B] hover:text-white transition-all"><ChevronLeft className="w-5 h-5" /></button>
                    <h3 className="text-2xl font-manrope font-black text-white tracking-tight italic">October 2024</h3>
                    <button className="p-3 bg-[#1E2533] border border-[#1E2533] rounded-xl text-[#64748B] hover:text-white transition-all"><ChevronRight className="w-5 h-5" /></button>
                 </div>
                 <div className="flex gap-4">
                    <button className="text-[12px] font-bold text-[#64748B] hover:text-white px-4">WEEK</button>
                    <button className="text-[12px] font-black text-white px-4 border-b-2 border-[#6366F1] pb-1">MONTH</button>
                    <button className="text-[12px] font-bold text-[#64748B] hover:text-white px-4">YEAR</button>
                 </div>
              </div>

              <div className="grid grid-cols-7 gap-4 text-center text-[11px] font-black tracking-widest text-[#64748B] mb-8 grayscale opacity-40">
                 {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => <div key={day}>{day}</div>)}
              </div>

              <div className="grid grid-cols-7 gap-6">
                 {Array.from({ length: 31 }).map((_, i) => (
                   <div key={i} className={`aspect-square rounded-[1.5rem] border flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 group relative
                     ${(i + 1) === 24 ? 'bg-[#1E2533] border-[#6366F1] shadow-glow-blue' : 'bg-[#0A0E17]/40 border-[#1E2533] hover:border-[#6366F1]/30 hover:bg-[#1E2533]/20'}`}>
                      <span className={`text-base font-manrope font-black ${(i + 1) === 24 ? 'text-white' : 'text-[#64748B]'}`}>{i + 1}</span>
                      {(i + 1) === 24 && <div className="absolute top-2 right-2 flex gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-glow-emerald" /><div className="w-1.5 h-1.5 rounded-full bg-indigo-400" /></div>}
                      {((i + 1) === 25 || (i + 1) === 12) && <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-indigo-400 opacity-40" />}
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Sessions Sidebar Column */}
        <div className="col-span-12 lg:col-span-4 space-y-8 flex flex-col">
           <div className="bg-[#151B28] p-10 rounded-[3rem] border border-[#1E2533] shadow-2xl flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-10">
                 <h3 className="text-xl font-manrope font-black text-white tracking-tight">Active Sessions</h3>
                 <span className="text-[11px] font-black text-[#64748B] uppercase tracking-[0.2em]">{selectedDate}</span>
              </div>

              <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {interviews.map((item, i) => (
                    <motion.div 
                      key={item.id} 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-6 bg-[#0A0E17]/60 border border-white/5 rounded-[2.5rem] hover:border-talentstream-primary/40 transition-all group cursor-pointer relative overflow-hidden shadow-2xl hover:bg-white/[0.02]"
                    >
                       {item.status === 'Confirmed' && (
                         <div className="absolute -top-12 -right-12 w-24 h-24 bg-emerald-500/10 blur-3xl rounded-full group-hover:bg-emerald-500/20 transition-colors" />
                       )}
                       
                       <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-6">
                          <div className="space-y-1">
                             <h4 className="text-[16px] font-manrope font-black text-white group-hover:text-talentstream-primary transition-all tracking-tight">{item.name}</h4>
                             <p className="text-[11px] text-[#64748B] font-black uppercase tracking-widest opacity-60">{item.role}</p>
                          </div>
                          <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.3em]
                            ${item.status === 'Confirmed' ? 'bg-[#10B981]/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : item.status === 'Tentative' ? 'bg-[#FBBF24]/10 text-amber-500 border border-amber-500/20' : 'bg-[#1E2533] text-[#94A3B8] border border-white/5'}`}>
                             {item.status}
                          </div>
                       </div>
                       
                       <div className="space-y-4 pt-2">
                          <div className="flex items-center gap-4 text-[12px] font-bold text-[#94A3B8]">
                             <div className="w-8 h-8 rounded-lg bg-[#151B28] flex items-center justify-center border border-white/5">
                                <Clock className="w-4 h-4 text-talentstream-primary" />
                             </div>
                             {item.time}
                          </div>
                          <div className="flex items-center gap-4 text-[12px] font-bold text-[#94A3B8]">
                             <div className="w-8 h-8 rounded-lg bg-[#151B28] flex items-center justify-center border border-white/5">
                                <Video className="w-4 h-4 text-talentstream-primary" />
                             </div>
                             {item.type} Eval via <span className="text-white ml-1">Zoom Core</span>
                          </div>
                       </div>
                    </motion.div>
                  ))}
              </div>

              <div className="mt-10 pt-8 border-t border-[#1E2533] space-y-6">
                 <div className="p-6 bg-[#10B981]/5 border border-[#10B981]/20 rounded-2xl flex items-center gap-5">
                    <div className="w-10 h-10 bg-[#0A0E17] rounded-xl flex items-center justify-center text-emerald-500 shadow-glow-emerald">
                       <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                       <p className="text-[12px] font-bold text-white tracking-tight">Recruiter Match</p>
                       <p className="text-[10px] text-emerald-500/60 uppercase font-black tracking-widest">Global Calibration 92%</p>
                    </div>
                 </div>
                 <button className="w-full text-center text-[10px] font-manrope font-black text-[#64748B] uppercase tracking-[0.4em] hover:text-white transition-all">VIEW FULL AGENDA</button>
              </div>
           </div>
        </div>

      </div>

    </div>
  );
};
