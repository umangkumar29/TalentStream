import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useNavigate, useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Users,
  Loader2,
  Zap,
  Eye,
  X,
  BrainCircuit,
  Target,
  Cpu,
  Database,
  Mail,
  Phone,
  FileText,
  Briefcase
} from 'lucide-react';
import { pollJobResults, getJob, updateCandidate } from '../../app/services/api';
import { getTechIcon } from '../../utils/techIcons';

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

const parseSkills = (skills: any): string[] => {
  if (!skills) return [];
  if (Array.isArray(skills)) return skills;
  if (typeof skills === 'string') return skills.split(',').filter(s => s.trim());
  return [];
};

const parseJustification = (raw: string | null): any => {
  if (!raw) return null;
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
};

export const RMGMatches: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [matches, setMatches] = useState<any[]>([]);
  const [jobTitle, setJobTitle] = useState('');
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Profile Detail Drawer/Modal state
  const [profileModal, setProfileModal] = useState<{isOpen: boolean, cand: any | null}>({isOpen: false, cand: null});

  const loadData = async () => {
    if (!jobId) return;
    try {
      setLoading(true);
      const [res, job] = await Promise.all([
        pollJobResults(jobId),
        getJob(jobId),
      ]);
      setMatches(res.results || []);
      setJobTitle(job.title);
      setProjectName(job.department || 'Unknown Project');
    } catch (err) {
      console.error('Failed to load RMG matches', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [jobId]);

  const handleCandidateStatusUpdate = async (candidateId: string, newStatus: string) => {
    setActionLoading(candidateId);
    try {
      await updateCandidate(candidateId, { status: newStatus });
      await loadData();
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="rmg-dashboard space-y-6 max-w-[1400px] mx-auto pb-8">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-1">
        <button
          onClick={() => navigate('/rmg/overview', { state: { defaultView: 'demand' } })}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 transition-all shadow-sm group"
          title="Back to Demand"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-manrope font-black tracking-tight text-slate-900 dark:text-white uppercase">
            Job Demand Matches
          </h1>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wide">
            {jobTitle ? (
              <>
                <span className="text-slate-900 dark:text-slate-200 font-extrabold">{jobTitle}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-white/20" />
                <span className="text-slate-600 dark:text-slate-400 font-bold">Project: {projectName}</span>
              </>
            ) : (
              <span className="text-slate-400">Loading Job Details...</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Content Grid ──────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#0b0e14]/60 shadow-xl border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden flex flex-col min-h-[550px] backdrop-blur-sm">
        
        {/* Table Header */}
        <div className="hidden lg:grid grid-cols-[2fr_2fr_1.2fr_1.5fr_1.5fr_120px] gap-4 px-6 py-3 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest shrink-0">
          <span>Candidate ({matches.length})</span>
          <span>Skill Alignment</span>
          <span>Match Score</span>
          <span>PM Pipeline</span>
          <span>RMG Status</span>
          <span className="text-right">Actions</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-3 custom-scrollbar">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-talentstream-primary animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Retrieving matched candidates...</p>
            </div>
          ) : !matches || matches.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">No Candidates Matched</h4>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest max-w-xs mx-auto">There are no candidates associated or matched with this job demand yet.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {matches.map((match, i) => {
                const isSelected = match.hiring_decision === 'Hired' || match.status === 'selected' || match.status === 'hired';
                const isRejected = match.hiring_decision === 'Rejected' || match.status === 'rejected';
                let pipelineLabel = 'Pending Review';
                let pipelineStyle = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';

                if (isSelected) {
                  pipelineLabel = 'Selected';
                  pipelineStyle = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
                } else if (isRejected) {
                  pipelineLabel = 'Rejected';
                  pipelineStyle = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
                } else if (match.status && match.status !== 'pending') {
                  pipelineLabel = 'In Process';
                  pipelineStyle = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
                }

                const ai = parseJustification(match.ai_justification);
                const matchedSkills = ai?.skill_alignment?.matched || parseSkills(match.candidate_skills);
                const missingSkills = ai?.skill_alignment?.missing || [];

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={match.match_id}
                    onClick={() => setProfileModal({ isOpen: true, cand: match })}
                    className="p-4 bg-slate-50/50 dark:bg-white/[0.01] border border-slate-200 dark:border-white/5 rounded-2xl hover:border-slate-300 dark:hover:border-white/10 hover:shadow-md transition-all cursor-pointer flex flex-col lg:grid lg:grid-cols-[2fr_2fr_1.2fr_1.5fr_1.5fr_120px] gap-4 items-start lg:items-center group/card"
                  >
                    {/* Column 1: Candidate Profile */}
                    <div className="flex items-center gap-3 min-w-0 w-full lg:w-auto">
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700/50 border border-slate-200 dark:border-white/10 p-0.5 shadow-sm flex items-center justify-center overflow-hidden">
                          <img
                            src={`https://api.dicebear.com/7.x/shapes/svg?seed=${match.candidate_id}`}
                            className="w-full h-full rounded-lg object-cover mix-blend-multiply dark:mix-blend-screen opacity-85"
                          />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-[#0b0e14] rounded-full shadow" />
                      </div>
                      
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover/card:text-talentstream-primary transition-colors truncate max-w-[150px]">
                            {match.candidate_name}
                          </h4>
                          <span className="font-mono text-[9px] font-bold text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-white/5 px-1.5 py-0.5 rounded leading-none border border-slate-300/40 dark:border-white/5">
                            {match.candidate_employee_id || 'ID: N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          <span className="uppercase tracking-wider text-talentstream-primary">{match.candidate_role || 'General'}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-350 dark:bg-white/20" />
                          <span>{match.experience_years ? `${match.experience_years} Yrs` : 'N/A Exp'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Skill Alignment */}
                    <div className="w-full lg:w-auto">
                      {(matchedSkills.length > 0 || missingSkills.length > 0) ? (
                        <div className="flex flex-wrap gap-x-2 gap-y-1">
                          {matchedSkills.slice(0, 2).map((s: string, idx: number) => (
                            <span key={idx} className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tight flex items-center gap-1">
                              <span className="text-[8px] font-bold">✓</span> <span className="opacity-80 scale-90">{getTechIcon(s.trim())}</span> {s.trim()}
                            </span>
                          ))}
                          {matchedSkills.length > 2 && (
                            <span className="text-[8px] font-bold text-slate-400 mt-0.5">+{matchedSkills.length - 2}</span>
                          )}

                          {missingSkills.slice(0, 1).map((s: string, idx: number) => (
                            <span key={idx} className="px-1.5 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded text-[9px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-tight flex items-center gap-1">
                              <span className="text-[8px] font-bold">✗</span> <span className="opacity-80 scale-90">{getTechIcon(s.trim())}</span> {s.trim()}
                            </span>
                          ))}
                          {missingSkills.length > 1 && (
                            <span className="text-[8px] font-bold text-slate-400 mt-0.5">+{missingSkills.length - 1}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400">No skills assessed</span>
                      )}
                    </div>

                    {/* Column 3: Match Score & Progress Bar */}
                    <div className="w-full lg:w-auto flex flex-col justify-center min-w-[90px]">
                      <div className="flex items-center justify-between text-xs font-black mb-1">
                        <span className={match.match_score >= 70 ? 'text-emerald-600 dark:text-emerald-400' : match.match_score >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}>
                          {match.match_score ? `${Math.round(match.match_score)}%` : 'N/A'}
                        </span>
                      </div>
                      <div className="h-1.5 w-full max-w-[120px] bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden border border-slate-300/10">
                        <div
                          className={`h-full rounded-full ${match.match_score >= 70 ? 'bg-emerald-500' : match.match_score >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                          style={{ width: `${match.match_score || 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Column 4: PM Pipeline Status */}
                    <div className="w-full lg:w-auto">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${pipelineStyle}`}>
                        {pipelineLabel}
                      </span>
                    </div>

                    {/* Column 5: RMG Allocation Status */}
                    <div className="w-full lg:w-auto">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${getStatusStyle(match.candidate_status || 'bench')}`}>
                        {match.candidate_status === 'allocated' ? 'fulfilled' : String(match.candidate_status || 'bench').replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Column 6: Actions */}
                    <div className="w-full lg:w-auto flex items-center justify-between lg:justify-end gap-2 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-white/5 w-full">
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {match.candidate_status === 'earmarked' && (
                          <button
                            disabled={actionLoading === match.candidate_id}
                            onClick={() => handleCandidateStatusUpdate(match.candidate_id, 'allocated')}
                            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                          >
                            <Zap size={8} /> Allocate
                          </button>
                        )}
                        
                        {match.candidate_status === 'allocated' && (
                          <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                            Fulfilled
                          </span>
                        )}
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); setProfileModal({ isOpen: true, cand: match }); }}
                        className="p-1.5 bg-slate-105 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
                        title="Review details"
                      >
                        <Eye size={12} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Slide-over Right Drawer ────────────────────────────────────────── */}
      {createPortal(
        <AnimatePresence>
          {profileModal.isOpen && profileModal.cand && (() => {
            const cand = profileModal.cand;
            const ai = parseJustification(cand.ai_justification);
            return (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setProfileModal({ isOpen: false, cand: null })}
                  className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-[9990]"
                />

                {/* Drawer Container */}
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed top-0 right-0 h-full w-full max-w-[500px] bg-white dark:bg-[#0b0e14] border-l border-slate-200 dark:border-white/10 shadow-2xl z-[9995] flex flex-col text-left font-inter"
                >
                  {/* Header */}
                  <div className="px-6 py-5 border-b border-slate-205 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02] shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700/50 border border-slate-200 dark:border-white/10 p-0.5 shadow-sm flex items-center justify-center overflow-hidden">
                        <img
                          src={`https://api.dicebear.com/7.x/shapes/svg?seed=${cand.candidate_id}`}
                          className="w-full h-full rounded-lg object-cover mix-blend-multiply dark:mix-blend-screen opacity-80"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[9px] font-black text-talentstream-primary uppercase tracking-widest leading-none">
                            {cand.candidate_employee_id || 'ID: N/A'}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border leading-none ${getStatusStyle(cand.candidate_status)}`}>
                            {cand.candidate_status === 'allocated' ? 'fulfilled' : String(cand.candidate_status || 'bench').replace(/_/g, ' ')}
                          </span>
                        </div>
                        <h2 className="text-base font-manrope font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">
                          {cand.candidate_name}
                        </h2>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">
                          {cand.candidate_role || 'General'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setProfileModal({ isOpen: false, cand: null })}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 dark:text-white/50 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {/* Match score & details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 dark:bg-white/[0.01] rounded-xl p-4 border border-slate-100 dark:border-white/5 shadow-sm">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Match Score</span>
                        <div className={`text-2xl font-extrabold tracking-tight ${cand.match_score >= 70 ? 'text-emerald-500' : cand.match_score >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                          {Math.round(cand.match_score || 0)}%
                        </div>
                      </div>
                      <div className="bg-slate-50 dark:bg-white/[0.01] rounded-xl p-4 border border-slate-100 dark:border-white/5 shadow-sm flex flex-col justify-center">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Experience</span>
                        <div className="text-xl font-extrabold text-slate-900 dark:text-white">
                          {cand.experience_years ? `${cand.experience_years} Years` : 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* AI Fitment Verdict */}
                    {ai && (
                      <div className="p-4 bg-slate-50 dark:bg-white/[0.01] border border-slate-100 dark:border-white/5 rounded-2xl relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-3">
                          <BrainCircuit className="w-4 h-4 text-talentstream-primary" />
                          <h4 className="text-[9px] font-black text-slate-950 dark:text-white uppercase tracking-wider">AI Recommendation</h4>
                        </div>
                        <div className="space-y-3 text-slate-650 dark:text-slate-300 text-xs leading-relaxed font-semibold">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[8px] font-black text-slate-400 uppercase">Verdict:</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-extrabold text-white ${ai.verdict === 'Strong Match' ? 'bg-emerald-500' : ai.verdict === 'Partial Match' ? 'bg-amber-500' : 'bg-rose-500'}`}>
                              {ai.verdict || 'Match Assessment'}
                            </span>
                          </div>
                          <p>{ai.overall_summary || ai.experience_relevance}</p>
                        </div>
                      </div>
                    )}

                    {/* AI Key Findings */}
                    {ai && ai.findings && ai.findings.length > 0 && (
                      <div className="p-4 bg-white dark:bg-white/[0.01] border border-slate-200 dark:border-white/10 rounded-2xl">
                        <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Briefcase className="w-3.5 h-3.5 text-talentstream-primary" /> Key Findings
                        </h5>
                        <ul className="space-y-2">
                          {ai.findings.map((finding: string, index: number) => (
                            <li key={index} className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-talentstream-primary mt-1.5 shrink-0" />
                              <span>{finding}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Skill Alignment */}
                    <div className="space-y-4 bg-slate-50 dark:bg-white/[0.01] p-4 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
                      {/* Matched Skills */}
                      <div>
                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-2">Verified Matches</span>
                        <div className="flex flex-wrap gap-1.5">
                          {ai && ai.skill_alignment && ai.skill_alignment.matched && ai.skill_alignment.matched.length > 0 ? (
                            ai.skill_alignment.matched.map((skill: string, i: number) => (
                              <span key={i} className="px-2 py-1 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-lg text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">
                                <span className="opacity-80">{getTechIcon(skill.trim())}</span> {skill.trim()}
                              </span>
                            ))
                          ) : (
                            parseSkills(cand.candidate_skills).map((skill, i) => (
                              <span key={i} className="px-2 py-1 flex items-center gap-1.5 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-lg text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-tight">
                                <span className="opacity-80">{getTechIcon(skill.trim())}</span> {skill.trim()}
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Missing Skills */}
                      <div>
                        <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest block mb-2 border-t border-slate-200 dark:border-white/5 pt-3 mt-1">Missing Capabilities</span>
                        <div className="flex flex-wrap gap-1.5">
                          {ai && ai.skill_alignment && ai.skill_alignment.missing && ai.skill_alignment.missing.length > 0 ? (
                            ai.skill_alignment.missing.map((skill: string, i: number) => (
                              <span key={i} className="px-2 py-1 flex items-center gap-1.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-lg text-[9px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-tight">
                                <span className="opacity-80">{getTechIcon(skill.trim())}</span> {skill.trim()}
                              </span>
                            ))
                          ) : (
                            <span className="text-[9px] font-bold text-slate-400">None identified by AI assessment.</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="p-4 bg-white dark:bg-white/[0.01] border border-slate-200 dark:border-white/10 rounded-2xl space-y-3">
                      <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Contact Information</h5>
                      <div className="flex items-center gap-3">
                        <Mail size={12} className="text-slate-400" />
                        <span className="text-xs font-mono text-slate-700 dark:text-slate-300 truncate">{cand.candidate_email || 'No email provided'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone size={12} className="text-slate-400" />
                        <span className="text-xs font-mono text-slate-700 dark:text-slate-300">{cand.candidate_phone || 'No phone provided'}</span>
                      </div>
                    </div>

                    {/* Resume Document */}
                    {cand.resume_url && (
                      <div className="pt-2">
                        <a
                          href={cand.resume_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 py-2.5 bg-talentstream-primary text-white hover:bg-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md"
                        >
                          <FileText size={12} /> Open Resume PDF
                        </a>
                      </div>
                    )}
                  </div>
                </motion.div>
              </>
            );
          })()}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

