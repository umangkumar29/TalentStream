import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, 
  Users, 
  Search,
  Upload,
  Loader2,
  Trash2,
  Edit2,
  Filter,
  Eye,
  ArrowRight,
  TrendingUp,
  X,
  Calendar,
  Clock
} from 'lucide-react';
import { 
  fetchJobs, 
  uploadJD, 
  JobRequest, 
  deleteJob,
  updateJob,
  createJob,
  fetchPMInterviews,
  fetchPMMatches
} from '../../app/services/api';
import { useAuth } from '../../app/services/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';

const ModernSelect = ({ label, options, value, onChange }: { label: string, options: string[], value: string, onChange: (v: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-2 group relative" ref={containerRef}>
      <span className="text-[10px] font-bold text-slate-500 dark:text-talentstream-on-surface-variant tracking-widest uppercase">{label}</span>
      <div className="relative">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 bg-white dark:bg-[#1a212e] border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 dark:text-white transition-all min-w-[120px] justify-between shadow-lg dark:shadow-xl ${isOpen ? 'ring-2 ring-talentstream-primary/20 border-talentstream-primary/30' : ''}`}
        >
          {value}
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
             <svg className="w-3 h-3 text-slate-400 dark:text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
             </svg>
          </motion.div>
        </button>
        
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 5, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-[#1a212e] border border-slate-200 dark:border-white/10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[100] backdrop-blur-xl"
            >
              <div className="py-1">
                {options.map((option) => (
                   <button
                    key={option}
                    onClick={() => {
                      onChange(option);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors ${value === option ? 'bg-talentstream-primary text-white' : 'text-slate-600 dark:text-white/70 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const JDViewModal = ({ isOpen, onClose, job }: { isOpen: boolean, onClose: () => void, job: JobRequest | null }) => {
  if (!isOpen || !job) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
       <motion.div 
         initial={{ scale: 0.95, opacity: 0, y: 20 }}
         animate={{ scale: 1, opacity: 1, y: 0 }}
         exit={{ scale: 0.95, opacity: 0, y: 20 }}
         className="bg-white dark:bg-[#151b28] border border-slate-200 dark:border-white/10 w-full max-w-4xl max-h-[85vh] rounded-[32px] overflow-hidden shadow-2xl flex flex-col"
       >
          <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/[0.02]">
             <div>
                <div className="text-[10px] font-black text-talentstream-primary uppercase tracking-[0.2em] mb-1">Job Details</div>
                <h3 className="text-2xl font-manrope font-extrabold text-slate-900 dark:text-white">{job.title}</h3>
             </div>
             <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-white/40 transition-all">
                <X className="w-6 h-6" />
             </button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white dark:bg-transparent">
             <div className="prose prose-slate dark:prose-invert max-w-none">
                <div className="flex gap-4 mb-8">
                   <div className="px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5" /> {(job as any).department || 'General'}
                   </div>
                </div>
                <div className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap font-medium leading-relaxed">
                   {(job as any).description || "No detailed description available."}
                </div>
             </div>
          </div>
          <div className="p-8 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex justify-end">
             <button onClick={onClose} className="px-8 py-3 rounded-2xl bg-talentstream-primary text-white font-bold shadow-lg shadow-talentstream-primary/30 hover:scale-[1.02] active:scale-95 transition-all">
                Dismiss
             </button>
          </div>
       </motion.div>
    </div>
  );
};

export const PMDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobRequest[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const [statusFilter, setStatusFilter] = useState('All Active');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');

  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, id: string, title: string}>({isOpen: false, id: '', title: ''});
  const [editModal, setEditModal] = useState<{isOpen: boolean, job: JobRequest | null}>({isOpen: false, job: null});
  const [jdViewModal, setJdViewModal] = useState<{isOpen: boolean, job: JobRequest | null}>({isOpen: false, job: null});

  const loadData = async () => {
    try {
      const [jobsData, interviewData, matchData] = await Promise.all([
        fetchJobs(),
        fetchPMInterviews(),
        fetchPMMatches()
      ]);
      setJobs(jobsData);
      setInterviews(interviewData);
      setMatches(matchData);
    } catch (error) {
      console.error('Failed to load PM mandates', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
     try {
       await deleteJob(deleteModal.id);
       await loadData();
     } catch (err) {
       console.error('Deletion failed', err);
     } finally {
       setDeleteModal({isOpen: false, id: '', title: ''});
     }
  };

  const handleJDUIUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const extractedData = await uploadJD(file);
      if (extractedData) {
        await createJob({
          title: extractedData.title,
          description: extractedData.description,
          role_category: extractedData.role_category,
          department: "Engineering"
        });
      }
      await loadData();
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-talentstream-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto py-8">
      {/* Refined Header */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-manrope font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
             Project <span className="text-talentstream-primary">Dashboard</span>
          </h1>
          <p className="text-slate-500 dark:text-talentstream-on-surface-variant text-sm mt-1 font-medium">
             Active Job Descriptions and matching candidates for your projects.
          </p>
        </div>
        <div className="flex gap-4">
           <input 
             type="file" 
             ref={fileInputRef} 
             className="hidden" 
             accept=".pdf" 
             onChange={handleJDUIUpload} 
           />
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-talentstream-primary text-white font-bold shadow-lg shadow-talentstream-primary/25 hover:shadow-talentstream-primary/40 hover:scale-[1.02] active:scale-95 transition-all text-sm"
           >
              <Upload className="w-4 h-4" /> Import JD (PDF)
           </button>
         </div>
      </div>
      
      {/* Reminders Section */}
      <AnimatePresence>
        {interviews.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
          >
            {interviews.map((interview) => (
              <div 
                key={interview.id}
                className="bg-white dark:bg-[#1a2235] border border-indigo-500/10 dark:border-indigo-500/20 rounded-[24px] p-5 flex items-start gap-4 shadow-xl hover:shadow-indigo-500/5 transition-all group relative overflow-hidden"
              >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform" />
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                       <Clock className="w-3 h-3" /> Upcoming Interview
                    </div>
                    <div className="text-sm font-black text-slate-800 dark:text-white truncate mb-1">{interview.candidate_name}</div>
                    <div className="text-[11px] font-bold text-slate-500 dark:text-white/40 truncate mb-3">{interview.job_title}</div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-lg text-[10px] font-black text-slate-600 dark:text-white/60 uppercase">
                       {new Date(interview.l1_date || interview.l2_date).toLocaleString('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Jobs Table Only - Stat Cards Removed for Focus */}
      <div className="bg-white dark:bg-[#151b28] border border-slate-200 dark:border-white/5 rounded-[32px] overflow-hidden shadow-2xl">
         <div className="p-8 border-b border-slate-100 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50 dark:bg-white/[0.01]">
            <div className="flex items-center gap-8">
               <ModernSelect 
                 label="Filters" 
                 options={['All Active', 'Indexing', 'Open', 'Closed']} 
                 value={statusFilter}
                 onChange={setStatusFilter}
               />
               <ModernSelect 
                 label="Department" 
                 options={['All Categories', 'Engineering', 'Product', 'Design', 'Marketing']} 
                 value={categoryFilter}
                 onChange={setCategoryFilter}
               />
             </div>
             <div className="flex gap-4">
               <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/20 group-focus-within:text-talentstream-primary transition-colors" />
                  <input 
                    placeholder="Search jobs..."
                    className="bg-white dark:bg-[#1a212e] border border-slate-200 dark:border-white/5 rounded-2xl pl-12 pr-4 py-3 text-xs text-slate-900 dark:text-white focus:border-talentstream-primary/50 focus:ring-4 focus:ring-talentstream-primary/5 outline-none w-80 transition-all font-medium shadow-sm dark:shadow-none"
                  />
               </div>
               <button className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white dark:bg-[#1a212e] border border-slate-200 dark:border-white/5 hover:border-talentstream-primary/50 transition-all text-slate-400 dark:text-white/40 shadow-sm dark:shadow-xl group">
                  <Filter className="w-5 h-5 group-hover:text-talentstream-primary" />
               </button>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-black/20">
                     <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-talentstream-on-surface-variant uppercase tracking-[0.2em]">Job Details</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-talentstream-on-surface-variant uppercase tracking-[0.2em]">Department</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-talentstream-on-surface-variant uppercase tracking-[0.2em] text-center">Lifecycle</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-talentstream-on-surface-variant uppercase tracking-[0.2em] text-right">Strategic Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                  {jobs.filter(j => {
                     const sMatch = statusFilter === 'All Active' || j.status.toLowerCase() === statusFilter.toLowerCase();
                     const cMatch = categoryFilter === 'All Categories' || j.department === categoryFilter;
                     return sMatch && cMatch;
                  }).map((job) => (
                     <motion.tr 
                       key={job.id}
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                       className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group cursor-default"
                     >
                        <td className="px-8 py-8">
                           <div className="text-[10px] font-bold text-talentstream-primary/60 dark:text-talentstream-primary/40 mb-1 tracking-[0.1em]">JD-{job.id.substring(0,6).toUpperCase()}</div>
                           <div className="text-base font-black text-slate-900 dark:text-white group-hover:text-talentstream-primary transition-colors flex items-center gap-2">
                              {job.title}
                              <button 
                                onClick={() => setJdViewModal({isOpen: true, job})}
                                className="p-1 px-2 rounded-lg bg-slate-100 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-all text-slate-400 hover:text-talentstream-primary"
                                title="View Job Description"
                              >
                                 <Eye className="w-3.5 h-3.5" />
                              </button>
                           </div>
                        </td>
                         <td className="px-8 py-8 text-sm text-slate-500 dark:text-slate-400 font-bold">
                            {job.department || "General"}
                         </td>
                        <td className="px-8 flex justify-center py-8">
                           <div className="flex justify-center items-center h-full">
                              <span className={`px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border shadow-sm
                                 ${job.status === 'open' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 
                                   job.status === 'indexing' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' : 
                                   'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/50 border-slate-200 dark:border-white/10'}`}
                              >
                                 {job.status}
                              </span>
                           </div>
                        </td>
                        <td className="px-8 py-8">
                           <div className="flex justify-end gap-3 translate-x-2 group-hover:translate-x-0 transition-transform duration-300">
                               {(() => {
                                  const matchCount = matches.filter(m => String(m.job_id) === String(job.id)).length;
                                  return (
                                    <button 
                                      onClick={() => navigate('/pm/talent-pool', { state: { jobId: job.id, jobTitle: job.title } })}
                                      disabled={matchCount === 0}
                                      className={`flex items-center gap-2 px-6 py-2.5 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md ${
                                        matchCount > 0
                                          ? 'bg-talentstream-primary/10 border-talentstream-primary/20 text-talentstream-primary hover:bg-talentstream-primary hover:text-white hover:shadow-talentstream-primary/20 cursor-pointer'
                                          : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/20 cursor-not-allowed'
                                      }`}
                                    >
                                       Matched Candidates ({matchCount}) <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                  );
                               })()}
                              
                              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                   onClick={() => navigate(`/pm/jd-architect/${job.id}`)}
                                   className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/30 hover:border-talentstream-primary/30 hover:text-talentstream-primary transition-all"
                                   title="Edit Job Description"
                                >
                                   <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                   onClick={() => setDeleteModal({isOpen: true, id: job.id, title: job.title})}
                                   className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/30 hover:border-rose-500/30 hover:text-rose-500 transition-all"
                                   title="Delete Job"
                                >
                                   <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                           </div>
                        </td>
                     </motion.tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* JD View Modal */}
      <AnimatePresence>
        {jdViewModal.isOpen && (
          <JDViewModal 
            isOpen={jdViewModal.isOpen} 
            onClose={() => setJdViewModal({isOpen: false, job: null})} 
            job={jdViewModal.job} 
          />
        )}
      </AnimatePresence>

      {/* Selection & Modal Overlays (Consistent with existing logic but refined) */}
      <AnimatePresence>
        {deleteModal.isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-[#151b28] p-8 rounded-3xl border border-slate-200 dark:border-white/10 max-w-sm w-full shadow-2xl">
                <h3 className="text-xl font-bold dark:text-white mb-4">Delete Job?</h3>
                <p className="text-sm text-slate-500 dark:text-white/40 mb-8 leading-relaxed">This will permanently archive the <strong className="text-slate-900 dark:text-white">{deleteModal.title}</strong> record and all match intelligence.</p>
                <div className="flex justify-end gap-3">
                   <button onClick={() => setDeleteModal({isOpen: false, id: '', title: ''})} className="px-6 py-2.5 text-xs font-bold text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white">Cancel</button>
                   <button onClick={confirmDelete} className="px-6 py-2.5 bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-500/30">Confirm Delete</button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
