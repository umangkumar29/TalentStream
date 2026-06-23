import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Users,
  Search,
  BrainCircuit,
  Zap,
  Upload,
  FileText,
  Clock,
  History,
  ArrowRight,
  DatabaseZap,
  Loader2,
  Filter,
  Plus,
  Trash2,
  Edit2,
  MoreHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Database,
  Briefcase,
  Code,
  Calendar,
  Layers,
  Bell,
  CheckCircle,
  AlertCircle,
  Trophy,
  Target,
  Eye,
  Cpu,
  UserCheck,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuth } from '../../app/services/auth/AuthProvider';
import { getTechIcon } from '../../utils/techIcons';
import {
  Candidate,
  RMGAnalytics,
  fetchRMGAnalytics,
  listCandidates,
  deleteCandidate,
  updateCandidate,
  uploadResume,
  fetchConsolidatedDemand,
  ConsolidatedProjectDemand,
  fetchAllJobDemands,
  JobDemand,
  pollJobResults,
  getJob
} from '../../app/services/api';

const getPageNumbers = (current: number, total: number) => {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, 4, '...', total];
  if (current >= total - 2) return [1, '...', total - 3, total - 2, total - 1, total];
  return [1, '...', current - 1, current, current + 1, '...', total];
};

export const RMGOverview: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeDashboardView, setActiveDashboardView] = useState<'talent' | 'demand'>(
    location.state?.defaultView || 'talent'
  );
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [consolidatedDemand, setConsolidatedDemand] = useState<ConsolidatedProjectDemand[]>([]);
  const [allJobDemands, setAllJobDemands] = useState<JobDemand[]>([]);
  const [analytics, setAnalytics] = useState<RMGAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  // Demand filter state
  const [demandPmFilter, setDemandPmFilter] = useState<string>('');
  const [demandDeptFilter, setDemandDeptFilter] = useState<string>('');
  const [demandSearch, setDemandSearch] = useState<string>('');
  const [demandStatusFilter, setDemandStatusFilter] = useState<string | null>(null);

  // Search & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [demandCurrentPage, setDemandCurrentPage] = useState(1);
  const [demandPageSize, setDemandPageSize] = useState(5);

  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadErrorMessage, setUploadErrorMessage] = useState('');
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState('');
  const [parsingProgress, setParsingProgress] = useState(0);

  // Modals
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, id: string, name: string }>({ isOpen: false, id: '', name: '' });
  const [editModal, setEditModal] = useState<{ isOpen: boolean, cand: Candidate | null }>({ isOpen: false, cand: null });
  const [profileModal, setProfileModal] = useState<{ isOpen: boolean, cand: Candidate | null }>({ isOpen: false, cand: null });
  const [uploadErrorModal, setUploadErrorModal] = useState<{ isOpen: boolean, message: string }>({ isOpen: false, message: '' });
  const [resyncModal, setResyncModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Custom Filters Popover State
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedExperienceRange, setSelectedExperienceRange] = useState<string>('all');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  // Expanded Manager state
  const [expandedManager, setExpandedManager] = useState<string | null>(null);

  const shortId = (uuid: string) => `#TS-${uuid.slice(0, 4).toUpperCase()}`;

  const [viewJdModal, setViewJdModal] = useState<{
    isOpen: boolean;
    job: JobDemand | null;
    description: string;
    minExperienceYears?: number | null;
    projectName?: string | null;
    projectCode?: string | null;
  }>({
    isOpen: false,
    job: null,
    description: '',
  });

  const [extReqModal, setExtReqModal] = useState<{ isOpen: boolean, job: JobDemand | null }>({ isOpen: false, job: null });

  const handleViewJd = async (job: JobDemand) => {
    try {
      const fullJob = await getJob(job.id);
      setViewJdModal({
        isOpen: true,
        job,
        description: fullJob.description || 'No description available.',
        minExperienceYears: fullJob.min_experience_years,
        projectName: fullJob.project_name || job.project_name,
        projectCode: fullJob.project_code || job.project_code,
      });
    } catch (err) {
      console.error("Failed to fetch JD description", err);
      alert("Failed to load Job Description.");
    }
  };

  const handleJdClick = (jdId: string, jdTitle: string, projectName: string) => {
    navigate(`/rmg/demand/${jdId}/matches`);
  };

  const groupedDemand = React.useMemo(() => {
    const groups: { [key: string]: { managerName: string; managerId: string | null; projects: ConsolidatedProjectDemand[] } } = {};
    consolidatedDemand.forEach(proj => {
      const mgrName = proj.manager_name || 'Unassigned Manager';
      if (!groups[mgrName]) {
        groups[mgrName] = { managerName: mgrName, managerId: proj.manager_id, projects: [] };
      }
      groups[mgrName].projects.push(proj);
    });
    return Object.values(groups);
  }, [consolidatedDemand]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchData = async () => {
    if (!token) return;
    try {
      setLoading(true);

      // Only fetch talent pool data on initial load — demand data is lazy-loaded
      const [cands, stats] = await Promise.all([
        listCandidates({ search: debouncedSearch, status_filter: activeFilter || undefined, limit: 1000 }).catch((err) => { console.error("List Error:", err); return []; }),
        fetchRMGAnalytics().catch((err) => { console.error("RMG Analytics Error:", err); return null; }),
      ]);

      setCandidates(cands || []);
      if (stats) setAnalytics(stats);
    } catch (err) {
      console.error("Dashboard sync error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Lazy-load all job demands ONLY when the user clicks "Overall Demand"
  const fetchDemandData = async () => {
    if (!token) return;
    try {
      const [allDemands, demand] = await Promise.all([
        fetchAllJobDemands().catch((err) => { console.error("All Job Demands Error:", err); return []; }),
        fetchConsolidatedDemand().catch((err) => { console.error("Demand Error:", err); return []; })
      ]);
      setAllJobDemands(allDemands || []);
      setConsolidatedDemand(demand || []);
    } catch (err) {
      console.error("All Job Demands Error:", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, debouncedSearch, activeFilter]);

  // Only fetch all-job-demands when user switches to the 'Overall Demand' tab
  useEffect(() => {
    if (activeDashboardView === 'demand' && token) {
      fetchDemandData();
    }
  }, [activeDashboardView, token]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, activeFilter]);

  useEffect(() => {
    setDemandCurrentPage(1);
  }, [demandSearch, demandPmFilter, demandDeptFilter, demandStatusFilter]);

  useEffect(() => {
    if (viewJdModal.isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [viewJdModal.isOpen]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('uploading');
    setParsingProgress(10);

    try {
      const response = await uploadResume(file, file.name.split('.')[0], 'General');
      setParsingProgress(100);
      setUploadSuccessMessage(response.message || 'Upload complete!');
      setUploadStatus('success');

      setTimeout(() => {
        setIsUploading(false);
        setUploadStatus('idle');
        fetchData();
      }, 1500);
    } catch (error: any) {
      console.error('Upload failed:', error);
      const errorMsg = error.response?.data?.detail;
      setUploadErrorMessage(typeof errorMsg === 'string' ? errorMsg : 'An unexpected error occurred during upload.');
      setUploadStatus('error');
    } finally {
      setParsingProgress(0);
      if (document.getElementById('rmg-resume-upload')) {
        (document.getElementById('rmg-resume-upload') as HTMLInputElement).value = '';
      }
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteCandidate(deleteModal.id);
      fetchData();
    } catch (err) {
      console.error("Failed to delete candidate", err);
    } finally {
      setDeleteModal({ isOpen: false, id: '', name: '' });
    }
  };

  const confirmEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal.cand) return;
    try {
      await updateCandidate(editModal.cand.id, editModal.cand);
      fetchData();
      setEditModal({ isOpen: false, cand: null });
    } catch (err) {
      console.error("Failed to update candidate", err);
    }
  };

  const parseSkills = (skills: any): string[] => {
    if (!skills) return [];
    if (Array.isArray(skills)) return skills;
    if (typeof skills === 'string') return skills.split(',').filter(s => s.trim());
    return [];
  };

  const getStatusStyle = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case 'available':
      case 'bench':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'allocated':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'interview_scheduled':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'selected_for_allocation':
      case 'earmarked':
      case 'enmarked':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default:
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const calculateAging = (createdAt: string | undefined): string => {
    if (!createdAt) return '';
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  const filteredCandidates = React.useMemo(() => {
    return candidates.filter(cand => {
      // Status filter
      if (selectedStatuses.length > 0) {
        const status = cand.status?.toLowerCase() || 'bench';
        const mappedStatus = (status === 'selected_for_allocation' || status === 'earmarked' || status === 'enmarked') ? 'earmarked' : status;
        if (!selectedStatuses.includes(mappedStatus)) return false;
      }

      // Experience filter
      if (selectedExperienceRange !== 'all') {
        const exp = cand.experience_years || 0;
        if (selectedExperienceRange === '0-2' && (exp < 0 || exp > 2)) return false;
        if (selectedExperienceRange === '3-5' && (exp < 3 || exp > 5)) return false;
        if (selectedExperienceRange === '5-8' && (exp < 5 || exp > 8)) return false;
        if (selectedExperienceRange === '8+' && exp < 8) return false;
      }

      // Skills filter
      if (selectedSkills.length > 0) {
        const candSkills = (cand.skills || '').toLowerCase();
        const matchesAll = selectedSkills.every(skill => candSkills.includes(skill.toLowerCase()));
        if (!matchesAll) return false;
      }

      return true;
    });
  }, [candidates, selectedStatuses, selectedExperienceRange, selectedSkills]);

  const totalCandidates = filteredCandidates.length;
  const totalPages = Math.ceil(totalCandidates / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCandidates);
  const paginatedCandidates = filteredCandidates.slice(startIndex, startIndex + pageSize);

  const filteredJobDemands = React.useMemo(() => {
    return allJobDemands.filter(j =>
      (!demandPmFilter || j.pm_name === demandPmFilter) &&
      (!demandDeptFilter || j.department === demandDeptFilter) &&
      (!demandSearch || j.title.toLowerCase().includes(demandSearch.toLowerCase()) || (j.department || '').toLowerCase().includes(demandSearch.toLowerCase())) &&
      (!demandStatusFilter || 
        (demandStatusFilter === 'open_jds' && j.status === 'open') ||
        (demandStatusFilter === 'fulfilled' && j.status === 'closed') ||
        (demandStatusFilter === 'open_positions' && j.status === 'open' && (j.num_resources || 1) > (j.hired_count || 0))
      )
    );
  }, [allJobDemands, demandPmFilter, demandDeptFilter, demandSearch, demandStatusFilter]);

  const totalDemand = filteredJobDemands.length;
  const totalDemandPages = Math.ceil(totalDemand / demandPageSize);
  const demandStartIndex = (demandCurrentPage - 1) * demandPageSize;
  const demandEndIndex = Math.min(demandStartIndex + demandPageSize, totalDemand);
  const paginatedJobDemands = filteredJobDemands.slice(demandStartIndex, demandStartIndex + demandPageSize);

  if (loading && candidates.length === 0) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-talentstream-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Synchronizing RMG Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-10">
      <input
        type="file"
        id="rmg-resume-upload"
        className="hidden"
        accept=".pdf,.zip"
        onChange={handleFileUpload}
      />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
        <div className="space-y-1">
          <h1 className="text-3xl font-manrope font-black text-slate-900 dark:text-white tracking-tight uppercase">Resource Management</h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold tracking-tight uppercase opacity-70">Monitor availability, demand, and optimize global resource allocation.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl mr-2">
            <button
              onClick={() => setActiveDashboardView('talent')}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeDashboardView === 'talent' ? 'bg-white dark:bg-white/10 text-talentstream-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
            >
              <Users className="w-3.5 h-3.5" /> Talent Pool
            </button>
            <button
              onClick={() => setActiveDashboardView('demand')}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeDashboardView === 'demand' ? 'bg-white dark:bg-white/10 text-talentstream-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
            >
              <Layers className="w-3.5 h-3.5" /> Overall Demand
            </button>
          </div>

          <button
            onClick={() => fetchData()}
            disabled={loading}
            title="Refresh data"
            className="p-2.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-500 hover:text-talentstream-primary hover:border-talentstream-primary/30 transition-all disabled:opacity-40 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => document.getElementById('rmg-resume-upload')?.click()}
            className={`group relative flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black text-white transition-all shadow-lg overflow-hidden ${uploadStatus === 'error' ? 'bg-rose-500 shadow-rose-500/20' :
                uploadStatus === 'success' ? 'bg-emerald-500 shadow-emerald-500/20' :
                  'bg-talentstream-primary hover:opacity-90 active:scale-[0.98]'
              }`}
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> :
              uploadStatus === 'error' ? <AlertCircle className="w-4 h-4" /> :
                uploadStatus === 'success' ? <CheckCircle className="w-4 h-4" /> :
                  <Upload className="w-4 h-4" />}
            <span className="uppercase tracking-widest">
              {isUploading ? 'Uploading...' :
                uploadStatus === 'error' ? 'Error' :
                  uploadStatus === 'success' ? 'Success' :
                    'Upload Resumes'}
            </span>
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Analytics Grid */}
        {activeDashboardView === 'talent' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-1">
          {[
            { label: 'Total Resources', value: analytics?.total_talent || 0, icon: Users, color: 'text-blue-500', bgColor: 'bg-blue-50/50 dark:bg-blue-500/5', borderColor: 'border-blue-100 dark:border-blue-500/10', filterKey: null },
            { label: 'Bench / Available', value: analytics?.bench || 0, icon: Layers, color: 'text-emerald-500', bgColor: 'bg-emerald-50/50 dark:bg-emerald-500/5', borderColor: 'border-emerald-100 dark:border-emerald-500/10', filterKey: 'bench' },
            { label: 'Allocated', value: analytics?.allocated || 0, icon: Zap, color: 'text-blue-600', bgColor: 'bg-indigo-50/50 dark:bg-indigo-600/5', borderColor: 'border-indigo-100 dark:border-indigo-600/10', filterKey: 'allocated' },
            { label: 'Earmarked', value: analytics?.earmarked || 0, icon: Bell, color: 'text-purple-500', bgColor: 'bg-purple-50/50 dark:bg-purple-500/5', borderColor: 'border-purple-100 dark:border-purple-500/10', filterKey: 'earmarked' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => {
                if (activeDashboardView === 'demand') return;
                setActiveFilter(activeFilter === stat.filterKey ? null : stat.filterKey);
              }}
              className={`group relative p-4 rounded-2xl border ${stat.borderColor} ${stat.bgColor} transition-all duration-200 ${activeDashboardView === 'talent' ? 'cursor-pointer' : 'cursor-default opacity-80 grayscale-[30%]'
                } ${activeFilter === stat.filterKey && activeDashboardView === 'talent'
                  ? 'ring-2 ring-talentstream-primary border-talentstream-primary/50'
                  : (activeDashboardView === 'talent' ? 'hover:shadow-md dark:hover:bg-white/[0.02]' : '')
                }`}
            >
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">{stat.label}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-manrope font-black text-slate-900 dark:text-white tracking-tighter">{stat.value}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor} ${stat.color} border border-current/10 shadow-inner ${activeDashboardView === 'talent' ? 'group-hover:scale-110' : ''} transition-transform duration-300`}>
                  <stat.icon size={20} strokeWidth={2.5} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        )}


        {activeDashboardView === 'talent' ? (
          <>
            {/* Table Component */}
            <div className="bg-white dark:bg-[#0b0e14]/60 border border-slate-200 dark:border-white/10 rounded-3xl shadow-xl overflow-visible backdrop-blur-sm">
              {/* Table Toolbar */}
              <div className="px-5 py-3 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-white dark:bg-transparent rounded-t-3xl">
                <div className="flex items-center gap-3">
                  <h2 className="font-semibold text-sm text-slate-900 dark:text-white">Talent Pool</h2>
                  <span className="bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 text-[10px] px-2 py-0.5 rounded-full font-bold leading-tight uppercase">
                    {analytics?.total_talent || candidates.length} TOTAL
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative hidden sm:block">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by name, employee id, or skills..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-64 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-talentstream-primary focus:ring-1 focus:ring-talentstream-primary transition-shadow"
                    />
                  </div>
                  {(activeFilter || selectedStatuses.length > 0 || selectedExperienceRange !== 'all' || selectedSkills.length > 0) && (
                    <button
                      onClick={() => {
                        setActiveFilter(null);
                        setSelectedStatuses([]);
                        setSelectedExperienceRange('all');
                        setSelectedSkills([]);
                        setCurrentPage(1);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-md text-[9px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
                    >
                      <X className="w-3 h-3" /> Clear Filters
                    </button>
                  )}
                  <div className="relative">
                    <button
                      onClick={() => setShowFilterPopover(!showFilterPopover)}
                      className={`text-slate-600 dark:text-white/70 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex items-center gap-1.5 text-xs font-medium py-1.5 px-3 rounded-md ${showFilterPopover ? 'bg-slate-100 dark:bg-white/10' : ''}`}
                    >
                      <Filter className="w-3.5 h-3.5" /> Filters
                    </button>
                    <AnimatePresence>
                      {showFilterPopover && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#151b28] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 p-4 normal-case text-xs text-slate-700 dark:text-slate-200"
                        >
                          <div className="space-y-4 relative">
                            <button
                              onClick={() => setShowFilterPopover(false)}
                              className="absolute -top-1 -right-1 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                              title="Close Filters"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            {/* Status Header */}
                            <div>
                              <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-400 mb-2">Status</h4>
                              <div className="grid grid-cols-2 gap-2">
                                {[
                                  { label: 'Bench', value: 'bench' },
                                  { label: 'Allocated', value: 'allocated' },
                                  { label: 'Earmarked', value: 'earmarked' },
                                  { label: 'In-Process', value: 'interview_scheduled' }
                                ].map(item => (
                                  <label key={item.value} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={selectedStatuses.includes(item.value)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedStatuses([...selectedStatuses, item.value]);
                                        } else {
                                          setSelectedStatuses(selectedStatuses.filter(s => s !== item.value));
                                        }
                                        setCurrentPage(1);
                                      }}
                                      className="rounded border-slate-300 text-talentstream-primary focus:ring-talentstream-primary cursor-pointer"
                                    />
                                    <span>{item.label}</span>
                                  </label>
                                ))}
                              </div>
                            </div>

                            {/* Experience Range */}
                            <div>
                              <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-400 mb-2">Experience</h4>
                              <div className="grid grid-cols-3 gap-1.5">
                                {[
                                  { label: 'All', value: 'all' },
                                  { label: '0-2 Yrs', value: '0-2' },
                                  { label: '3-5 Yrs', value: '3-5' },
                                  { label: '5-8 Yrs', value: '5-8' },
                                  { label: '8+ Yrs', value: '8+' }
                                ].map(item => (
                                  <button
                                    key={item.value}
                                    onClick={() => {
                                      setSelectedExperienceRange(item.value);
                                      setCurrentPage(1);
                                    }}
                                    className={`px-2 py-1 rounded-md text-[9px] font-semibold transition-all border ${selectedExperienceRange === item.value
                                        ? 'bg-talentstream-primary text-white border-transparent'
                                        : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5 hover:bg-slate-100'
                                      }`}
                                  >
                                    {item.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Popular Skills */}
                            <div>
                              <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-400 mb-2">Popular Skills</h4>
                              <div className="flex flex-wrap gap-1.5">
                                {['Python', 'React', 'Java', 'Docker', 'Kubernetes', 'C++'].map(skill => {
                                  const isSelected = selectedSkills.includes(skill);
                                  return (
                                    <button
                                      key={skill}
                                      onClick={() => {
                                        if (isSelected) {
                                          setSelectedSkills(selectedSkills.filter(s => s !== skill));
                                        } else {
                                          setSelectedSkills([...selectedSkills, skill]);
                                        }
                                        setCurrentPage(1);
                                      }}
                                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all border ${isSelected
                                          ? 'bg-talentstream-primary text-white border-transparent'
                                          : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5 hover:bg-slate-100'
                                        }`}
                                    >
                                      {skill}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Clear / Apply Actions */}
                            <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-white/5">
                              <button
                                onClick={() => {
                                  setSelectedStatuses([]);
                                  setSelectedExperienceRange('all');
                                  setSelectedSkills([]);
                                  setCurrentPage(1);
                                  setShowFilterPopover(false);
                                }}
                                className="text-[10px] font-bold text-rose-500 uppercase tracking-widest hover:underline"
                              >
                                Reset All
                              </button>
                              <button
                                onClick={() => setShowFilterPopover(false)}
                                className="px-3 py-1.5 bg-talentstream-primary text-white text-[10px] font-black uppercase tracking-widest rounded-lg"
                              >
                                Close
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/10">
                      <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Name & Role</th>
                      <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Employee ID</th>
                      <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Email Address</th>
                      <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Experience</th>
                      <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Skills</th>
                      <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-right text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    <AnimatePresence mode="popLayout">
                      {paginatedCandidates.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-20 text-center">
                            <div className="flex flex-col items-center gap-5 max-w-xs mx-auto">
                              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-dashed border-slate-300 dark:border-slate-700">
                                <Search className="w-6 h-6 text-slate-400" />
                              </div>
                              <div className="space-y-1">
                                <h4 className="text-sm font-manrope font-black text-slate-900 dark:text-white uppercase tracking-tight">No Resources Found</h4>
                                <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-relaxed">No resources found matching your current filters or search term.</p>
                              </div>
                              <div className="pt-2 w-full max-w-[200px]">
                                <button
                                  onClick={() => document.getElementById('rmg-resume-upload')?.click()}
                                  className="group relative flex items-center justify-center gap-2 px-5 py-3 w-full rounded-xl text-[10px] font-black text-white bg-talentstream-primary hover:bg-talentstream-primary/90 active:scale-[0.98] transition-all shadow-md shadow-talentstream-primary/20 overflow-hidden"
                                >
                                  <Upload className="w-4 h-4" />
                                  <span className="uppercase tracking-widest">Upload Resume</span>
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paginatedCandidates.map((cand, idx) => {
                          return (
                            <motion.tr
                              key={cand.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: (idx % pageSize) * 0.03 }}
                              onClick={() => setProfileModal({ isOpen: true, cand: cand })}
                              className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group/row cursor-pointer"
                            >
                              <td className="px-6 py-2.5">
                                <div className="flex items-center gap-3">
                                  <div className="relative shrink-0">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden shadow-sm">
                                      <img
                                        src={`https://api.dicebear.com/7.x/shapes/svg?seed=${cand.id}`}
                                        className="w-full h-full object-cover opacity-80 dark:mix-blend-screen"
                                      />
                                    </div>
                                  </div>
                                  <div className="min-w-0 flex flex-col justify-center">
                                    <p className="text-xs font-black text-slate-900 dark:text-white group-hover/row:text-talentstream-primary transition-colors truncate tracking-tight">{cand.name || 'Anonymous'}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-2.5">
                                <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 font-bold tracking-widest">{cand.employee_id || '---'}</span>
                              </td>
                              <td className="px-6 py-2.5">
                                <span className="text-[11px] text-slate-700 dark:text-slate-300 font-bold truncate tracking-tight block max-w-[160px]">{cand.email || '---'}</span>
                              </td>
                              <td className="px-6 py-2.5">
                                <span className={`text-xs font-bold ${cand.experience_years == null ? 'text-slate-400 dark:text-slate-600' :
                                    cand.experience_years >= 5 ? 'text-slate-600 dark:text-slate-300' :
                                      cand.experience_years >= 3 ? 'text-slate-600 dark:text-slate-300' :
                                        'text-slate-500 dark:text-slate-400'
                                  }`}>
                                  {cand.experience_years != null ? `${cand.experience_years} yrs` : '—'}
                                </span>
                              </td>
                              <td className="px-6 py-3">
                                <div className="flex gap-1 items-center justify-start">
                                  {parseSkills(cand.primary_skills || cand.skills).slice(0, 2).map((skill: string, i: number) => (
                                    <span key={i} className="px-1.5 py-0.5 flex items-center gap-1 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-md text-[8px] font-black text-blue-700 dark:text-blue-300 uppercase tracking-tighter shadow-sm">
                                      <span className="opacity-80 scale-90">{getTechIcon(skill.trim())}</span> {skill.trim()}
                                    </span>
                                  ))}
                                  {parseSkills(cand.primary_skills || cand.skills).length > 2 && (
                                    <div
                                      title={parseSkills(cand.primary_skills || cand.skills).join(', ')}
                                      className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-md text-[8px] font-black text-slate-500 cursor-default"
                                    >
                                      +{parseSkills(cand.primary_skills || cand.skills).length - 2}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-2.5">
                                <div className="flex flex-col items-start gap-1">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${getStatusStyle(cand.status)}`}>
                                    {cand.status === 'interview_scheduled' ? 'In-Process' :
                                      (cand.status === 'selected_for_allocation' || cand.status === 'earmarked' || cand.status === 'enmarked') ? 'Earmarked' :
                                        String(cand.status || 'Available').replace(/_/g, ' ')}
                                  </span>
                                  {cand.created_at && (
                                    <div className="flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase tracking-widest" title={`Uploaded: ${new Date(cand.created_at).toLocaleString()}`}>
                                      <Clock size={8} /> {calculateAging(cand.created_at)}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-2.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {cand.status === 'selected_for_allocation' && (
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        setLoading(true);
                                        try {
                                          await updateCandidate(cand.id, { status: 'allocated' });
                                          await fetchData();
                                        } catch (err) {
                                          console.error('Final allocation failed', err);
                                        } finally {
                                          setLoading(false);
                                        }
                                      }}
                                      title="Complete Allocation"
                                      className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all shadow-none"
                                    >
                                      <Zap size={10} /> Allocate
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setProfileModal({ isOpen: true, cand: cand }); }}
                                    title="View Details"
                                    className="p-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all"
                                  >
                                    <Eye size={11} />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setEditModal({ isOpen: true, cand: cand }); }}
                                    title="Edit Resource"
                                    className="p-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-500 hover:text-talentstream-primary hover:border-talentstream-primary/30 transition-all"
                                  >
                                    <Edit2 size={11} />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setDeleteModal({ isOpen: true, id: cand.id, name: cand.name }); }}
                                    title="Delete Resource"
                                    className="p-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-500 hover:text-rose-500 hover:border-rose-300 dark:hover:border-rose-500/30 transition-all"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              </td>
                            </motion.tr>
                          );
                        })
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              {!loading && totalCandidates > 0 && (
                <div className="px-5 py-3 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] rounded-b-3xl flex flex-col sm:flex-row justify-between items-center gap-4 sticky bottom-0 z-20">
                  <div className="flex items-center gap-4">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                      Showing <strong className="text-slate-900 dark:text-white font-semibold">{totalCandidates === 0 ? 0 : startIndex + 1}–{endIndex}</strong> of <strong className="text-slate-900 dark:text-white font-semibold">{totalCandidates}</strong> resources
                    </span>
                    <div className="flex items-center gap-2 border-l border-slate-200 dark:border-white/10 pl-4 hidden sm:flex">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Rows per page:</span>
                      <select
                        value={pageSize}
                        onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                        className="bg-white dark:bg-[#1a2130] border border-slate-200 dark:border-white/10 rounded-md px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-white/80 focus:outline-none focus:border-talentstream-primary cursor-pointer"
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
                            className={`min-w-[28px] h-7 px-1 rounded-md flex items-center justify-center text-[11px] font-semibold transition-colors cursor-pointer ${currentPage === num
                                ? 'bg-talentstream-primary text-white shadow-sm'
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
          </>
        ) : (
          /* ── CONSOLIDATED DEMAND TAB ── */
          <div className="space-y-4">
            {/* Demand Health Strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-1">
              {[
                { label: 'Open JDs', value: allJobDemands.filter(j => j.status === 'open').length, color: 'text-emerald-500', bgColor: 'bg-emerald-50/50 dark:bg-emerald-500/5', borderColor: 'border-emerald-100 dark:border-emerald-500/10', icon: Briefcase, filter: 'open_jds' },
                { label: 'Fulfilled', value: allJobDemands.filter(j => j.status === 'closed').length, color: 'text-indigo-600', bgColor: 'bg-indigo-50/50 dark:bg-indigo-600/5', borderColor: 'border-indigo-100 dark:border-indigo-600/10', icon: CheckCircle, filter: 'fulfilled' },
                { label: 'Open Positions', value: allJobDemands.filter(j => j.status === 'open').reduce((a, j) => a + Math.max(0, (j.num_resources || 1) - (j.hired_count || 0)), 0), color: 'text-amber-500', bgColor: 'bg-amber-50/50 dark:bg-amber-500/5', borderColor: 'border-amber-100 dark:border-amber-500/10', icon: Target, filter: 'open_positions' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setDemandStatusFilter(demandStatusFilter === stat.filter ? null : stat.filter)}
                  className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${stat.borderColor} ${stat.bgColor} ${demandStatusFilter === stat.filter
                      ? 'ring-2 ring-talentstream-primary border-talentstream-primary/50 scale-[1.02] shadow-md'
                      : 'hover:shadow-md dark:hover:bg-white/[0.02]'
                    }`}
                >
                  <div className="relative flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">{stat.label}</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-manrope font-black text-slate-900 dark:text-white tracking-tighter">{stat.value}</span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bgColor} ${stat.color} border border-current/10 shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                      <stat.icon size={20} strokeWidth={2.5} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="bg-white dark:bg-[#0b0e14]/60 border border-slate-200 dark:border-white/10 rounded-3xl shadow-xl overflow-visible backdrop-blur-sm">
              {/* Table Toolbar */}
              <div className="px-5 py-3 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-transparent rounded-t-3xl">
                <div className="flex items-center gap-3">
                  <h2 className="font-semibold text-sm text-slate-900 dark:text-white">Active Mandates</h2>
                  <span className="bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 text-[10px] px-2 py-0.5 rounded-full font-bold leading-tight uppercase">
                    {allJobDemands.length} TOTAL
                  </span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end flex-wrap">
                  <div className="relative flex-1 sm:flex-none max-w-xs sm:w-48">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search role or department..."
                      value={demandSearch}
                      onChange={e => setDemandSearch(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-talentstream-primary focus:ring-1 focus:ring-talentstream-primary transition-shadow"
                    />
                  </div>

                  {/* PM Filter */}
                  <select
                    value={demandPmFilter}
                    onChange={e => setDemandPmFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-md text-xs text-slate-700 dark:text-white/80 focus:outline-none focus:border-talentstream-primary cursor-pointer"
                  >
                    <option value="">All PMs</option>
                    {[...new Set(allJobDemands.map(j => j.pm_name))].map(pm => (
                      <option key={pm} value={pm}>{pm}</option>
                    ))}
                  </select>

                  {/* Department Filter */}
                  <select
                    value={demandDeptFilter}
                    onChange={e => setDemandDeptFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-md text-xs text-slate-700 dark:text-white/80 focus:outline-none focus:border-talentstream-primary cursor-pointer"
                  >
                    <option value="">All Departments</option>
                    {[...new Set(allJobDemands.map(j => j.department).filter(Boolean))].map(dept => (
                      <option key={dept!} value={dept!}>{dept}</option>
                    ))}
                  </select>

                  {(demandPmFilter || demandDeptFilter || demandSearch || demandStatusFilter) && (
                    <button
                      onClick={() => { setDemandPmFilter(''); setDemandDeptFilter(''); setDemandSearch(''); setDemandStatusFilter(null); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-500 border border-dashed border-slate-300 dark:border-white/10 transition-colors"
                    >
                      <X className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>
              </div>

              {filteredJobDemands.length === 0 ? (
                <div className="bg-white dark:bg-[#0b0e14]/60 border border-dashed border-slate-200 dark:border-white/10 rounded-b-3xl p-20 flex flex-col items-center justify-center text-center">
                  <Briefcase className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
                  <h3 className="text-lg font-manrope font-black text-slate-900 dark:text-white uppercase tracking-tight">No Job Demands Found</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest max-w-xs mt-2">No demands match your current filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto custom-scrollbar">
                  <div className="grid grid-cols-[repeat(15,minmax(0,1fr))] min-w-[1000px] text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider py-2.5 bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/10 px-5 items-center">
                    <div className="col-span-1">JD ID</div>
                    <div className="col-span-3">Role & Dept</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-1">Position</div>
                    <div className="col-span-2">Fulfillment</div>
                    <div className="col-span-2">Matches</div>
                    <div className="col-span-2">Created By</div>
                    <div className="col-span-1 text-center">Created</div>
                    <div className="col-span-2 text-right pr-4">Actions</div>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-white/5 rounded-b-3xl overflow-hidden">
                    {paginatedJobDemands.map((job, i) => {
                        const fillPct = job.num_resources > 0 ? Math.min(100, Math.round((job.hired_count / job.num_resources) * 100)) : 0;
                        const isFull = job.hired_count >= job.num_resources;
                        const hasNoMatches = job.match_count === 0;
                        const statusColors: Record<string, string> = {
                          open: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
                          in_review: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
                          closed: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20',
                        };
                        const statusLabel: Record<string, string> = {
                          open: 'Open',
                          in_review: 'In Review',
                          closed: 'Fulfilled',
                        };

                        const created = new Date(job.created_at);
                        const daysAgo = Math.floor((Date.now() - created.getTime()) / 86400000);
                        const createdLabel = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`;
                        const createdUrgencyClass = daysAgo > 14 ? 'text-rose-500 font-extrabold' : daysAgo > 7 ? 'text-amber-500 font-bold' : 'text-slate-500 dark:text-slate-400 font-medium';

                        return (
                          <motion.div
                            key={job.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.02 }}
                            onClick={() => navigate(`/rmg/demand/${job.id}/matches`)}
                            className="grid grid-cols-[repeat(15,minmax(0,1fr))] min-w-[1000px] items-center px-5 h-[56px] hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group cursor-pointer"
                          >
                            {/* JD ID */}
                            <div className="col-span-1" onClick={(e) => { e.stopPropagation(); handleViewJd(job); }}>
                              <span className="font-mono text-[10px] font-bold text-indigo-650 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 px-2 py-0.5 rounded cursor-pointer transition-colors shadow-sm" title="View Job Description">
                                {shortId(job.id)}
                              </span>
                            </div>

                            {/* Role & Dept */}
                            <div className="col-span-3 pr-4 truncate flex flex-col justify-center h-full">
                              <div className="text-sm font-semibold text-slate-900 dark:text-white truncate flex items-center gap-1.5 group/title">
                                <span className="truncate">{job.title}</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleViewJd(job); }}
                                  className="p-0.5 rounded bg-slate-100 dark:bg-white/5 opacity-0 group-hover/title:opacity-100 transition-all text-slate-400 hover:text-talentstream-primary"
                                  title="View Job Description"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{job.department || job.role_category}</div>
                            </div>

                            {/* Status */}
                            <div className="col-span-1">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusColors[job.status] || statusColors.closed}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${job.status === 'open' ? 'bg-emerald-500' : job.status === 'closed' ? 'bg-indigo-500' : 'bg-amber-500'}`} />
                                {statusLabel[job.status] || 'Closed'}
                              </span>
                            </div>

                            {/* Position */}
                            <div className="col-span-1 text-xs text-slate-600 dark:text-white/80 font-medium">
                              {job.hired_count}/{job.num_resources}
                            </div>

                            {/* Fulfillment progress */}
                            <div className="col-span-2 flex items-center gap-3 pr-6 h-full">
                              <div className="flex-grow h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden w-full">
                                <div
                                  className="h-full bg-talentstream-primary rounded-full"
                                  style={{ width: `${fillPct}%` }}
                                ></div>
                              </div>
                              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 min-w-[24px]">
                                {fillPct}%
                              </span>
                            </div>

                            {/* Matches */}
                            <div className="col-span-2">
                              {job.match_count > 0 ? (
                                <span
                                  onClick={(e) => { e.stopPropagation(); handleJdClick(job.id, job.title, job.pm_name); }}
                                  className="text-talentstream-primary cursor-pointer hover:underline text-xs font-semibold"
                                >
                                  {job.match_count} matches
                                </span>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-500 text-xs font-medium cursor-not-allowed">
                                  {job.matching_status === 'completed' ? 'No match found' : '0 matches'}
                                </span>
                              )}
                            </div>

                            {/* PM Name */}
                            <div className="col-span-2 pr-3 truncate flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-talentstream-primary/10 border border-talentstream-primary/20 flex items-center justify-center shrink-0">
                                <span className="text-[8px] font-black text-talentstream-primary">
                                  {job.pm_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </span>
                              </div>
                              <span className="text-xs text-slate-600 dark:text-white/80 font-medium truncate" title={job.pm_name}>
                                {job.pm_name}
                              </span>
                            </div>

                            {/* Created */}
                            <div className={`col-span-1 text-center text-xs truncate ${createdUrgencyClass}`}>
                              {createdLabel}
                            </div>

                            {/* Actions */}
                            <div className="col-span-2 flex justify-end items-center gap-1.5">
                              {isFull ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest border border-emerald-500/20 whitespace-nowrap">✓ Fulfilled</span>
                              ) : hasNoMatches ? (
                                <button
                                  disabled={job.matching_status !== 'completed'}
                                  onClick={(e) => { e.stopPropagation(); setExtReqModal({ isOpen: true, job }); }}
                                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
                                    job.matching_status === 'completed' 
                                      ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border-blue-500/20 cursor-pointer' 
                                      : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-white/10 cursor-not-allowed opacity-50'
                                  }`}
                                  title={job.matching_status === 'completed' ? 'Create an external hiring requisition' : 'Available when job matching is completed with no matches'}
                                >
                                  <ArrowRight className="w-3 h-3" /> Ext. Req
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleJdClick(job.id, job.title, job.pm_name); }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-talentstream-primary hover:opacity-90 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm whitespace-nowrap"
                                >
                                  {job.match_count} Matches <ArrowRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Pagination Footer */}
              {!loading && totalDemand > 0 && (
                <div className="px-5 py-3 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] rounded-b-3xl flex flex-col sm:flex-row justify-between items-center gap-4 sticky bottom-0 z-20">
                  <div className="flex items-center gap-4">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                      Showing <strong className="text-slate-900 dark:text-white font-semibold">{totalDemand === 0 ? 0 : demandStartIndex + 1}–{demandEndIndex}</strong> of <strong className="text-slate-900 dark:text-white font-semibold">{totalDemand}</strong> mandates
                    </span>
                    <div className="flex items-center gap-2 border-l border-slate-200 dark:border-white/10 pl-4 hidden sm:flex">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Rows per page:</span>
                      <select
                        value={demandPageSize}
                        onChange={(e) => { setDemandPageSize(Number(e.target.value)); setDemandCurrentPage(1); }}
                        className="bg-white dark:bg-[#1a2130] border border-slate-200 dark:border-white/10 rounded-md px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-white/80 focus:outline-none focus:border-talentstream-primary cursor-pointer"
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
                      onClick={() => setDemandCurrentPage(p => Math.max(1, p - 1))}
                      disabled={demandCurrentPage === 1}
                      className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/70 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed text-[11px] font-semibold transition-colors"
                    >
                      Previous
                    </button>

                    <div className="flex items-center px-1">
                      {getPageNumbers(demandCurrentPage, totalDemandPages).map((num, i) => (
                        num === '...' ? (
                          <span key={`ell-${i}`} className="px-1.5 text-[11px] font-bold text-slate-400">...</span>
                        ) : (
                          <button
                            key={num}
                            onClick={() => setDemandCurrentPage(num as number)}
                            className={`min-w-[28px] h-7 px-1 rounded-md flex items-center justify-center text-[11px] font-semibold transition-colors cursor-pointer ${demandCurrentPage === num
                                ? 'bg-talentstream-primary text-white shadow-sm'
                                : 'text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/10'
                              }`}
                          >
                            {num}
                          </button>
                        )
                      ))}
                    </div>

                    <button
                      onClick={() => setDemandCurrentPage(p => Math.min(totalDemandPages, p + 1))}
                      disabled={demandCurrentPage === totalDemandPages || totalDemandPages === 0}
                      className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/70 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed text-[11px] font-semibold transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {createPortal(
        <>
          <AnimatePresence>
            {deleteModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-8 rounded-3xl shadow-2xl max-w-sm w-full"
            >
              <h3 className="text-xl font-manrope font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Delete Resource</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-8">Are you sure you want to delete this candidate: <strong className="text-slate-900 dark:text-white">{deleteModal.name}</strong>?</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteModal({ isOpen: false, id: '', name: '' })} className="px-4 py-2 text-xs font-bold text-slate-500 uppercase hover:text-white transition-colors">Abort</button>
                <button onClick={confirmDelete} className="px-6 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all">Confirm</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editModal.isOpen && editModal.cand && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.form
              onSubmit={confirmEdit}
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-8 py-3.5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-white/10 flex items-center justify-center">
                    <Edit2 className="w-4 h-4 text-talentstream-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-manrope font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">Edit Resource Details</h3>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest opacity-70">Update candidate profile metadata and specialization.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditModal({ isOpen: false, cand: null })}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-widest">Resource Name *</label>
                    <input
                      type="text" required value={editModal.cand.name}
                      onChange={e => setEditModal({ ...editModal, cand: { ...editModal.cand!, name: e.target.value } })}
                      className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-talentstream-primary/20 focus:border-talentstream-primary transition-all font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">Employee ID</label>
                    <input
                      type="text" value={editModal.cand.employee_id || ''}
                      onChange={e => setEditModal({ ...editModal, cand: { ...editModal.cand!, employee_id: e.target.value } })}
                      className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-talentstream-primary transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">Specialization / Role</label>
                    <input
                      type="text" value={editModal.cand.role_category || ''}
                      onChange={e => setEditModal({ ...editModal, cand: { ...editModal.cand!, role_category: e.target.value } })}
                      className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-talentstream-primary transition-all font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">Email Address</label>
                    <input
                      type="email" value={editModal.cand.email || ''}
                      onChange={e => setEditModal({ ...editModal, cand: { ...editModal.cand!, email: e.target.value } })}
                      className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-talentstream-primary transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">Phone Number</label>
                    <input
                      type="text" value={editModal.cand.phone || ''}
                      onChange={e => setEditModal({ ...editModal, cand: { ...editModal.cand!, phone: e.target.value } })}
                      className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-talentstream-primary transition-all font-mono"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">Primary Skills</label>
                    <textarea
                      rows={3} value={editModal.cand.skills || ''}
                      onChange={e => setEditModal({ ...editModal, cand: { ...editModal.cand!, skills: e.target.value } })}
                      className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-talentstream-primary transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="px-8 py-3.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-white/[0.02]">
                <button type="button" onClick={() => setEditModal({ isOpen: false, cand: null })} className="px-6 py-2 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
                <button type="submit" className="px-8 py-2 bg-talentstream-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-talentstream-primary/20">Update Resource</button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {profileModal.isOpen && profileModal.cand && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 pointer-events-none"
          >
            <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm pointer-events-auto -z-10" onClick={() => setProfileModal({ isOpen: false, cand: null })} />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#0b0e14] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-[95vw] max-w-[1440px] max-h-[90vh] flex flex-col relative overflow-hidden text-left pointer-events-auto font-inter"
            >
              {/* TOP HEADER */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between shrink-0 sticky top-0 z-20">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700/50 border border-slate-200 dark:border-white/10 p-0.5 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                    <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${profileModal.cand.id}`} className="w-full h-full rounded-lg object-cover mix-blend-multiply dark:mix-blend-screen opacity-80" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-manrope font-black text-slate-900 dark:text-white uppercase leading-none tracking-tight">{profileModal.cand.name}</h2>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest divide-x divide-slate-300 dark:divide-slate-700 leading-none">
                      <span className="pr-2">{profileModal.cand.employee_id || 'TEMP_ID'}</span>
                      <span className={`px-2 ${profileModal.cand.status === 'allocated' ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>{String(profileModal.cand.status || 'Available').replace(/_/g, ' ')}</span>
                      <span className="px-2">{profileModal.cand.experience_years ? `${profileModal.cand.experience_years} YRS` : 'N/A'}</span>
                      <span className="pl-2 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Immediate</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setProfileModal({ isOpen: false, cand: null })} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all rounded-lg">
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* DASHBOARD CONTENT */}
              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-white dark:bg-[#0b0e14]">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full">
                  
                  {/* LEFT COLUMN: Snapshot */}
                  <div className="lg:col-span-3 flex flex-col gap-5">
                    <div className="p-4 bg-slate-50 dark:bg-white/[0.01] border border-slate-100 dark:border-white/5 rounded-2xl shadow-sm">
                      <h3 className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                         <UserCheck size={12} /> Candidate Snapshot
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Primary Role</p>
                          <p className="text-xs font-black text-slate-800 dark:text-slate-200">{profileModal.cand.role_category || 'General'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Experience</p>
                          <p className="text-xs font-black text-slate-800 dark:text-slate-200">{profileModal.cand.experience_years ? `${profileModal.cand.experience_years} Years` : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Allocation Status</p>
                          <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${getStatusStyle(profileModal.cand.status)}`}>
                            {String(profileModal.cand.status || 'Available').replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Availability</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase">Immediate</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Contact</p>
                          <p className="text-xs font-mono text-slate-600 dark:text-slate-400 truncate" title={profileModal.cand.email || 'N/A'}>{profileModal.cand.email || 'N/A'}</p>
                          <p className="text-xs font-mono text-slate-600 dark:text-slate-400 mt-1">{profileModal.cand.phone || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {profileModal.cand.resume_url && (
                      <a href={profileModal.cand.resume_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm">
                        <FileText size={14} /> Open Resume PDF
                      </a>
                    )}
                  </div>

                  {/* CENTER COLUMN: AI Summary */}
                  <div className="lg:col-span-5 flex flex-col gap-5">
                    <div className="p-5 bg-slate-50 dark:bg-white/[0.01] border border-slate-100 dark:border-white/5 rounded-2xl shadow-sm h-full relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                      <div className="flex items-center gap-2 mb-5 relative z-10">
                        <BrainCircuit className="w-4 h-4 text-indigo-500" />
                        <h3 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">AI Candidate Summary</h3>
                      </div>
                      
                      <div className="space-y-5 relative z-10">
                        <div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                            {profileModal.cand.overall_summary || "No AI summary has been generated for this candidate yet. Match them with a job demand to generate a deep technical analysis."}
                          </p>
                        </div>

                        <div>
                          <h4 className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-200 dark:border-white/5 pb-2">Technical Strengths & Project Highlights</h4>
                          <div className="space-y-2 mt-3">
                            {(profileModal.cand.project_summary || "AI analysis pending.\nMatch candidate to evaluate technical strengths.\nWaiting for job context.").split(/(?:\n|\.\s+)/).filter(line => line.trim().length > 5).map((line, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-snug">{line.trim()}{line.trim().endsWith('.') ? '' : '.'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Skills & Expertise */}
                  <div className="lg:col-span-4 flex flex-col gap-5">
                    <div className="p-5 bg-slate-50 dark:bg-white/[0.01] border border-slate-100 dark:border-white/5 rounded-2xl shadow-sm h-full flex flex-col relative overflow-hidden">
                      <div className="flex items-center gap-2 mb-4 relative z-10">
                        <Cpu className="w-4 h-4 text-blue-500" />
                        <h3 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Skills & Expertise</h3>
                      </div>

                      <div className="space-y-5 flex-1 relative z-10">
                        <div>
                          <h4 className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-200 dark:border-white/5 pb-2">Core Stack</h4>
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {parseSkills(profileModal.cand.primary_skills || profileModal.cand.skills).map((skill, i) => (
                              <span key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-300 shadow-sm">
                                <span className="opacity-80 scale-90">{getTechIcon(skill)}</span>
                                {skill.trim()}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-200 dark:border-white/5 pb-2">Secondary Tools</h4>
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {parseSkills(profileModal.cand.secondary_skills || "Communication, Agile, Problem Solving").map((skill, i) => (
                              <span key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-400 shadow-sm">
                                <span className="opacity-80 scale-90">{getTechIcon(skill)}</span>
                                {skill.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative overflow-hidden bg-white dark:bg-[#0f141f] border border-slate-200 dark:border-white/10 p-10 rounded-[2rem] shadow-2xl text-center flex flex-col items-center w-full max-w-sm"
            >
              {/* Background glow */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-talentstream-primary/20 rounded-full blur-[3xl] opacity-50" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-[3xl] opacity-50" />

              <div className="relative mb-8 mt-2">
                <div className={`absolute inset-0 blur-xl animate-pulse ${uploadStatus === 'error' ? 'bg-rose-500/10 rounded-full' : 'bg-talentstream-primary/20 rounded-full'}`} />

                {uploadStatus === 'error' ? (
                  <div className="w-24 h-24 bg-gradient-to-tr from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700/50 rounded-[2rem] flex items-center justify-center relative shadow-inner border border-white/50 dark:border-white/10 rotate-3 transform-gpu">
                    <div className="absolute inset-[-4px] border-2 border-dashed border-rose-300 dark:border-rose-500/40 rounded-[2rem]" />
                    <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm -rotate-3 transform-gpu border border-slate-100 dark:border-white/5">
                      <AlertCircle className="w-8 h-8 text-rose-500" />
                    </div>
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-tr from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700/50 rounded-[2rem] flex items-center justify-center relative shadow-inner border border-white/50 dark:border-white/10 rotate-3 transform-gpu">
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-[-4px] border border-dashed border-talentstream-primary/40 rounded-[2rem]"
                    />
                    <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm -rotate-3 transform-gpu border border-slate-100 dark:border-white/5">
                      <Upload className="w-7 h-7 text-talentstream-primary animate-bounce" />
                    </div>
                  </div>
                )}
              </div>

              <div className="relative z-10 w-full">
                {uploadStatus === 'error' ? (
                  <div className="flex flex-col items-center">
                    <h3 className="text-xl font-black text-rose-600 dark:text-rose-500 uppercase tracking-wide mb-6">Upload Failed</h3>
                    <div className="px-6 py-4 bg-rose-50/50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-3xl mb-8 w-full">
                      <p className="text-[13px] text-rose-600 dark:text-rose-400 font-bold leading-relaxed">{uploadErrorMessage}</p>
                    </div>
                    <button
                      onClick={() => { setIsUploading(false); setUploadStatus('idle'); }}
                      className="w-full py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-full text-xs font-black uppercase tracking-widest transition-colors shadow-sm"
                    >
                      Dismiss
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-manrope font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">Uploading Resource</h3>

                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-4 relative">
                      <motion.div
                        initial={{ width: "10%" }}
                        animate={{ width: uploadStatus === 'success' ? "100%" : "80%" }}
                        transition={{ duration: uploadStatus === 'success' ? 0.5 : 10, ease: "easeOut" }}
                        className="h-full bg-talentstream-primary rounded-full relative"
                      />
                    </div>

                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest leading-relaxed mt-2 text-center">
                      {uploadStatus === 'success' ? uploadSuccessMessage : 'Extracting candidate details...'}
                      <br />
                      {uploadStatus !== 'success' && <span className="opacity-70 normal-case tracking-normal font-medium">Please do not close this window.</span>}
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
        {/* View JD Modal */}
        {viewJdModal.isOpen && viewJdModal.job && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-8 bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white dark:bg-[#0f141f] border border-slate-200 dark:border-white/10 rounded-[2rem] shadow-2xl w-[75vw] max-w-[1200px] max-h-[85vh] flex flex-col relative overflow-hidden text-left"
            >
              {/* Visual identity top-stripe */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-talentstream-primary to-indigo-500" />

              {/* Close Button at Top-Right */}
              <button
                onClick={() => setViewJdModal({ isOpen: false, job: null, description: '' })}
                className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer z-10"
                title="Close Modal"
              >
                <X size={20} />
              </button>

              <div className="p-8 flex flex-col flex-1 overflow-hidden">
                {/* Header Information */}
                <div className="mb-6 relative">
                  {/* Background glow decoration */}
                  <div className="absolute -top-10 -left-10 w-36 h-36 bg-talentstream-primary/5 rounded-full blur-2xl -z-10" />

                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-[10px] font-black text-talentstream-primary bg-talentstream-primary/10 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                      {shortId(viewJdModal.job.id)}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4">
                    <h3 className="text-2xl font-manrope font-black text-slate-900 dark:text-white tracking-tight uppercase leading-snug">
                      {viewJdModal.job.title}
                    </h3>
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${viewJdModal.job.status === 'open'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                        : viewJdModal.job.status === 'in_review'
                          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20'
                      }`}>
                      {viewJdModal.job.status === 'open' ? 'Open' : viewJdModal.job.status === 'in_review' ? 'In Review' : 'Closed / Fulfilled'}
                    </span>
                  </div>
                </div>

                {/* Structured Metadata Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Card 1: PM Owner */}
                  <div className="p-4 bg-slate-50/50 dark:bg-white/[0.01] border border-slate-200 dark:border-white/5 rounded-2xl flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-500 border border-purple-100 dark:border-purple-500/20 shrink-0">
                      <Users size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">Project Manager</span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 block truncate">
                        {viewJdModal.job.pm_name || 'Unassigned'}
                      </span>
                      {viewJdModal.job.pm_email && (
                        <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono block mt-0.5 truncate">
                          {viewJdModal.job.pm_email}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card 2: Target Experience */}
                  <div className="p-4 bg-slate-50/50 dark:bg-white/[0.01] border border-slate-200 dark:border-white/5 rounded-2xl flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-100 dark:border-amber-500/20 shrink-0">
                      <Briefcase size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">Target Experience</span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                        {viewJdModal.minExperienceYears !== undefined && viewJdModal.minExperienceYears !== null
                          ? `${viewJdModal.minExperienceYears}+ Years Required`
                          : 'Any Experience Level'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Job Description Text Area */}
                <div className="flex-1 flex flex-col min-h-0">
                  <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-2.5 flex items-center gap-2">
                    <span className="w-1 h-3.5 bg-talentstream-primary rounded-full" />
                    Job Description Details
                  </h4>
                  <div className="flex-1 overflow-y-auto bg-slate-50/30 dark:bg-black/15 border-l-4 border-talentstream-primary/45 rounded-r-2xl p-6 custom-scrollbar min-h-0">
                    <pre className="text-sm text-slate-700 dark:text-slate-300 font-sans whitespace-pre-wrap leading-relaxed">
                      {viewJdModal.description}
                    </pre>
                  </div>
                </div>

                {/* Footer Info & Action */}
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100 dark:border-white/5 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Matches count:</span>
                    <button
                      onClick={() => {
                        const jobId = viewJdModal.job!.id;
                        setViewJdModal({ isOpen: false, job: null, description: '' });
                        navigate(`/rmg/demand/${jobId}/matches`);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border border-indigo-100 dark:border-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors cursor-pointer"
                    >
                      {viewJdModal.job.match_count} candidate(s) matched
                      <ArrowRight size={10} />
                    </button>
                  </div>
                  <button
                    onClick={() => setViewJdModal({ isOpen: false, job: null, description: '' })}
                    className="px-6 py-2.5 bg-talentstream-primary hover:opacity-90 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md hover:shadow-lg cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* External Requisition Modal */}
        {extReqModal.isOpen && extReqModal.job && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          >
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setExtReqModal({ isOpen: false, job: null })} />
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white dark:bg-[#0f1219] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-100 dark:border-blue-500/20 shadow-inner">
                  <ArrowRight className="w-8 h-8 text-blue-500" />
                </div>
                
                <h3 className="text-xl font-manrope font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                  Initiate External Requisition
                </h3>
                
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed max-w-sm">
                  You are about to initiate an external hiring requisition for <span className="font-bold text-slate-800 dark:text-slate-200">"{extReqModal.job.title}"</span>. No internal candidates were found matching the required criteria.
                </p>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setExtReqModal({ isOpen: false, job: null })}
                    className="flex-1 py-3.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-[11px] font-black uppercase tracking-widest transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // Integration pending - just close for now
                      setExtReqModal({ isOpen: false, job: null });
                    }}
                    className="flex-1 py-3.5 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 cursor-pointer flex items-center justify-center gap-2"
                  >
                    Confirm <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
          </AnimatePresence>
        </>,
        document.body
      )}
    </div>
  );
};
