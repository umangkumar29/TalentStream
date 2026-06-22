import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Target, 
  Zap, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  Search,
  Filter,
  Loader2,
  RefreshCw,
  UserCheck,
  Users,
  ExternalLink,
  Briefcase
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchJobs, fetchPMs, assignJobToPM, Job } from '../../app/services/api';

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
  in_review: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  closed: 'bg-white/5 text-white/50 border border-white/10',
};

const STATUS_LABEL: Record<string, string> = {
  open: 'OPEN',
  in_review: 'IN PROGRESS',
  closed: 'CLOSED',
};

const KPICard = ({ title, value, subtext, loading }: any) => (
  <motion.div
    whileHover={{ y: -2 }}
    className="bg-[#151b28] border border-white/5 rounded-2xl p-6 flex flex-col justify-center min-w-[200px]"
  >
    <h3 className="text-[11px] font-manrope text-talentstream-on-surface-variant uppercase tracking-wider font-bold mb-2 text-left">
      {title}
    </h3>
    <div className="flex items-end gap-3 justify-start">
      {loading ? (
        <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
      ) : (
        <h2 className="text-4xl font-manrope font-extrabold text-white tracking-tight">
          {value}
        </h2>
      )}
      {subtext && !loading && (
        <span className="text-sm font-medium text-talentstream-on-surface-variant mb-1.5">
          {subtext}
        </span>
      )}
    </div>
  </motion.div>
);

