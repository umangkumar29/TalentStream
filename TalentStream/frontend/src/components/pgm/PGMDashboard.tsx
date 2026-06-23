import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFloating, autoPlacement, flip, shift, offset, FloatingPortal, autoUpdate } from '@floating-ui/react';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  Users,
  Plus,
  Upload,
  Filter,
  Activity,
  Loader2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Edit2,
  FileText,
  Search,
  Eye,
  MoreVertical,
  ChevronRight,
  Calendar,
  X,
  Lock,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  fetchJobs, 
  Job, 
  updateJob,
  getJob,
  deleteJob,
  triggerMatching,
  reTriggerMatching,
  pollJobResults
} from '../../app/services/api';

// ── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  open: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  in_review: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  closed: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
};

const getUTCDate = (dateString?: string) => {
  if (!dateString) return new Date();
  return dateString.endsWith('Z') || dateString.includes('+') ? new Date(dateString) : new Date(dateString + 'Z');
};

const STATUS_LABEL: Record<string, string> = {
  open: 'Open',
  in_review: 'In Review',
  closed: 'Fulfilled',
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const shortId = (uuid: string) => `#TS-${uuid.slice(0, 4).toUpperCase()}`;

const getPageNumbers = (current: number, total: number) => {
  if (total <= 5) return Array.from({length: total}, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, 4, '...', total];
  if (current >= total - 2) return [1, '...', total - 3, total - 2, total - 1, total];
  return [1, '...', current - 1, current, current + 1, '...', total];
};

// ── Sub-components ────────────────────────────────────────────────────────────
const KPICard = ({ title, value, sub, icon: Icon, trendUp, loading }: {
  title: string; value: string | number; sub?: React.ReactNode;
  icon?: any; trendUp?: boolean; loading?: boolean;
}) => (
  <motion.div
    whileHover={{ y: -2 }}
    className="bg-[#151b28] border border-white/5 rounded-2xl p-6 relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-talentstream-primary/5 rounded-bl-full -z-10" />
    <div className="flex justify-between items-start mb-4">
      <h3 className="text-[11px] font-manrope text-talentstream-on-surface-variant uppercase tracking-wider font-bold">
        {title}
      </h3>
      {Icon && <Icon className="w-4 h-4 text-talentstream-primary/70" />}
    </div>
    <div className="flex items-end gap-3">
      {loading ? (
        <Loader2 className="w-7 h-7 text-white/30 animate-spin" />
      ) : (
        <h2 className="text-4xl font-manrope font-extrabold text-white tracking-tight">{value}</h2>
      )}
      {sub && !loading && (
        <span className={`text-xs font-bold mb-1.5 ${trendUp === true ? 'text-emerald-400' : trendUp === false ? 'text-rose-400' : 'text-talentstream-on-surface-variant'}`}>
          {sub}
        </span>
      )}
    </div>
  </motion.div>
);

// ── Main Component ────────────────────────────────────────────────────────────
export const PGMDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [tempRoleFilter, setTempRoleFilter] = useState('');
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [tempStatusFilters, setTempStatusFilters] = useState<string[]>([]);
  const [createdFilter, setCreatedFilter] = useState('All Time');
  const [tempCreatedFilter, setTempCreatedFilter] = useState('All Time');
  const [activeFilterMenu, setActiveFilterMenu] = useState<'role' | 'status' | 'created' | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Background Match Polling State
  // total_expected is null until first poll returns real top_k from the job record
  const [matchingJobs, setMatchingJobs] = useState<Record<string, { total_expected: number | null, total_processed: number }>>({});

  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, id: string, title: string}>({isOpen: false, id: '', title: ''});
  const [editModal, setEditModal] = useState<{isOpen: boolean, job: Job | null}>({isOpen: false, job: null});
  const [viewJdModal, setViewJdModal] = useState<{isOpen: boolean, job: Job | null, description: string}>({isOpen: false, job: null, description: ''});
  const [lockedModal, setLockedModal] = useState<{isOpen: boolean, jobId: string}>({isOpen: false, jobId: ''});
  const [pipelineJobId, setPipelineJobId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  const { x, y, strategy, refs, isPositioned } = useFloating({
    open: openMenuId !== null,
    placement: 'bottom-end',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8),
      flip(),
      shift({ padding: 8 })
    ]
  });
  
  const activeJob = jobs.find(j => j.id === openMenuId) || null;
  useEffect(() => {
    const closeMenu = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('.filter-popover')) return;
      setOpenMenuId(null);
      setActiveFilterMenu(null);
    };
    document.addEventListener('mousedown', closeMenu);
    return () => document.removeEventListener('mousedown', closeMenu);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter, statusFilters, createdFilter]);

  const startPolling = (jobId: string) => {
    // Check if we are already polling to prevent double intervals
    setMatchingJobs(prev => {
      if (prev[jobId]) return prev;
      return { ...prev, [jobId]: { total_expected: null, total_processed: 0 } };
    });

    let pollCount = 0;
    const MAX_POLLS = 100; // 100 × 3s = 5 minutes max

    const pollInterval = setInterval(async () => {
      pollCount++;
      try {
        const res = await pollJobResults(jobId);

        setMatchingJobs(prev => ({
          ...prev,
          [jobId]: {
            total_expected: res.total_expected,
            total_processed: res.total_processed,
          }
        }));

        if (res.is_complete || pollCount >= MAX_POLLS) {
          clearInterval(pollInterval);
          setMatchingJobs(prev => {
            const s = { ...prev };
            delete s[jobId];
            return s;
          });
          loadData(); // Refresh to show View Matches button
        }
      } catch (pollErr) {
        console.error('Poll failed', pollErr);
        clearInterval(pollInterval);
        setMatchingJobs(prev => {
          const s = { ...prev };
          delete s[jobId];
          return s;
        });
      }
    }, 3000);
  };

  const handleTriggerMatching = async (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    try {
      await triggerMatching(jobId);
      startPolling(jobId);
    } catch (err) {
      console.error('Failed to trigger match', err);
      alert('Failed to run AI matching.');
    }
  };

  const handleReTriggerMatching = async (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    try {
      await reTriggerMatching(jobId);
      startPolling(jobId);
    } catch (err: any) {
      console.error('Re-Trigger failed', err);
      const msg = err?.response?.data?.detail || 'Failed to re-trigger matching.';
      alert(msg);
    }
  };


  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const jobsData = await fetchJobs();
      setJobs(jobsData);
      
      // Auto-resume polling for jobs that are stuck in 'processing' or 'in_progress' on page load
      jobsData.forEach(job => {
        if (job.matching_status === 'processing' || job.matching_status === 'in_progress' || job.matching_status === 'running') {
          startPolling(job.id);
        }
      });
      
      setLastUpdated(new Date());
    } catch {
      setError('Failed to load dashboard data. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteJob(deleteModal.id);
      loadData();
    } catch (err) {
      console.error("Deletion failed", err);
      alert("Failed to delete mandate. Server link disconnected.");
    } finally {
      setDeleteModal({isOpen: false, id: '', title: ''});
    }
  };

  const confirmEdit = async (e: React.FormEvent) => {
     e.preventDefault();
     if(!editModal.job) return;
     try {
       await updateJob(editModal.job.id, {
          title: editModal.job.title,
          department: editModal.job.department
       });
       loadData();
       setEditModal({isOpen: false, job: null});
     } catch (err) {
       console.error("Failed to update mandate", err);
     }
  };

  const handleViewJd = async (job: Job) => {
    try {
      const fullJob = await getJob(job.id);
      setViewJdModal({ isOpen: true, job, description: fullJob.description || 'No description available.' });
    } catch (err) {
      console.error("Failed to fetch JD description", err);
      alert("Failed to load Job Description.");
    }
  };

  // Fetch data on initial load
  useEffect(() => {
    loadData();
  }, []);

  const filteredJobs = jobs.filter((j) => {
    if (roleFilter && !((j.title + (j.department || '') + j.role_category).toLowerCase().includes(roleFilter.toLowerCase()))) return false;
    if (statusFilters.length > 0) {
      const displayStatus = j.status === 'closed' ? 'Fulfilled' : 'Open';
      if (!statusFilters.includes(displayStatus)) return false;
    }
    if (createdFilter !== 'All Time') {
      const diff = Date.now() - new Date(j.created_at).getTime();
      const days = diff / (1000 * 3600 * 24);
      if (createdFilter === 'Today' && days > 1) return false;
      if (createdFilter === 'Last 7 Days' && days > 7) return false;
      if (createdFilter === 'Last 30 Days' && days > 30) return false;
    }
    return true;
  });

  const totalMandates = filteredJobs.length;
  const totalPages = Math.ceil(totalMandates / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalMandates);
  const paginatedJobs = filteredJobs.slice(startIndex, startIndex + pageSize);

  const fulfilledLabel = `${jobs.filter(j => j.status === 'closed').length}/${jobs.length}`;

  return (
    <div className="max-w-[1440px] mx-auto pb-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 pt-2">
        <div>
          <h1 className="text-2xl font-manrope font-bold tracking-tight text-slate-900 dark:text-white">
            Departmental Mandates
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            Review and manage active hiring mandates across your organization.
            <span className="text-[10px] text-slate-400 dark:text-white/30 hidden sm:inline-block">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#151b28] border border-slate-200 dark:border-white/10 shadow-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-xs font-semibold text-slate-600 dark:text-white/70"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={() => navigate('/pm/jd-architect')}
            className="bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> New Job Demand
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white dark:bg-[#151b28] border border-slate-200 dark:border-white/10 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col relative h-[88px] justify-between">
          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-md">
                <Briefcase className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Open Roles</p>
            </div>
            <span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded tracking-wide uppercase">+1 This Wk</span>
          </div>
          <div className="relative z-10">
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white font-manrope leading-none">{jobs.filter(j => j.status !== 'closed').length}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-[#151b28] border border-slate-200 dark:border-white/10 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col relative h-[88px] justify-between">
          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-md">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Fulfilled</p>
            </div>
            <span className="bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded tracking-wide uppercase">On Track</span>
          </div>
          <div className="relative z-10">
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white font-manrope leading-none">{jobs.filter(j => j.status === 'closed').length}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-[#151b28] border border-slate-200 dark:border-white/10 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col relative h-[88px] justify-between">
          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 rounded-md">
                <Clock className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">In Progress</p>
            </div>
            <span className="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded tracking-wide uppercase">Priority</span>
          </div>
          <div className="relative z-10">
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white font-manrope leading-none">{jobs.filter(j => j.status === 'in_review').length || 0}</h3>
          </div>
        </div>
      </div>

      <div className="w-full">
        {/* JD Management Hub */}
        <div className="w-full bg-white dark:bg-[#151b28] border border-slate-200 dark:border-white/10 shadow-sm rounded-[16px] overflow-visible pb-2">
          
          {/* Table Toolbar */}
          <div className="px-5 py-3 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-white dark:bg-transparent rounded-t-[16px]">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-sm text-slate-900 dark:text-white">Active Mandates</h2>
              <span className="bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 text-[10px] px-2 py-0.5 rounded-full font-bold leading-tight">{jobs.length} TOTAL</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative hidden sm:block">
                 <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                 <input type="text" placeholder="Search mandates..." value={tempRoleFilter} onChange={(e) => { setTempRoleFilter(e.target.value); setRoleFilter(e.target.value); }} className="w-48 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-shadow" />
              </div>
              <button className="text-slate-600 dark:text-white/70 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex items-center gap-1.5 text-xs font-medium py-1.5 px-3 rounded-md">
                <Filter className="w-3.5 h-3.5" /> Filters
              </button>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <div className="grid grid-cols-12 min-w-[900px] text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider py-2.5 bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/10 px-5 items-center sticky top-0 z-20">
              <div className="col-span-1">JD ID</div>
              <div className="col-span-2 flex items-center gap-2 relative">
                Role & Dept
                <button onClick={(e) => { e.stopPropagation(); setActiveFilterMenu(activeFilterMenu === 'role' ? null : 'role'); setTempRoleFilter(roleFilter); }} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer border border-transparent"><Filter className="w-3 h-3" /></button>
                <AnimatePresence>
                  {activeFilterMenu === 'role' && (
                    <motion.div initial={{opacity: 0, y: 5}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: 5}} className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-[#1a2130] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl z-50 p-3 filter-popover normal-case tracking-normal">
                      <div className="relative mb-3">
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-white/40" />
                        <input type="text" placeholder="Search role or department..." value={tempRoleFilter} onChange={(e) => { setTempRoleFilter(e.target.value); setRoleFilter(e.target.value); }} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/30 focus:outline-none focus:border-talentstream-primary" />
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider mb-2 px-1">Recent Searches</div>
                      <div className="space-y-1">
                        {['Product', 'Engineering', 'Design', 'Analytics', 'Infrastructure'].map(s => (
                          <button key={s} onClick={(e) => { e.stopPropagation(); setRoleFilter(s); setActiveFilterMenu(null); }} className="w-full text-left px-2 py-1.5 text-xs text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-md cursor-pointer">{s}</button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="col-span-1 flex items-center gap-2 relative">
                Status
                <button onClick={(e) => { e.stopPropagation(); setActiveFilterMenu(activeFilterMenu === 'status' ? null : 'status'); setTempStatusFilters([...statusFilters]); }} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer border border-transparent"><Filter className="w-3 h-3" /></button>
                <AnimatePresence>
                  {activeFilterMenu === 'status' && (
                    <motion.div initial={{opacity: 0, y: 5}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: 5}} className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-[#1a2130] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl z-50 p-3 filter-popover normal-case tracking-normal">
                      <div className="space-y-3 mb-4">
                        {['Open', 'Fulfilled'].map(s => (
                          <label key={s} className="flex items-center gap-3 cursor-pointer group">
                            <input type="checkbox" checked={tempStatusFilters.includes(s)} onChange={(e) => {
                              if (e.target.checked) setTempStatusFilters([...tempStatusFilters, s]);
                              else setTempStatusFilters(tempStatusFilters.filter(x => x !== s));
                            }} className="w-4 h-4 rounded border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-black/20 text-talentstream-primary focus:ring-talentstream-primary focus:ring-offset-0 cursor-pointer accent-talentstream-primary" />
                            <span className="text-sm text-slate-700 dark:text-white/80 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{s}</span>
                          </label>
                        ))}
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setStatusFilters(tempStatusFilters); setActiveFilterMenu(null); }} className="w-full py-2 bg-talentstream-primary hover:bg-talentstream-primary/90 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer">Apply</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="col-span-1">Position</div>
              <div className="col-span-2">Fulfillment</div>
              <div className="col-span-1">Matches</div>
              <div className="col-span-1 flex items-center gap-2 relative">
                Created
                <button onClick={(e) => { e.stopPropagation(); setActiveFilterMenu(activeFilterMenu === 'created' ? null : 'created'); setTempCreatedFilter(createdFilter); }} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer border border-transparent"><Filter className="w-3 h-3" /></button>
                <AnimatePresence>
                  {activeFilterMenu === 'created' && (
                    <motion.div initial={{opacity: 0, y: 5}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: 5}} className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-[#1a2130] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl z-50 p-3 filter-popover normal-case tracking-normal">
                      <div className="space-y-3 mb-4">
                        {['All Time', 'Today', 'Last 7 Days', 'Last 30 Days'].map(s => (
                          <label key={s} className="flex items-center gap-3 cursor-pointer group">
                            <input type="radio" name="created_filter" checked={tempCreatedFilter === s} onChange={() => setTempCreatedFilter(s)} className="w-4 h-4 border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-black/20 text-talentstream-primary focus:ring-talentstream-primary focus:ring-offset-0 cursor-pointer accent-talentstream-primary" />
                            <span className="text-sm text-slate-700 dark:text-white/80 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{s}</span>
                          </label>
                        ))}
                        <button className="flex items-center justify-between w-full text-sm text-slate-700 dark:text-white/80 hover:text-slate-900 dark:hover:text-white transition-colors mt-2 pt-3 border-t border-slate-200 dark:border-white/10 cursor-pointer">
                           <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Custom Range</span>
                           <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setCreatedFilter(tempCreatedFilter); setActiveFilterMenu(null); }} className="w-full py-2 bg-talentstream-primary hover:bg-talentstream-primary/90 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer">Apply</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="col-span-1">Job Description</div>
              <div className="col-span-2 text-right pr-4">Actions</div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-talentstream-primary animate-spin" />
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-12 text-talentstream-on-surface-variant text-sm">
                {jobs.length === 0
                  ? 'No job requests yet. Create one to get started!'
                  : 'No jobs match this filter.'}
              </div>
            ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/5">
                {paginatedJobs.map((job, i) => {
                  const activityDate = getUTCDate(job.last_activity_at || job.created_at);
                  const isFulfilled = job.status === 'closed' || (job.fulfilled_count !== undefined && job.num_resources !== undefined && job.fulfilled_count >= job.num_resources);
                  const isLocked = !isFulfilled && new Date().getTime() - activityDate.getTime() > 3 * 24 * 60 * 60 * 1000;
                  return (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    key={job.id}
                    onClick={(e) => {
                       if (isLocked) {
                          setLockedModal({isOpen: true, jobId: job.id});
                          return;
                       }
                       if (job.match_count && job.match_count > 0) {
                         navigate(`/pgm/matches?jobId=${job.id}`);
                       } else {
                         handleViewJd(job);
                       }
                    }}
                    className={`grid grid-cols-12 min-w-[900px] items-center px-5 h-[56px] transition-colors group cursor-pointer ${isLocked ? 'opacity-60 grayscale cursor-not-allowed bg-slate-50/50 dark:bg-white/[0.01]' : 'hover:bg-slate-50/50 dark:hover:bg-white/[0.02]'}`}
                  >
                    <div className="col-span-1">
                      <span className="font-mono text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded">
                        {shortId(job.id)}
                      </span>
                    </div>
                    <div className="col-span-2 pr-4 truncate flex flex-col justify-center h-full">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">{job.title}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{job.department || job.role_category}</div>
                    </div>
                    <div className="col-span-1">
                      {isLocked ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400">
                          <Lock className="w-3 h-3" /> Locked
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                          job.status === 'open' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 
                          job.status === 'closed' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20' : 
                          'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${job.status === 'open' ? 'bg-emerald-500' : job.status === 'closed' ? 'bg-indigo-500' : 'bg-amber-500'}`} />
                          {STATUS_LABEL[job.status]}
                        </span>
                      )}
                    </div>
                    <div className="col-span-1 text-xs text-slate-600 dark:text-white/80 font-medium">
                      {job.fulfilled_count || 0}/{job.num_resources || 1}
                    </div>
                    <div className="col-span-2 flex items-center gap-3 pr-6 h-full">
                      <div className="flex-grow h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden w-full">
                        <div 
                          className="h-full bg-indigo-500 rounded-full" 
                          style={{ width: `${Math.min(100, ((job.fulfilled_count || 0) / (job.num_resources || 1)) * 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 min-w-[24px]">
                        {Math.round(((job.fulfilled_count || 0) / (job.num_resources || 1)) * 100)}%
                      </span>
                    </div>
                    <div className="col-span-1">
                      {job.match_count && job.match_count > 0 ? (
                        <span className={`text-indigo-600 dark:text-indigo-400 text-xs font-semibold ${isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:underline'}`} onClick={(e) => { e.stopPropagation(); if (isLocked) { setLockedModal({isOpen: true, jobId: job.id}); return; } navigate(`/pgm/matches?jobId=${job.id}`); }}>{job.match_count} matches</span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 text-xs font-medium cursor-not-allowed">0 matches</span>
                      )}
                    </div>
                    <div className="col-span-1 flex flex-col justify-center h-full">
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {getUTCDate(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {!isLocked && !isFulfilled && (job.last_activity_at || job.created_at) && (
                        <span className={`text-[9.5px] font-bold tracking-wide mt-0.5 ${
                          (() => {
                            const diff = activityDate.getTime() + (3 * 24 * 60 * 60 * 1000) - new Date().getTime();
                            const hours = Math.floor(diff / (1000 * 60 * 60));
                            if (hours < 24) return 'text-amber-500 animate-pulse';
                            return 'text-slate-400 dark:text-slate-500';
                          })()
                        }`}>
                          {(() => {
                             const diff = activityDate.getTime() + (3 * 24 * 60 * 60 * 1000) - new Date().getTime();
                             const hours = Math.floor(diff / (1000 * 60 * 60));
                             if (hours < 24) return `Locks in ${hours}h`;
                             const days = Math.floor(hours / 24);
                             const remainingHours = hours % 24;
                             return `Locks in ${days}d ${remainingHours}h`;
                          })()}
                        </span>
                      )}
                    </div>
                    <div className="col-span-1 flex items-center">
                      <button disabled={isLocked} onClick={(e) => { e.stopPropagation(); handleViewJd(job); }} className={`flex items-center gap-1.5 font-medium text-[11px] transition-colors ${isLocked ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'}`} title="View Job Description">
                        <FileText className="w-3.5 h-3.5" /> View JD
                      </button>
                    </div>
                    <div className="col-span-2 flex justify-end items-center gap-1.5">
                     {job.fulfilled_count !== undefined && job.num_resources !== undefined && job.fulfilled_count >= job.num_resources ? (
                         <button disabled className="px-2.5 py-1 bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/30 rounded text-[10px] font-medium transition-colors cursor-not-allowed border border-transparent">
                            Fulfilled
                         </button>
                     ) : matchingJobs[job.id] || job.matching_status === 'in_progress' || job.matching_status === 'processing' || job.matching_status === 'running' ? (
                         <button onClick={(e) => { e.stopPropagation(); setPipelineJobId(job.id); }} className="flex flex-col items-end gap-1.5 w-full max-w-[110px] cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 p-1.5 -mr-1.5 rounded-lg transition-colors group">
                            <div className="flex justify-between w-full text-[10px] font-bold text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase tracking-wider">
                               <span className="flex items-center gap-1.5">
                                 <Loader2 className="w-3 h-3 animate-spin text-indigo-400" /> Pipeline...
                               </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                               <motion.div className="h-full bg-indigo-500 rounded-full" initial={{ width: 0 }} animate={{ width: matchingJobs[job.id]?.total_expected ? `${(matchingJobs[job.id].total_processed / matchingJobs[job.id].total_expected!) * 100}%` : '15%' }} transition={{ duration: 0.6 }} />
                            </div>
                         </button>
                       ) : job.match_count && job.match_count > 0 ? (
                          <button disabled={isLocked} onClick={(e) => { e.stopPropagation(); navigate(`/pgm/matches?jobId=${job.id}`); }} className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors border ${isLocked ? 'border-slate-200 dark:border-white/10 text-slate-300 dark:text-white/20 cursor-not-allowed' : 'border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'}`}>
                             View Matches
                          </button>
                       ) : job.matching_status === 'completed' ? (
                          <button disabled className="px-2.5 py-1 border border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/40 rounded text-[10px] font-medium transition-colors cursor-not-allowed">
                             No Matches Found
                          </button>
                       ) : (
                         <button disabled={isLocked} onClick={(e) => handleTriggerMatching(e, job.id)} className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors border border-transparent ${isLocked ? 'bg-slate-50 dark:bg-white/5 text-slate-300 dark:text-white/20 cursor-not-allowed' : 'bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400'}`}>
                            Find Matches
                         </button>
                       )}
                       
                        <div className="relative">
                         <button 
                           disabled={isLocked}
                           ref={openMenuId === job.id ? refs.setReference : null}
                           onClick={(e) => { 
                              e.stopPropagation(); 
                              setOpenMenuId(openMenuId === job.id ? null : job.id);
                           }} 
                           className={`p-1 rounded-md transition-colors border border-transparent ${isLocked ? 'text-slate-300 dark:text-white/20 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}
                         >
                           <MoreVertical className="w-4 h-4" />
                         </button>
                       </div>
                    </div>
                  </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          {!loading && totalMandates > 0 && (
            <div className="px-5 py-3 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] rounded-b-[16px] flex flex-col sm:flex-row justify-between items-center gap-4 sticky bottom-0 z-20">
              <div className="flex items-center gap-4">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                  Showing <strong className="text-slate-900 dark:text-white font-semibold">{totalMandates === 0 ? 0 : startIndex + 1}–{endIndex}</strong> of <strong className="text-slate-900 dark:text-white font-semibold">{totalMandates}</strong> mandates
                </span>
                <div className="flex items-center gap-2 border-l border-slate-200 dark:border-white/10 pl-4 hidden sm:flex">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Rows per page:</span>
                  <select 
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                    className="bg-white dark:bg-[#1a2130] border border-slate-200 dark:border-white/10 rounded-md px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-white/80 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/70 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed text-[11px] font-semibold transition-colors"
                >
                  Previous
                </button>
                
                <div className="flex items-center px-1">
                  {getPageNumbers(currentPage, totalPages).map((num, i) => (
                    num === '...' ? (
                      <span key={`ell-${i}`} className="px-1.5 text-[11px] font-bold text-slate-400">...</span>
                    ) : (
                      <button
                        key={num}
                        onClick={() => setCurrentPage(num as number)}
                        className={`min-w-[28px] h-7 px-1 rounded-md flex items-center justify-center text-[11px] font-semibold transition-colors cursor-pointer ${
                          currentPage === num 
                            ? 'bg-indigo-600 text-white shadow-sm' 
                            : 'text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/10'
                        }`}
                      >
                        {num}
                      </button>
                    )
                  ))}
                </div>

                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/70 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed text-[11px] font-semibold transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Locked Confirmation Modal */}
      {createPortal(
        <AnimatePresence>
          {lockedModal.isOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            >
               <motion.div 
                 initial={{ scale: 0.95, opacity: 0, y: 20 }}
                 animate={{ scale: 1, opacity: 1, y: 0 }}
                 exit={{ scale: 0.95, opacity: 0, y: 20 }}
                 className="bg-white dark:bg-[#151b28] border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-2xl max-w-sm w-full relative overflow-hidden"
               >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-full -z-10" />
                  <div className="mb-4 text-amber-500">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Mandate Locked</h3>
                  <p className="text-sm text-slate-600 dark:text-talentstream-on-surface-variant font-medium leading-relaxed mb-8">
                     Action Required: This mandate has been locked due to 3+ days of inactivity. To ensure pipeline efficiency, stale mandates are automatically frozen. Please contact your RMG Administrator to reactivate this demand.
                  </p>
                  <div className="flex justify-end gap-3">
                     <button 
                       onClick={() => setLockedModal({isOpen: false, jobId: ''})}
                       className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] shadow-amber-500/20"
                     >
                       Understood
                     </button>
                  </div>
               </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {createPortal(
        <AnimatePresence>
          {deleteModal.isOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            >
               <motion.div 
                 initial={{ scale: 0.95, opacity: 0, y: 20 }}
                 animate={{ scale: 1, opacity: 1, y: 0 }}
                 exit={{ scale: 0.95, opacity: 0, y: 20 }}
                 className="bg-white dark:bg-[#151b28] border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-2xl max-w-sm w-full relative overflow-hidden"
               >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-bl-full -z-10" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete Global Mandate</h3>
                  <p className="text-sm text-slate-600 dark:text-talentstream-on-surface-variant font-medium leading-relaxed mb-8">
                     ADMIN: Are you sure you want to PERMANENTLY delete mandate <strong className="text-slate-900 dark:text-white">{deleteModal.title}</strong>? This will delete all neural match data associated with it.
                  </p>
                  <div className="flex justify-end gap-3">
                     <button 
                       onClick={() => setDeleteModal({isOpen: false, id: '', title: ''})}
                       className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                     >
                       Cancel
                     </button>
                     <button 
                       onClick={confirmDelete}
                       className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)] shadow-rose-500/20"
                     >
                       Confirm Delete
                     </button>
                  </div>
               </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Edit Modal */}
      {createPortal(
        <AnimatePresence>
          {editModal.isOpen && editModal.job && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            >
               <motion.form 
                 onSubmit={confirmEdit}
                 initial={{ scale: 0.95, opacity: 0, y: 20 }}
                 animate={{ scale: 1, opacity: 1, y: 0 }}
                 exit={{ scale: 0.95, opacity: 0, y: 20 }}
                 className="bg-white dark:bg-[#151b28] border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-2xl max-w-md w-full relative overflow-hidden"
               >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-full -z-10" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Edit Mandate metadata</h3>
                  <div className="space-y-4 mb-8">
                     <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-white/50 mb-1.5 uppercase tracking-wider">Job Title</label>
                        <input 
                          type="text" 
                          required
                          value={editModal.job.title}
                          onChange={e => setEditModal({ ...editModal, job: { ...editModal.job!, title: e.target.value } })}
                          className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-white/50 mb-1.5 uppercase tracking-wider">Department</label>
                        <input 
                          type="text"
                          value={editModal.job.department || ''}
                          onChange={e => setEditModal({ ...editModal, job: { ...editModal.job!, department: e.target.value } })}
                          className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                        />
                     </div>
                  </div>
                  <div className="flex justify-end gap-3">
                     <button 
                       type="button"
                       onClick={() => setEditModal({isOpen: false, job: null})}
                       className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                     >
                       Dismiss
                     </button>
                     <button 
                       type="submit"
                       className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] shadow-indigo-500/20"
                     >
                       Save Changes
                     </button>
                  </div>
               </motion.form>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* View JD Modal */}
      {createPortal(
        <AnimatePresence>
          {viewJdModal.isOpen && viewJdModal.job && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            >
               <motion.div 
                 initial={{ scale: 0.95, opacity: 0, y: 20 }}
                 animate={{ scale: 1, opacity: 1, y: 0 }}
                 exit={{ scale: 0.95, opacity: 0, y: 20 }}
                 className="rounded-[20px] shadow-2xl w-[80vw] max-w-[1200px] h-[80vh] max-h-[85vh] flex flex-col relative overflow-hidden transition-colors duration-300 border"
                 style={{ backgroundColor: 'var(--talentstream-surface)', borderColor: 'var(--card-border)' }}
               >
                  {/* Fixed Sticky Header */}
                  <div className="flex justify-between items-start px-8 pt-8 pb-6 border-b shrink-0 z-10 relative" style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--talentstream-surface)' }}>
                    <div>
                      <h3 className="text-3xl font-extrabold mb-2" style={{ color: 'var(--text-primary)' }}>{viewJdModal.job.title}</h3>
                      <div className="flex items-center gap-3 text-[13px] font-bold tracking-wide uppercase" style={{ color: 'var(--text-secondary)' }}>
                        <span>{viewJdModal.job.department || viewJdModal.job.role_category || 'General'}</span>
                        {viewJdModal.job.created_at && (
                           <>
                             <span className="w-1 h-1 rounded-full bg-slate-400 opacity-50"></span>
                             <span>Created {new Date(viewJdModal.job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                           </>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => setViewJdModal({isOpen: false, job: null, description: ''})}
                      className="p-2 rounded-xl border transition-colors opacity-80 hover:opacity-100"
                      style={{ borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
  
                  {/* Scrollable Content Area */}
                  <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar bg-transparent relative z-0">
                    <div className="max-w-[800px] mx-auto font-sans" style={{ fontSize: '15px', lineHeight: '1.7', color: 'var(--text-primary)' }}>
                      {(() => {
                        let currentSection = '';
                        return viewJdModal.description.split('\n').map((line, i) => {
                          const trimmedLine = line.trim();
                          if (!trimmedLine) return null;
                          
                          const sections = ['Role Overview', 'Key Responsibilities', 'Responsibilities', 'Requirements', 'Technical Skills', 'Required Technical Skills', 'Preferred Skills', 'Benefits', 'Qualifications', 'About the Role', 'Job Description'];
                          
                          // Skip redundant title lines since the modal header already shows it
                          if (trimmedLine.toLowerCase().includes('job title') || trimmedLine.toLowerCase() === 'open role' || (viewJdModal.job?.title && trimmedLine.toLowerCase() === viewJdModal.job.title.toLowerCase())) {
                            return null;
                          }

                          const isHeader = sections.some(s => trimmedLine.toLowerCase() === s.toLowerCase() || trimmedLine.toLowerCase() === s.toLowerCase() + ':');
                          
                          if (isHeader) {
                            currentSection = trimmedLine.replace(':', '');
                            return (
                              <div key={i} className="mt-10 mb-6 first:mt-2">
                                <h4 className="text-[18px] font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>{currentSection}</h4>
                                <div className="h-px w-full mt-3 opacity-20" style={{ backgroundColor: 'var(--text-primary)' }} />
                              </div>
                            );
                          }
                          
                          const isBulletSection = currentSection.toLowerCase().includes('responsibilities') || currentSection.toLowerCase().includes('skills') || currentSection.toLowerCase().includes('requirements') || currentSection.toLowerCase().includes('qualifications');
                          
                          if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•') || trimmedLine.startsWith('*') || (isBulletSection && trimmedLine.length > 10)) {
                            const bulletText = trimmedLine.replace(/^[-•*]\s*/, '').trim();
                            return (
                              <div key={i} className="flex gap-4 my-3 pl-2">
                                <span className="mt-2.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: 'var(--talentstream-primary)' }} />
                                <span className="flex-1 opacity-90">{bulletText}</span>
                              </div>
                            );
                          }
                          
                          return <p key={i} className="my-4 opacity-90">{trimmedLine}</p>;
                        });
                      })()}
                    </div>
                  </div>
  
                  {/* Fixed Sticky Footer */}
                  <div className="flex justify-end items-center gap-4 px-8 py-5 border-t shrink-0 z-10 relative" style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--talentstream-surface)' }}>
                     <button 
                       onClick={() => alert('JD Download functionality coming soon.')}
                       className="px-6 py-2.5 rounded-xl text-[13px] font-bold tracking-wide uppercase transition-all border opacity-80 hover:opacity-100"
                       style={{ borderColor: 'var(--card-border)', color: 'var(--text-primary)' }}
                     >
                       Download JD
                     </button>
                     <button 
                       onClick={() => setViewJdModal({isOpen: false, job: null, description: ''})}
                       className="px-8 py-2.5 rounded-xl text-[13px] font-bold tracking-wide uppercase transition-all shadow-sm"
                       style={{ backgroundColor: 'var(--talentstream-primary)', color: '#ffffff' }}
                     >
                       Close
                     </button>
                  </div>
               </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
      <FloatingPortal>
        <AnimatePresence>
          {openMenuId && activeJob && (
            <motion.div
              ref={refs.setFloating}
              style={{ 
                position: strategy,
                top: y ?? 0,
                left: x ?? 0,
                zIndex: 9999, 
                visibility: isPositioned ? 'visible' : 'hidden' 
              }}
              initial={{ opacity: 0, scale: 0.95, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 5 }}
              className="bg-white dark:bg-[#1a2130] border border-slate-200 dark:border-white/10 rounded-lg shadow-lg overflow-hidden py-1 w-32 filter-popover"
            >
              <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); setEditModal({isOpen: true, job: activeJob}); }} className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2">
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
              {activeJob.status === 'open' && 
                activeJob.matching_status === 'completed' && 
                (activeJob.fulfilled_count ?? 0) < (activeJob.num_resources ?? 1) && (
                <>
                  <div className="mx-2 my-1 border-t border-slate-100 dark:border-white/10" />
                  <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); handleReTriggerMatching(e, activeJob.id); }} className="w-full text-left px-3 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 flex items-center gap-2 transition-colors">
                    <RefreshCw className="w-3.5 h-3.5" /> Re-Trigger
                  </button>
                </>
              )}
              <div className="mx-2 my-1 border-t border-slate-100 dark:border-white/10" />
              <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); setDeleteModal({isOpen: true, id: activeJob.id, title: activeJob.title}); }} className="w-full text-left px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2 transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </FloatingPortal>
      {/* AI Pipeline Sliding Panel */}
      {createPortal(
        <AnimatePresence>
          {pipelineJobId && (
            <div className="fixed inset-0 z-[120] overflow-hidden pointer-events-none flex justify-end">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm pointer-events-auto"
                onClick={() => setPipelineJobId(null)}
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="relative h-full w-[400px] bg-white dark:bg-[#0f141f] shadow-2xl pointer-events-auto flex flex-col z-10 border-l border-slate-200 dark:border-white/10"
              >
                {(() => {
                  const job = jobs.find(j => j.id === pipelineJobId);
                  const isCompleted = job?.matching_status === 'completed';
                  const progressData = matchingJobs[pipelineJobId];
                  const phase1Complete = isCompleted || (progressData && (progressData.total_processed > 0 || progressData.total_expected !== null));
                  const phase2Complete = isCompleted || (progressData && progressData.total_expected !== null && progressData.total_processed === progressData.total_expected && progressData.total_expected > 0);
                  
                  return (
                    <>
                      <div className="p-6 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-indigo-500" /> AI Match Pipeline
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{job?.title || 'Job'}</p>
                          </div>
                          <button onClick={() => setPipelineJobId(null)} className="p-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="p-6 flex-1 overflow-y-auto">
                        <div className="relative space-y-8">
                          {/* Phase 1: Vector Search */}
                          <div className="relative flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 z-10 bg-white dark:bg-[#0f141f] transition-colors ${phase1Complete ? 'border-emerald-500 text-emerald-500' : 'border-indigo-500 text-indigo-500'}`}>
                                {phase1Complete ? <CheckCircle2 className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />}
                              </div>
                              <div className={`w-0.5 h-full absolute top-8 -bottom-8 ${phase1Complete ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-white/10'}`} />
                            </div>
                            <div className="pt-1.5 pb-4">
                              <h4 className={`text-sm font-bold ${phase1Complete ? 'text-slate-900 dark:text-white' : 'text-indigo-600 dark:text-indigo-400'}`}>Semantic Pre-filtering</h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-3">Scanning entire global talent pool using dense vector embeddings.</p>
                              <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold inline-flex items-center gap-1.5 uppercase tracking-wide border ${phase1Complete ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20'}`}>
                                <Cpu className="w-3 h-3" /> {phase1Complete ? (progressData?.total_expected ? `${progressData.total_expected} Candidates Shortlisted` : 'Candidates Shortlisted') : 'Calculating Cosine Distances...'}
                              </div>
                            </div>
                          </div>

                          {/* Phase 2: Cross-Encoder */}
                          <div className="relative flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 z-10 bg-white dark:bg-[#0f141f] transition-colors ${phase2Complete ? 'border-emerald-500 text-emerald-500' : phase1Complete ? 'border-indigo-500 text-indigo-500' : 'border-slate-200 text-slate-400 dark:border-white/10 dark:text-white/20'}`}>
                                {phase2Complete ? <CheckCircle2 className="w-4 h-4" /> : phase1Complete ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                              </div>
                              <div className={`w-0.5 h-full absolute top-8 -bottom-8 ${phase2Complete ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-white/10'}`} />
                            </div>
                            <div className="pt-1.5 pb-4 w-full pr-4">
                              <h4 className={`text-sm font-bold ${phase2Complete ? 'text-slate-900 dark:text-white' : phase1Complete ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-white/40'}`}>Deep Neural Re-ranking</h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-3">Passing shortlisted candidates through BGE-M3 Cross-Encoder for deep contextual skill analysis.</p>
                              {phase1Complete && !phase2Complete && (
                                <div className="space-y-2">
                                  <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                    <span>Processing Batches</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <motion.div className="h-full bg-indigo-500 rounded-full" initial={{ width: 0 }} animate={{ width: progressData?.total_expected ? `${(progressData.total_processed / progressData.total_expected) * 100}%` : '15%' }} transition={{ duration: 0.6 }} />
                                  </div>
                                </div>
                              )}
                              {phase2Complete && (
                                <div className="px-2.5 py-1 rounded-md text-[10px] font-bold inline-flex items-center gap-1.5 uppercase tracking-wide border bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                                  Scores Calibrated
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Phase 3: Final LLM Eval */}
                          <div className="relative flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 z-10 bg-white dark:bg-[#0f141f] transition-colors ${isCompleted ? 'border-emerald-500 text-emerald-500' : phase2Complete ? 'border-indigo-500 text-indigo-500' : 'border-slate-200 text-slate-400 dark:border-white/10 dark:text-white/20'}`}>
                                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : phase2Complete ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                              </div>
                            </div>
                            <div className="pt-1.5 pb-4">
                              <h4 className={`text-sm font-bold ${isCompleted ? 'text-slate-900 dark:text-white' : phase2Complete ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-white/40'}`}>Finalizing Insights</h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-3">Generating final match explanations and technical fit summaries for the top candidates.</p>
                              {isCompleted && (
                                <button onClick={() => { setPipelineJobId(null); navigate(`/pgm/matches?jobId=${job.id}`); }} className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg shadow-sm transition-all shadow-indigo-500/20 shadow-[0_0_15px_rgba(79,70,229,0.2)]">
                                  View Top Matches
                                </button>
                              )}
                            </div>
                          </div>

                        </div>
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

    </div>
  );
};
