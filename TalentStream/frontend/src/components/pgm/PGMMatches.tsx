import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFloating, autoUpdate, offset, flip, shift, FloatingPortal } from '@floating-ui/react';
import {
   ArrowLeft, CheckCircle2, Loader2, Zap, Star, ChevronRight, 
   Shield, Target, Award, MoreVertical, X, FileText, ArrowUpRight
} from 'lucide-react';
import { pollJobResults, getJob, updateMatchStatus, scheduleInterview, updateHiringDecision } from '../../app/services/api';
import { getTechIcon } from '../../utils/techIcons';

// ── Helpers ──────────────────────────────────────────────────────────────────

const scoreColor = (score: number) => {
   if (score >= 90) return 'text-emerald-500 dark:text-emerald-400 bg-emerald-500';
   if (score >= 70) return 'text-green-500 dark:text-green-400 bg-green-500';
   if (score >= 50) return 'text-amber-500 dark:text-amber-400 bg-amber-500';
   return 'text-rose-500 dark:text-rose-400 bg-rose-500';
};

const statusBadge = (status: string, l1_status?: string, l2_status?: string, hiring_decision?: string) => {
   const classes = "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ";
   
   if (hiring_decision?.toLowerCase() === 'hired' || l2_status === 'cleared') {
      return <span className={classes + "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"}>Selected</span>;
   }
   if (status?.toLowerCase() === 'rejected' || hiring_decision?.toLowerCase() === 'rejected') {
      return <span className={classes + "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"}>Rejected</span>;
   }
   if (status === 'shortlisted') {
      if (l1_status === 'cleared') {
         return <span className={classes + "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20"}>L2 Interview</span>;
      }
      return <span className={classes + "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20"}>L1 Interview</span>;
   }
   if (status === 'pending') {
      return <span className={classes + "bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-white/40 border-slate-200 dark:border-white/[0.06]"}>Pending Review</span>;
   }
   
   return <span className={classes + "bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-white/40 border-slate-200 dark:border-white/[0.06]"}>{status}</span>;
};

interface AIJustification {
   verdict: string;
   skill_alignment: { matched: string[]; missing: string[] };
   experience_relevance: string;
   findings: string[];
   overall_summary: string;
}

const parseJustification = (raw: string | null): AIJustification | null => {
   if (!raw) return null;
   try {
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
   } catch {
      return null;
   }
};

const getUTCDate = (dateString?: string) => {
  if (!dateString) return new Date();
  return dateString.endsWith('Z') || dateString.includes('+') ? new Date(dateString) : new Date(dateString + 'Z');
};

// ── Components ──────────────────────────────────────────────────────────────

