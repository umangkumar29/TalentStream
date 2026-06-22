import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MoreVertical,
  Search,
  Filter,
  Star,
  ChevronRight,
  Loader2,
  TrendingUp,
  Award,
  Clock,
  Briefcase,
  Target,
  Zap,
  ArrowRight,
  Calendar,
  X,
  Users
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { listCandidates, Candidate, fetchPMMatches, scheduleInterview, updateHiringDecision, updateCandidate } from '../../app/services/api';

const CandidateCard = ({ candidate, match, selectedJobId, onRefresh }: { candidate: Candidate, match?: any, selectedJobId?: string, onRefresh: () => void }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');

  const handleAction = async (newStatus: string) => {
    setIsProcessing(true);
    try {
      await updateCandidate(candidate.id, { status: newStatus });
      setIsMenuOpen(false);
      // Silent refresh to avoid global loader and provide smoother UX
      if (onRefresh) {
        await (onRefresh as any)(true); 
      }
    } catch (err) {
      console.error(`Failed to update status to ${newStatus}`, err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-3">
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white dark:bg-[#151b28] border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-all p-4 md:p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative group/card shadow-md dark:shadow-none ${isExpanded || isMenuOpen ? 'border-talentstream-primary/30 ring-1 ring-talentstream-primary/20 bg-slate-50 dark:bg-[#1a212e] z-[20]' : 'z-[1]'}`}
      >
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
              {candidate.name ? candidate.name.charAt(0) : '?'}
            </div>
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-[#0B101B] rounded-full shadow-lg" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-0.5">{candidate.name || 'Anonymous Candidate'}</h3>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-talentstream-on-surface-variant uppercase tracking-wider">{candidate.role_category || 'Uncategorized'}</span>
              <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-white/10" />
              <span className="text-[10px] text-slate-400 dark:text-white/30 font-bold uppercase tracking-widest leading-none mt-0.5">{candidate.employee_id || 'NO-ID'}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex gap-4 items-center flex-wrap">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest
              ${candidate.status === 'enmarked' || candidate.status === 'bench' || candidate.status === 'on bench' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
              candidate.status === 'interview_scheduled' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400' :
              candidate.status === 'selected_for_allocation' || candidate.status === 'allocated' ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400' :
                'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/50'}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${candidate.status === 'enmarked' ? 'bg-emerald-500 animate-pulse' : candidate.status === 'interview_scheduled' ? 'bg-indigo-500 animate-pulse' : candidate.status === 'selected_for_allocation' ? 'bg-blue-500 animate-pulse' : 'bg-slate-300 dark:bg-white/20'}`} />
            {candidate.status?.replace(/_/g, ' ') || 'Active'}
          </div>

          {match && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`flex items-center gap-2 px-3 py-1 rounded-full border border-talentstream-primary/30 bg-talentstream-primary/10 text-talentstream-primary text-[10px] font-black uppercase tracking-widest hover:bg-talentstream-primary transition-all hover:text-white group`}
            >
              <Target className="w-3 h-3" />
              {Math.round(match.match_score)}% Match Score
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 max-w-[240px]">
          {(candidate.skills ? candidate.skills.split(',') : ['Generalist']).slice(0, 3).map((skill: string, i: number) => (
            <span key={i} className="px-3 py-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-[10px] font-bold text-slate-500 dark:text-white/30">{skill.trim()}</span>
          ))}
        </div>

        <div className="flex items-center gap-8 min-w-[120px]">
          <div className="text-center">
            <div className="text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">{candidate.experience_years ? `${candidate.experience_years}y` : 'N/A'}</div>
            <div className="text-[9px] text-slate-400 dark:text-talentstream-on-surface-variant font-bold uppercase tracking-widest mt-1">Experience</div>
          </div>
          <div className="flex-1 flex justify-end relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-2.5 rounded-xl transition-colors ${isMenuOpen ? 'bg-talentstream-primary text-white' : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 dark:text-white/30'}`}
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#1a2235] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden p-1 backdrop-blur-xl"
                >
                  <div className="p-2 text-[9px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.2em] px-3 py-2">Candidate Actions</div>
                  
                  <button
                    disabled={isProcessing}
                    onClick={() => handleAction('enmarked')}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-emerald-500/10 rounded-xl text-xs font-bold text-slate-600 dark:text-white/70 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all group"
                  >
                    Enmark (Reserve)
                    <Star className={`w-3.5 h-3.5 ${candidate.status === 'enmarked' ? 'fill-emerald-500 text-emerald-500' : ''}`} />
                  </button>

                  <button
                    disabled={isProcessing}
                    onClick={() => setIsScheduling(true)}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-indigo-500/10 rounded-xl text-xs font-bold text-slate-600 dark:text-white/70 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all group"
                  >
                    Schedule Interview
                    <Calendar className="w-3.5 h-3.5" />
                  </button>

                  <AnimatePresence>
                    {isScheduling && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-3 pb-3 pt-1 space-y-2 border-t border-slate-100 dark:border-white/5"
                      >
                         <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Select Date & Time</div>
                         <input 
                           type="datetime-local" 
                           value={scheduledDate}
                           onChange={(e) => setScheduledDate(e.target.value)}
                           className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-slate-900 dark:text-white outline-none focus:border-indigo-500/50"
                         />
                         <div className="flex gap-2">
                           <button
                             onClick={async () => {
                               if (!scheduledDate || !match?.id) return;
                               setIsProcessing(true);
                               try {
                                 await scheduleInterview(match.id, 'L1', 'scheduled', scheduledDate);
                                 // Also update candidate status to reflect scheduled
                                 await updateCandidate(candidate.id, { status: 'interview_scheduled' });
                                 setIsScheduling(false);
                                 setIsMenuOpen(false);
                                 onRefresh();
                               } catch (err) {
                                 console.error("Failed to schedule interview", err);
                               } finally {
                                 setIsProcessing(false);
                               }
                             }}
                             disabled={!scheduledDate || isProcessing}
                             className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white text-[9px] font-bold py-1.5 rounded-lg transition-colors disabled:opacity-50"
                           >
                             Confirm
                           </button>
                           <button 
                             onClick={() => setIsScheduling(false)}
                             className="px-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-white/40 text-[9px] font-bold py-1.5 rounded-lg transition-colors"
                           >
                             Cancel
                           </button>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="h-px bg-slate-100 dark:bg-white/5 my-1" />

                  <button
                    disabled={isProcessing}
                    onClick={() => handleAction('selected_for_allocation')}
                    className="w-full flex items-center justify-between px-3 py-3 hover:bg-blue-500/10 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 transition-all group"
                  >
                    Select for Allocation
                    <Zap className="w-3.5 h-3.5 fill-current" />
                  </button>
                  
                  {isProcessing && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-black/50 flex items-center justify-center">
                       <Loader2 className="w-5 h-5 text-talentstream-primary animate-spin" />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isExpanded && match && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-slate-50/50 dark:bg-[#1a212e]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-8 mt-2 shadow-xl relative">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Score Summary */}
                <div className="lg:w-1/3 flex flex-col gap-4">
                  <div className="p-6 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 dark:from-indigo-500/10 dark:to-purple-500/10 border border-slate-200 dark:border-white/5 rounded-2xl">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em]">Match Score</span>
                      <Zap className="w-4 h-4 text-talentstream-primary animate-pulse" />
                    </div>
                    <div className="text-5xl font-manrope font-black text-slate-900 dark:text-white mb-2 leading-none">
                      {Math.round(match.match_score)}<span className="text-xl text-talentstream-primary">%</span>
                    </div>
                  </div>
                </div>

                {/* Analysis */}
                <div className="lg:flex-1 space-y-4">
                   <h4 className="flex items-center gap-2 text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.15em]">
                      Match Insights
                   </h4>
                   <div className="bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-2xl p-6">
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                         {match.ai_justification}
                      </p>
                   </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const PMTalentPool: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filtering context
  const selectedJobId = location.state?.jobId;
  const selectedJobTitle = location.state?.jobTitle;

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [candidateData, matchData] = await Promise.all([
        listCandidates(),
        fetchPMMatches()
      ]);
      setCandidates(candidateData);
      setMatches(matchData);
    } catch (err) {
      console.error('Failed to load talent pool data', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredCandidates = candidates.filter(c => {
    const candidateId = String(c.id).toLowerCase();
    const match = matches.find(m => String(m.candidate_id).toLowerCase() === candidateId);
    
    // If a job is selected, only show candidates matched to that job
    if (selectedJobId && (!match || String(match.job_id) !== String(selectedJobId))) return false;

    // Search Filter
    const matchesSearch =
      searchQuery === '' ||
      (c.name && c.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.employee_id && c.employee_id.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSearch;
  });

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto py-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-manrope font-extrabold text-slate-900 dark:text-white tracking-tight">
            {selectedJobTitle ? `Matches for ${selectedJobTitle}` : 'Global Talent Pool'}
          </h1>
          <div className="flex items-center gap-4 mt-4">
             {selectedJobId && (
               <button 
                 onClick={() => navigate('/pm/dashboard')}
                 className="text-xs font-bold text-talentstream-primary hover:underline flex items-center gap-1"
               >
                 <ArrowRight className="w-3 h-3 rotate-180" /> Back to Dashboard
               </button>
             )}
             <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-white/10" />
             <p className="text-xs font-medium text-slate-500 dark:text-white/40 uppercase tracking-widest">
               {filteredCandidates.length} Profiles Found
             </p>
          </div>
        </div>
        <div className="flex gap-4 mb-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/30 group-focus-within:text-talentstream-primary transition-colors" />
            <input
              placeholder="Search Talent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white dark:bg-[#151b28] border border-slate-200 dark:border-white/5 rounded-2xl pl-12 pr-6 py-3 text-sm text-slate-900 dark:text-white focus:border-talentstream-primary/50 outline-none w-80 shadow-lg dark:shadow-xl transition-all"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-talentstream-primary animate-spin" />
          </div>
        ) : filteredCandidates.length > 0 ? (
          filteredCandidates.map((c) => (
            <CandidateCard
              key={c.id}
              candidate={c}
              match={matches.find(m => String(m.candidate_id).toLowerCase() === String(c.id).toLowerCase())}
              selectedJobId={selectedJobId}
              onRefresh={loadData}
            />
          ))
        ) : (
          <div className="h-96 flex flex-col items-center justify-center bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-[40px] gap-6 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-300 dark:text-white/10">
               <Users className="w-10 h-10" />
            </div>
            <div>
               <h3 className="text-xl font-bold dark:text-white mb-2">No Matches Found</h3>
               <p className="text-slate-500 dark:text-white/30 text-sm max-w-sm mx-auto">Either refine your job description or search for global talent. No candidates currently match this specific job.</p>
            </div>
            {selectedJobId && (
               <button 
                 onClick={() => navigate('/pm/dashboard')}
                 className="px-8 py-3 rounded-2xl bg-talentstream-primary text-white font-bold shadow-lg shadow-talentstream-primary/30"
               >
                 Back to Dashboard
               </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