export const PMManagement: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [pms, setPms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [jobsData, pmsData] = await Promise.all([
        fetchJobs(),
        fetchPMs()
      ]);
      
      // Merge pm_name from pmsData into jobs list
      const jobsWithPM = jobsData.map(j => {
        const pm = pmsData.find(p => p.id === j.project_manager_id);
        return { ...j, pm_name: pm?.name || 'Unassigned' };
      });
      
      const pmsWithCount = pmsData.map(pm => ({
        ...pm,
        job_count: jobsData.filter(j => j.project_manager_id === pm.id).length
      }));
      
      setJobs(jobsWithPM);
      setPms(pmsWithCount);
    } catch {
      console.error('Failed to load mandates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssign = async (jobId: string, pmId: string) => {
    setIsAssigning(true);
    try {
      await assignJobToPM(jobId, pmId);
      setShowAssignModal(null);
      await loadData(); // Refresh
    } catch (err) {
      alert("Failed to assign PM");
    } finally {
      setIsAssigning(false);
    }
  };

  const filteredJobs = jobs.filter(j => {
    const matchesSearch = j.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (j.department || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || j.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-manrope font-extrabold tracking-tight text-white mb-1">
            Resource Command Center
          </h1>
          <p className="text-sm text-talentstream-on-surface-variant font-medium">
            Program Manager view: Mapping global mandates to Project Managers.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-talentstream-on-surface-variant" />
            <input 
              type="text" 
              placeholder="Search mandates..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#151b28] border border-white/5 rounded-full py-2.5 pl-10 pr-4 text-sm w-64 text-white focus:outline-none focus:border-talentstream-primary/50 transition-colors"
            />
          </div>
          <button 
            onClick={loadData}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => navigate('/pm/create')} className="px-6 py-2.5 rounded-full bg-talentstream-primary text-white hover:bg-talentstream-primary/90 transition-colors text-sm font-bold tracking-wide cursor-pointer">
            Create Mandate
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Sidebar: PM Network */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-[#151b28] border border-white/5 rounded-2xl p-6 h-full">
            <div className="flex items-center gap-2 mb-6 text-white font-manrope font-bold">
              <Users className="w-4 h-4 text-talentstream-primary" />
              <span>Project Managers</span>
            </div>
            
            <div className="space-y-4">
               {loading ? (
                 <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-white/20" /></div>
               ) : pms.map((pm) => (
                 <div key={pm.id} className="bg-white/5 border border-white/5 rounded-xl p-4 group hover:bg-white/[0.08] transition-all">
                    <div className="flex items-center gap-3 mb-3">
                       <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                         {pm.name.charAt(0)}
                       </div>
                       <div className="min-w-0">
                          <h4 className="text-sm font-bold text-white truncate">{pm.name}</h4>
                          <p className="text-[10px] text-talentstream-on-surface-variant truncate">{pm.email}</p>
                       </div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-talentstream-on-surface-variant">
                       <span>{pm.job_count} Active Mandates</span>
                       <Briefcase className="w-3 h-3 group-hover:text-talentstream-primary transition-colors" />
                    </div>
                 </div>
               ))}
               {!loading && pms.length === 0 && (
                 <div className="text-center py-12 text-[10px] text-white/20 font-bold uppercase tracking-widest">No Project Managers found.</div>
               )}
            </div>

            <button className="w-full mt-6 py-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-[10px] font-bold text-white uppercase tracking-widest transition-colors">
              Add Project Manager +
            </button>
          </div>
        </div>

        {/* Main Content: Mandate Management */}
        <div className="xl:col-span-3 space-y-6">
          
          <div className="flex justify-between items-center gap-4">
             <div className="flex gap-2 bg-[#151b28] p-1 rounded-xl border border-white/5">
                {['all', 'open', 'in_review', 'closed'].map(s => (
                  <button 
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-all ${
                      statusFilter === s 
                        ? 'bg-talentstream-primary text-white' 
                        : 'text-white/40 hover:text-white'
                    }`}
                  >
                    {s === 'all' ? 'All' : s.replace('_', ' ')}
                  </button>
                ))}
             </div>
             <div className="flex gap-4">
                <KPICard title="Total Jobs" value={jobs.length} loading={loading} />
             </div>
          </div>

          <div className="bg-[#151b28] border border-white/5 rounded-[2rem] p-6">
            <div className="grid grid-cols-12 text-[10px] font-bold text-talentstream-on-surface-variant uppercase tracking-[0.2em] mb-6 pb-4 border-b border-white/5 px-4">
              <div className="col-span-1">ID</div>
              <div className="col-span-4">Mandate / Role</div>
              <div className="col-span-3 text-center">Assigned PM</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-2 text-right pr-4">Actions</div>
            </div>

            <div className="space-y-2">
               {loading ? (
                 <div className="flex justify-center py-24"><Loader2 className="w-10 h-10 animate-spin text-white/10" /></div>
               ) : filteredJobs.map((jd, i) => (
                 <motion.div 
                   key={jd.id}
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: i * 0.05 }}
                   className="grid grid-cols-12 items-center p-4 rounded-2xl bg-[#0a0e17]/40 hover:bg-white/[0.03] transition-all border border-transparent hover:border-white/5 group"
                 >
                    <div className="col-span-1 text-[11px] font-mono text-white/30 group-hover:text-white/60 transition-colors">#TS-{jd.id.slice(0,4)}</div>
                    <div className="col-span-4 pr-4">
                       <h3 className="text-sm font-bold text-white mb-0.5 truncate group-hover:text-talentstream-primary transition-colors">{jd.title}</h3>
                       <p className="text-[10px] text-talentstream-on-surface-variant font-bold uppercase tracking-widest">{jd.department} • {jd.role_category}</p>
                    </div>
                    <div className="col-span-3">
                       <div className="flex flex-col items-center">
                          {jd.pm_name === 'Unassigned' ? (
                            <button 
                              onClick={() => setShowAssignModal(jd.id)}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 text-[10px] font-bold tracking-widest border border-rose-500/20 hover:bg-rose-500/20 transition-all uppercase"
                            >
                               <UserCheck className="w-3 h-3" /> Assign PM
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold tracking-widest border border-emerald-500/20 uppercase">
                               <CheckCircle2 className="w-3 h-3" /> {jd.pm_name}
                            </div>
                          )}
                          <button 
                            onClick={() => setShowAssignModal(jd.id)}
                            className="text-[9px] text-white/30 hover:text-white mt-1 uppercase font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Change Assignment
                          </button>
                       </div>
                    </div>
                    <div className="col-span-2 flex justify-center">
                       <span className={`text-[9px] font-black px-3 py-1.5 rounded-lg tracking-widest uppercase ${STATUS_STYLES[jd.status] || STATUS_STYLES.open}`}>
                         {STATUS_LABEL[jd.status] || 'OPEN'}
                       </span>
                    </div>
                    <div className="col-span-2 flex justify-end pr-2 gap-2 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                       <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/5 transition-all">
                          <ExternalLink className="w-4 h-4" />
                       </button>
                       <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-talentstream-primary/20 hover:bg-talentstream-primary text-talentstream-primary hover:text-white border border-talentstream-primary/30 transition-all">
                          <Target className="w-4 h-4" />
                       </button>
                    </div>
                 </motion.div>
               ))}
               {!loading && filteredJobs.length === 0 && (
                 <div className="text-center py-24 text-white/20 font-manrope font-black uppercase tracking-[0.5em]">No Data Found</div>
               )}
            </div>
          </div>
        </div>

      </div>

      {/* Assignment Modal Overlay */}
      <AnimatePresence>
        {showAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowAssignModal(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#151b28] border border-white/10 rounded-[2.5rem] p-10 overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-talentstream-primary/10 rounded-bl-full -z-10 blur-2xl" />
              
              <h2 className="text-3xl font-manrope font-black text-white mb-2 tracking-tight">Assign Project Manager</h2>
              <p className="text-sm text-talentstream-on-surface-variant mb-8 font-medium">Select a tactical lead to execute this talent mandate.</p>
              
              <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                 {pms.map(pm => (
                   <button 
                     key={pm.id}
                     disabled={isAssigning}
                     onClick={() => handleAssign(showAssignModal, pm.id)}
                     className="w-full text-left p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-talentstream-primary/50 hover:bg-white/10 transition-all flex items-center justify-between group disabled:opacity-50"
                   >
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-black text-lg group-hover:scale-110 transition-transform">
                           {pm.name.charAt(0)}
                        </div>
                        <div>
                           <h4 className="font-bold text-white group-hover:text-talentstream-primary transition-colors">{pm.name}</h4>
                           <p className="text-xs text-talentstream-on-surface-variant font-medium">{pm.job_count} current mandates</p>
                        </div>
                     </div>
                     <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white transition-colors" />
                   </button>
                 ))}
                 
                 <button 
                   onClick={() => handleAssign(showAssignModal, '')}
                   className="w-full p-4 rounded-xl border border-white/5 text-xs font-bold text-white/40 hover:text-white transition-colors"
                 >
                   Unassign Mandate
                 </button>
              </div>

              <div className="mt-8 flex justify-center">
                 <button 
                   onClick={() => setShowAssignModal(null)}
                   className="text-[10px] font-black text-white/40 hover:text-white uppercase tracking-[0.4em] transition-all"
                 >
                   Dismiss Overlay
                 </button>
              </div>

              {isAssigning && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                   <Loader2 className="w-12 h-12 text-talentstream-primary animate-spin" />
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CheckCircle2 = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