export const PGMMatches: React.FC = () => {
   const [searchParams] = useSearchParams();
   const navigate = useNavigate();
   const jobId = searchParams.get('jobId') || '';

   const [results, setResults] = useState<any[]>([]);
   const [jobTitle, setJobTitle] = useState('');
   const [jobData, setJobData] = useState<any>(null);
   const [loading, setLoading] = useState(true);
   const [actionLoading, setActionLoading] = useState<string | null>(null);

   // Pagination State
   const [currentPage, setCurrentPage] = useState(1);
   const [rowsPerPage, setRowsPerPage] = useState(10);

   // Drawer & Menu State
   const [drawerCandidate, setDrawerCandidate] = useState<any | null>(null);
   const [openMenuId, setOpenMenuId] = useState<string | null>(null);

   const { x, y, strategy, refs, isPositioned } = useFloating({
      open: openMenuId !== null,
      placement: 'bottom-end',
      whileElementsMounted: autoUpdate,
      middleware: [offset(4), flip(), shift({ padding: 8 })]
   });

   useEffect(() => {
      const closeMenu = (e: MouseEvent) => {
         if ((e.target as HTMLElement).closest('.action-menu-popover')) return;
         setOpenMenuId(null);
      };
      document.addEventListener('mousedown', closeMenu);
      return () => document.removeEventListener('mousedown', closeMenu);
   }, []);

   const loadResults = async () => {
      if (!jobId) return;
      try {
         const [res, job] = await Promise.all([
            pollJobResults(jobId),
            getJob(jobId),
         ]);
         setResults(res.results);
         setJobTitle(job.title);
         setJobData(job);
      } catch (err) {
         console.error('Failed to load results', err);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      loadResults();
   }, [jobId]);

   const handleStatusChange = async (matchId: string, status: 'shortlisted' | 'rejected') => {
      setActionLoading(matchId);
      try {
         await updateMatchStatus(matchId, status);
         await loadResults();
         if (drawerCandidate && drawerCandidate.match_id === matchId) {
            setDrawerCandidate(null);
         }
      } catch (err) {
         console.error('Failed to update status', err);
      } finally {
         setActionLoading(null);
      }
   };
   const handleViewResume = async (matchId: string) => {
      const c = results.find(r => r.match_id === matchId);
      if (!c || !c.resume_url) {
         // Fallback if no resume URL
         alert("Resume not found for this candidate.");
         return;
      }
      
      setActionLoading('resume_' + matchId);
      // Simulate fetch from blob storage for UX
      await new Promise(resolve => setTimeout(resolve, 800));
      window.open(c.resume_url, '_blank');
      setActionLoading(null);
      setOpenMenuId(null);
   };

   // Stats & Pagination
   const shortlisted = results.filter(r => r.status === 'shortlisted').length;
   const pending = results.filter(r => r.status === 'pending').length;
   const avgScore = results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + (r.match_score || 0), 0) / results.length)
      : 0;
   const strongMatches = results.filter(r => (r.match_score || 0) >= 70).length;

   const totalPages = Math.ceil(results.length / rowsPerPage) || 1;
   const paginatedResults = results.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

   const localFulfilledCount = results.filter(r => r.hiring_decision?.toLowerCase() === 'hired' || r.l2_status === 'cleared').length;

   return (
      <div className="absolute inset-0 bg-slate-100 dark:bg-[#0B1220] text-slate-900 dark:text-white font-inter p-4 md:p-6 lg:p-8 flex flex-col overflow-hidden">
         <div className="flex-1 max-w-[1600px] w-full mx-auto bg-white dark:bg-[#111827] rounded-[16px] border border-slate-200 dark:border-white/[0.06] shadow-2xl flex flex-col overflow-hidden">
            
            {/* ── Top Header ─────────────────────────────────────────────────── */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-4 relative shrink-0">
               <div className="flex items-center gap-4">
                  <button
                     onClick={() => navigate('/pgm/dashboard')}
                     className="p-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-500 dark:text-white/60 transition-all shadow-sm group"
                  >
                     <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  </button>
                  <div>
                     <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                           AI Match Results
                        </h1>
                        {(() => {
                           if (!jobData?.last_activity_at) return null;
                           const isFulfilled = jobData.status === 'closed' || (jobData.num_resources !== undefined && localFulfilledCount >= jobData.num_resources);
                           if (isFulfilled) return null;
                           
                           const activityDate = getUTCDate(jobData.last_activity_at);
                           const diff = activityDate.getTime() + (3 * 24 * 60 * 60 * 1000) - new Date().getTime();
                           
                           return (
                              <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide border ${(() => {
                                 if (diff <= 0) return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
                                 const hours = Math.floor(diff / (1000 * 60 * 60));
                                 if (hours < 24) return 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse';
                                 return 'bg-slate-500/10 text-slate-500 dark:text-white/50 border-slate-500/20';
                              })()}`}>
                                 {(() => {
                                    if (diff <= 0) return '🔒 Locked due to Inactivity';
                                    const hours = Math.floor(diff / (1000 * 60 * 60));
                                    if (hours < 24) return `⚠️ Action Required: Locks in ${hours}h`;
                                    return `⏱️ Auto-locks in ${Math.floor(hours / 24)}d ${hours % 24}h`;
                                 })()}
                              </div>
                           );
                        })()}
                     </div>
                     <div className="flex items-center gap-2 mt-1 text-[12px] text-slate-500 dark:text-white/50 font-medium">
                        <span className="text-slate-900 dark:text-white/80 font-bold">{jobTitle || 'Loading...'}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-white/20"></span>
                        <span>{results.length} candidates evaluated</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-white/20"></span>
                        <span>JD #{jobId.split('-')[0].toUpperCase()}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-white/20"></span>
                        <span>Updated just now</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* ── KPI Section ────────────────────────────────────────────────── */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-transparent shrink-0">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                     { 
                        label: 'Positions Filled', 
                        value: `${localFulfilledCount} / ${jobData?.num_resources || '-'}`, 
                        icon: Target, 
                        trend: jobData && jobData.num_resources > 0 && localFulfilledCount >= jobData.num_resources 
                               ? 'Fulfilled' 
                               : `${Math.max(0, (jobData?.num_resources || 0) - localFulfilledCount)} Open` 
                     },
                     { label: 'Avg Match Score', value: `${avgScore}%`, icon: Award, trend: '+5% vs avg' },
                     { label: 'Strong Matches', value: strongMatches, icon: Zap, trend: 'Top tier' },
                     { label: 'Pending Review', value: pending, icon: Shield, trend: null },
                  ].map((s, i) => (
                     <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white dark:bg-[#172033] border border-slate-200 dark:border-white/[0.06] rounded-[12px] p-4 shadow-sm flex flex-col justify-between h-[72px]"
                     >
                        <div className="flex justify-between items-start">
                           <span className="text-[11px] font-bold text-slate-500 dark:text-white/50 uppercase tracking-wide">{s.label}</span>
                           <s.icon className="w-3.5 h-3.5 text-slate-400 dark:text-white/30" />
                        </div>
                        <div className="flex items-end justify-between">
                           <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">{s.value}</span>
                           {s.trend && (
                              <span className="text-[10px] font-bold tracking-wide text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-500/20 uppercase">
                                 {s.trend}
                              </span>
                           )}
                        </div>
                     </motion.div>
                  ))}
               </div>
            </div>

            {/* ── AI Recommendation + Candidate Table ──────────────────────── */}
            <div className="flex-1 flex flex-col bg-white dark:bg-transparent min-h-0">
               
               {/* AI Recommendations Banner */}
               {strongMatches > 0 && (
                  <div className="px-6 py-3 border-b border-indigo-100 dark:border-white/[0.06] bg-indigo-50/50 dark:bg-indigo-500/[0.02] flex items-center gap-3 shrink-0">
                     <div className="bg-indigo-100 dark:bg-indigo-500/10 p-1.5 rounded-lg border border-indigo-200 dark:border-indigo-500/20 shadow-sm shrink-0">
                        <Star className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                     </div>
                     <div className="min-w-0">
                        <p className="text-[12px] text-indigo-700 dark:text-indigo-200/70 truncate">
                           <strong className="font-extrabold text-indigo-900 dark:text-indigo-200 mr-1">AI Recommendation:</strong> 
                           Found {strongMatches} strong matches. The top candidate aligns perfectly with your requirements.
                        </p>
                     </div>
                  </div>
               )}

               {/* Table Header */}
               <div className="grid grid-cols-[40px_2.5fr_2fr_1.5fr_2.5fr_1fr_110px] gap-4 px-6 py-2.5 border-b border-slate-200 dark:border-white/[0.06] bg-slate-50/80 dark:bg-[#172033]/50 text-[10.5px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest shrink-0">
                  <div className="text-center">#</div>
                  <div>Candidate</div>
                  <div>Skills</div>
                  <div>Match Score</div>
                  <div>AI Assessment</div>
                  <div>Status</div>
                  <div className="text-right">Actions</div>
               </div>

               {/* Table Body */}
               <div className="flex-1 overflow-y-auto custom-scrollbar relative min-h-0">
                  {loading ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-4">
                     <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                     <span className="text-sm font-bold tracking-widest uppercase text-slate-400 dark:text-white/30">Analyzing candidates...</span>
                  </div>
               ) : results.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-500 dark:text-white/40">
                     <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center mb-2">
                        <Target className="w-6 h-6 opacity-50" />
                     </div>
                     <span className="text-[14px] font-semibold">No candidates found yet.</span>
                     <span className="text-[12px] opacity-70">Waiting for matching pipeline to process.</span>
                  </div>
               ) : (
                  <div className="flex flex-col">
                     {paginatedResults.map((r, i) => {
                        const ai = parseJustification(r.ai_justification);
                        const isSelected = drawerCandidate?.match_id === r.match_id;
                        const scoreColorClass = scoreColor(r.match_score || 0).split(' ')[0]; 
                        const scoreBgClass = scoreColor(r.match_score || 0).split(' ')[2]; 
                        const isStrong = (r.match_score || 0) >= 70;
                        const matchedSkills = ai?.skill_alignment?.matched?.slice(0, 5) || [];
                        const extraSkills = (ai?.skill_alignment?.matched?.length || 0) - 5;

                        return (
                           <div 
                              key={r.match_id}
                              onClick={() => setDrawerCandidate(r)}
                              className={`grid grid-cols-[40px_2.5fr_2fr_1.5fr_2.5fr_1fr_110px] gap-4 px-6 py-3 items-center cursor-pointer transition-all duration-200 border-b border-slate-100 dark:border-white/[0.04] last:border-0 even:bg-slate-50/50 dark:even:bg-white/[0.02] ${
                                 isSelected 
                                 ? 'bg-indigo-50/50 dark:bg-indigo-500/[0.05] shadow-[inset_4px_0_0_0_#6366f1]' 
                                 : 'hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:-translate-y-px hover:shadow-sm'
                              }`}
                           >
                              {/* Rank */}
                              <div className="text-center text-[12px] font-bold text-slate-400 dark:text-white/30">
                                 {i + 1}
                              </div>

                              {/* Candidate Info */}
                              <div className="flex items-center gap-3.5 min-w-0">
                                 <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-[#172033] border border-indigo-100 dark:border-white/[0.06] shadow-sm flex items-center justify-center text-[13px] font-extrabold text-indigo-600 dark:text-white/80 shrink-0">
                                    {r.candidate_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '?'}
                                 </div>
                                 <div className="min-w-0">
                                    <div className="text-[14px] font-bold text-slate-900 dark:text-white truncate tracking-tight">
                                       {r.candidate_name}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 text-[11.5px] font-medium text-slate-500 dark:text-white/50 truncate">
                                       <span className="truncate">{r.candidate_role || 'Software Engineer'}</span>
                                       <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-white/20"></span>
                                       <span>{r.experience_years ? `${r.experience_years} Yrs` : 'N/A'}</span>
                                    </div>
                                 </div>
                              </div>

                              {/* Skills */}
                              <div className="flex flex-wrap gap-1.5">
                                 {matchedSkills.map((skill, idx) => (
                                    <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-[#172033] border border-slate-200 dark:border-white/[0.06] rounded-md text-[10.5px] font-semibold text-slate-700 dark:text-white/70 shadow-sm">
                                       {getTechIcon(skill)}
                                       {skill}
                                    </div>
                                 ))}
                                 {extraSkills > 0 && (
                                    <div className="flex items-center px-2 py-1 bg-transparent border border-slate-200 dark:border-white/[0.06] rounded-md text-[10.5px] font-semibold text-slate-500 dark:text-white/40">
                                       +{extraSkills}
                                    </div>
                                 )}
                              </div>

                              {/* Match Score */}
                              <div className="pr-4">
                                 <div className="flex items-center gap-2 mb-2">
                                    <span className={`text-[15px] font-extrabold tracking-tight ${scoreColorClass}`}>
                                       {r.match_score ? `${Math.round(r.match_score)}%` : '—'}
                                    </span>
                                 </div>
                                 <div className="h-1.5 w-full bg-slate-100 dark:bg-[#172033] rounded-full overflow-hidden shadow-inner">
                                    <div 
                                       className={`h-full ${scoreBgClass} rounded-full`}
                                       style={{ width: `${r.match_score || 0}%` }}
                                    />
                                 </div>
                              </div>

                              {/* AI Assessment */}
                              <div className="min-w-0 pr-4">
                                 <div className="flex items-center gap-2 mb-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full shadow-sm ${isStrong ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-amber-500 shadow-amber-500/50'}`}></span>
                                    <span className={`text-[12px] font-bold ${isStrong ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                                       {isStrong ? 'Strong Match' : 'Partial Match'}
                                    </span>
                                 </div>
                                 <p className="text-[12px] font-medium text-slate-500 dark:text-white/50 truncate">
                                    {isStrong ? 'Highly aligned with role requirements.' : 'Some skills match, potential for growth.'}
                                 </p>
                              </div>

                              {/* Status */}
                              <div>
                                 {statusBadge(r.status, r.l1_status, r.l2_status, r.hiring_decision)}
                              </div>

                              {/* Actions */}
                              <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                 <button 
                                    className="px-3 py-1.5 text-[11.5px] font-bold text-slate-600 dark:text-white/70 hover:text-indigo-600 dark:hover:text-white bg-white dark:bg-[#172033] hover:bg-indigo-50 dark:hover:bg-white/10 rounded-lg transition-all shadow-sm border border-slate-200 dark:border-white/[0.06] hover:border-indigo-200 dark:hover:border-white/10"
                                    onClick={() => setDrawerCandidate(r)}
                                 >
                                    Review
                                 </button>
                                 <button
                                    ref={openMenuId === r.match_id ? refs.setReference : null}
                                    onClick={(e) => { 
                                       e.stopPropagation(); 
                                       setOpenMenuId(openMenuId === r.match_id ? null : r.match_id); 
                                    }}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-white/40 dark:hover:text-white dark:hover:bg-white/10 transition-colors border border-transparent"
                                 >
                                    <MoreVertical className="w-4 h-4" />
                                 </button>
                              </div>
                           </div>
                        );
                     })}
                  </div>
               )}
               </div>

               {/* Pagination (Static) */}
               {!loading && results.length > 0 && (
                  <div className="shrink-0 px-6 py-2 border-t border-slate-200 dark:border-white/[0.06] bg-slate-50/50 dark:bg-[#172033]/50 flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-white/50">
                     <div>
                        Showing <span className="font-bold text-slate-900 dark:text-white">{(currentPage - 1) * rowsPerPage + 1}</span> to <span className="font-bold text-slate-900 dark:text-white">{Math.min(currentPage * rowsPerPage, results.length)}</span> of <span className="font-bold text-slate-900 dark:text-white">{results.length}</span> candidates
                     </div>
                     <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                           <span>Rows per page:</span>
                           <select 
                              value={rowsPerPage} 
                              onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                              className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded px-2 py-1 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-semibold"
                           >
                              <option value={5}>5</option>
                              <option value={7}>7</option>
                              <option value={10}>10</option>
                              <option value={20}>20</option>
                           </select>
                        </div>
                        <div className="flex items-center gap-1 bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-lg p-1">
                           <button 
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              disabled={currentPage === 1}
                              className="px-2.5 py-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-700 dark:text-white/80 font-semibold"
                           >
                              Previous
                           </button>
                           {Array.from({ length: totalPages }).map((_, idx) => {
                              const pageNum = idx + 1;
                              if (totalPages > 5 && pageNum !== 1 && pageNum !== totalPages && Math.abs(pageNum - currentPage) > 1) {
                                 if (pageNum === 2 || pageNum === totalPages - 1) return <span key={idx} className="px-1 text-slate-400">...</span>;
                                 return null;
                              }
                              return (
                                 <button 
                                    key={idx}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`min-w-[28px] h-7 flex items-center justify-center rounded-md transition-colors text-[13px] ${
                                       currentPage === pageNum 
                                       ? 'bg-indigo-600 text-white font-bold shadow-sm' 
                                       : 'text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/10 font-semibold'
                                    }`}
                                 >
                                    {pageNum}
                                 </button>
                              );
                           })}
                           <button 
                              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                              disabled={currentPage === totalPages}
                              className="px-2.5 py-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-700 dark:text-white/80 font-semibold"
                           >
                              Next
                           </button>
                        </div>
                     </div>
                  </div>
               )}
            </div>

            {/* ── Footer / What's Next ── */}
            <div className="shrink-0 px-6 py-3.5 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-transparent flex flex-col md:flex-row items-center justify-between gap-4">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-lg shadow-sm">
                     <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                     <h4 className="text-[13px] font-bold text-slate-900 dark:text-white leading-tight">Fast-track recruitment</h4>
                     <p className="text-[11px] font-medium text-slate-500 dark:text-white/50 mt-0.5">Use the candidate actions menu to directly schedule interviews and make hiring decisions.</p>
                  </div>
               </div>
            </div>
         </div>

         {/* ── Dropdown Portal ─────────────────────────────────────────────── */}
         <FloatingPortal>
            <AnimatePresence>
               {openMenuId && (
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
                     className="w-52 bg-white dark:bg-[#172033] border border-slate-200 dark:border-white/[0.06] rounded-xl shadow-2xl overflow-hidden py-1.5 action-menu-popover"
                  >
                     <div className="px-3 py-2 border-b border-slate-100 dark:border-white/[0.06] mb-1">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest">Candidate Actions</span>
                     </div>
                     <button 
                        onClick={() => handleViewResume(openMenuId!)}
                        disabled={actionLoading === 'resume_' + openMenuId}
                        className="w-full text-left px-4 py-2 text-[12.5px] font-semibold text-slate-700 dark:text-white/80 hover:bg-slate-50 dark:hover:bg-white/[0.04] flex items-center gap-2.5 transition-colors disabled:opacity-50 disabled:cursor-wait"
                     >
                        {actionLoading === 'resume_' + openMenuId ? (
                           <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                        ) : (
                           <FileText className="w-4 h-4 text-slate-400" />
                        )}
                        {actionLoading === 'resume_' + openMenuId ? 'Fetching Resume...' : 'View Full Resume'}
                     </button>
                     <button 
                        onClick={() => { setDrawerCandidate(results.find(r => r.match_id === openMenuId)); setOpenMenuId(null); }}
                        className="w-full text-left px-4 py-2 text-[12.5px] font-semibold text-slate-700 dark:text-white/80 hover:bg-slate-50 dark:hover:bg-white/[0.04] flex items-center gap-2.5 transition-colors"
                     >
                        <Target className="w-4 h-4 text-slate-400" /> View Match Analysis
                     </button>
                     <div className="my-1.5 border-t border-slate-100 dark:border-white/[0.06]" />
                     
                     {(() => {
                        const c = results.find(r => r.match_id === openMenuId);
                        if (!c) return null;

                        const decision = c.hiring_decision?.toLowerCase();
                        const isRejected = c.status === 'rejected' || decision === 'rejected';
                        const isHired = decision === 'hired';

                        if (isRejected || isHired) return null;

                        const isPending = c.status === 'pending';
                        const isL1 = c.status === 'shortlisted' && c.l1_status !== 'cleared';
                        const isL2 = c.status === 'shortlisted' && c.l1_status === 'cleared';

                        const isFulfilled = jobData?.status === 'closed' || (jobData?.num_resources !== undefined && localFulfilledCount >= jobData.num_resources);
                        const diff = jobData?.last_activity_at ? getUTCDate(jobData.last_activity_at).getTime() + (3 * 24 * 60 * 60 * 1000) - new Date().getTime() : 1;
                        const isLocked = !isFulfilled && diff <= 0;

                        if (isLocked) return null;

                        return (
                           <>
                              {isPending && !isFulfilled && (
                                 <button 
                                    onClick={() => { handleStatusChange(openMenuId, 'shortlisted'); setOpenMenuId(null); }}
                                    className="w-full text-left px-4 py-2 text-[12.5px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 flex items-center gap-2.5 transition-colors"
                                 >
                                    <CheckCircle2 className="w-4 h-4" /> Shortlist Candidate
                                 </button>
                              )}

                              {isL1 && !isFulfilled && (
                                 <button 
                                    onClick={async () => { 
                                       await scheduleInterview(openMenuId, 'L1', 'cleared'); 
                                       await scheduleInterview(openMenuId, 'L2', 'scheduled'); 
                                       await loadResults();
                                       setOpenMenuId(null); 
                                    }}
                                    className="w-full text-left px-4 py-2 text-[12.5px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 flex items-center gap-2.5 transition-colors"
                                 >
                                    <ChevronRight className="w-4 h-4" /> Move to L2 Interview
                                 </button>
                              )}

                              {isL2 && !isFulfilled && (
                                 <button 
                                    onClick={async () => { 
                                       await updateHiringDecision(openMenuId, 'hired'); 
                                       await loadResults();
                                       setOpenMenuId(null); 
                                    }}
                                    className="w-full text-left px-4 py-2 text-[12.5px] font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 flex items-center gap-2.5 transition-colors"
                                 >
                                    <Award className="w-4 h-4" /> Mark as Selected
                                 </button>
                              )}

                              <button 
                                 onClick={async () => { 
                                    await updateHiringDecision(openMenuId, 'rejected');
                                    await loadResults();
                                    setOpenMenuId(null); 
                                 }}
                                 className="w-full text-left px-4 py-2 text-[12.5px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2.5 transition-colors"
                              >
                                 <X className="w-4 h-4" /> Reject
                              </button>
                           </>
                        );
                     })()}
                  </motion.div>
               )}
            </AnimatePresence>
         </FloatingPortal>

         {/* ── Candidate Details Drawer ──────────────────────────────────────── */}
         <AnimatePresence>
            {drawerCandidate && (
               <>
                  <motion.div
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     onClick={() => setDrawerCandidate(null)}
                     className="fixed inset-0 bg-slate-900/20 dark:bg-black/60 backdrop-blur-sm z-[9990]"
                  />
                  <motion.div
                     initial={{ x: '100%' }}
                     animate={{ x: 0 }}
                     exit={{ x: '100%' }}
                     transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                     className="fixed top-0 right-0 h-full w-full max-w-[480px] bg-white dark:bg-[#111827] border-l border-slate-200 dark:border-white/[0.06] shadow-2xl z-[9995] flex flex-col font-inter"
                  >
                     {/* Drawer Header */}
                     <div className="px-6 py-5 border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between bg-slate-50/50 dark:bg-[#172033]">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-full bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/[0.06] shadow-sm flex items-center justify-center font-extrabold text-[15px] text-slate-700 dark:text-white/80">
                              {drawerCandidate.candidate_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '?'}
                           </div>
                           <div>
                              <h2 className="text-[17px] font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight">
                                 {drawerCandidate.candidate_name}
                              </h2>
                              <p className="text-[13px] text-slate-500 dark:text-white/50 font-medium mt-0.5">
                                 {drawerCandidate.candidate_role || 'Software Engineer'}
                              </p>
                           </div>
                        </div>
                        <button 
                           onClick={() => setDrawerCandidate(null)}
                           className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 dark:text-white/50 transition-colors"
                        >
                           <X className="w-5 h-5" />
                        </button>
                     </div>

                     {/* Drawer Content */}
                     <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white dark:bg-[#111827]">
                        
                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-4">
                           <div className="bg-slate-50 dark:bg-[#172033] rounded-xl p-4 border border-slate-100 dark:border-white/[0.06] shadow-sm">
                              <span className="text-[10px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest block mb-1">Match Score</span>
                              <div className={`text-2xl font-extrabold tracking-tight ${scoreColor(drawerCandidate.match_score || 0).split(' ')[0]}`}>
                                 {Math.round(drawerCandidate.match_score || 0)}%
                              </div>
                           </div>
                           <div className="bg-slate-50 dark:bg-[#172033] rounded-xl p-4 border border-slate-100 dark:border-white/[0.06] shadow-sm flex flex-col justify-center">
                              <span className="text-[10px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest block mb-2">Current Status</span>
                              <div>
                                 {statusBadge(drawerCandidate.status, drawerCandidate.l1_status, drawerCandidate.l2_status, drawerCandidate.hiring_decision)}
                              </div>
                           </div>
                        </div>

                        {/* AI Summary */}
                        {parseJustification(drawerCandidate.ai_justification) && (
                           <div className="space-y-7">
                              <div>
                                 <h3 className="text-[13px] font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                                    <Star className="w-4 h-4 text-indigo-500" /> AI Executive Summary
                                 </h3>
                                 <p className="text-[13px] text-slate-600 dark:text-white/70 leading-relaxed bg-indigo-50/50 dark:bg-indigo-500/[0.03] p-4 rounded-xl border border-indigo-100 dark:border-indigo-500/10 shadow-sm">
                                    {parseJustification(drawerCandidate.ai_justification)?.overall_summary}
                                 </p>
                              </div>

                              <div>
                                 <h3 className="text-[13px] font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                                    <Zap className="w-4 h-4 text-emerald-500" /> Key Strengths
                                 </h3>
                                 <ul className="space-y-3">
                                    {(parseJustification(drawerCandidate.ai_justification)?.findings || []).map((f: string, i: number) => (
                                       <li key={i} className="flex items-start gap-2.5 text-[13px] font-medium text-slate-600 dark:text-white/60 leading-relaxed">
                                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                          <span>{f}</span>
                                       </li>
                                    ))}
                                 </ul>
                              </div>

                              <div>
                                 <h3 className="text-[13px] font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                                    <Target className="w-4 h-4 text-indigo-500" /> Skill Alignment
                                 </h3>
                                 {(() => {
                                    const ai = parseJustification(drawerCandidate.ai_justification);
                                    const matched = ai?.skill_alignment?.matched || [];
                                    const missing = ai?.skill_alignment?.missing || [];
                                    return (
                                       <div className="space-y-5 bg-slate-50 dark:bg-[#172033] p-4 rounded-xl border border-slate-100 dark:border-white/[0.06] shadow-sm">
                                          <div>
                                             <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-2.5">Verified Matches</span>
                                             <div className="flex flex-wrap gap-2">
                                                {matched.map((s: string, i: number) => (
                                                   <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/[0.06] rounded-md text-[11.5px] font-bold text-slate-700 dark:text-white/80 shadow-sm">
                                                      {getTechIcon(s)} {s}
                                                   </div>
                                                ))}
                                             </div>
                                          </div>
                                          {missing.length > 0 && (
                                             <div>
                                                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest block mb-2.5 mt-2 border-t border-slate-200 dark:border-white/[0.06] pt-4">Missing Capabilities</span>
                                                <div className="flex flex-wrap gap-2">
                                                   {missing.map((s: string, i: number) => (
                                                      <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-[#111827] border border-rose-100 dark:border-rose-500/20 rounded-md text-[11.5px] font-bold text-rose-700 dark:text-rose-300 shadow-sm">
                                                         <X className="w-3.5 h-3.5" /> {s}
                                                      </div>
                                                   ))}
                                                </div>
                                             </div>
                                          )}
                                       </div>
                                    );
                                 })()}
                              </div>
                           </div>
                        )}
                     </div>

                     {/* Drawer Footer Actions */}
                     {(() => {
                        const decision = drawerCandidate.hiring_decision?.toLowerCase();
                        const isRejected = drawerCandidate.status === 'rejected' || decision === 'rejected';
                        const isHired = decision === 'hired';

                        if (isRejected || isHired) return null;

                        const isPending = drawerCandidate.status === 'pending';
                        const isL1 = drawerCandidate.status === 'shortlisted' && drawerCandidate.l1_status !== 'cleared';
                        const isL2 = drawerCandidate.status === 'shortlisted' && drawerCandidate.l1_status === 'cleared';

                        const isFulfilled = jobData?.status === 'closed' || (jobData?.num_resources !== undefined && localFulfilledCount >= jobData.num_resources);

                        return (
                           <div className="p-6 border-t border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-[#172033] flex gap-3 mt-auto">
                              <button 
                                 onClick={async () => {
                                    await updateHiringDecision(drawerCandidate.match_id, 'rejected');
                                    await loadResults();
                                    setDrawerCandidate(null);
                                 }}
                                 className="flex-1 px-4 py-2.5 bg-white dark:bg-[#111827] hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-white/[0.06] hover:border-rose-200 dark:hover:border-rose-500/30 rounded-xl text-[13px] font-bold transition-all shadow-sm"
                              >
                                 Reject
                              </button>
                              
                              {isPending && !isFulfilled && (
                                 <button 
                                    onClick={() => handleStatusChange(drawerCandidate.match_id, 'shortlisted')}
                                    className="flex-[2] px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl text-[13px] font-bold transition-all shadow-sm flex items-center justify-center gap-2 border border-transparent"
                                 >
                                    <CheckCircle2 className="w-4 h-4" /> Shortlist Candidate
                                 </button>
                              )}

                              {isL1 && !isFulfilled && (
                                 <button 
                                    onClick={async () => { 
                                       await scheduleInterview(drawerCandidate.match_id, 'L1', 'cleared'); 
                                       await scheduleInterview(drawerCandidate.match_id, 'L2', 'scheduled'); 
                                       await loadResults();
                                       setDrawerCandidate({ ...drawerCandidate, l1_status: 'cleared', l2_status: 'scheduled' });
                                    }}
                                    className="flex-[2] px-4 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-xl text-[13px] font-bold transition-all shadow-sm flex items-center justify-center gap-2 border border-transparent"
                                 >
                                    <ChevronRight className="w-4 h-4" /> Move to L2 Interview
                                 </button>
                              )}

                              {isL2 && !isFulfilled && (
                                 <button 
                                    onClick={async () => { 
                                       await updateHiringDecision(drawerCandidate.match_id, 'hired'); 
                                       await loadResults();
                                       setDrawerCandidate(null);
                                    }}
                                    className="flex-[2] px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-xl text-[13px] font-bold transition-all shadow-sm flex items-center justify-center gap-2 border border-transparent"
                                 >
                                    <Award className="w-4 h-4" /> Mark as Selected
                                 </button>
                              )}
                           </div>
                        );
                     })()}
                  </motion.div>
               </>
            )}
         </AnimatePresence>

      </div>
   );
};
