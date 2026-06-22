import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MoreVertical, Loader2 } from 'lucide-react';
import { fetchPMInterviews, scheduleInterview, updateHiringDecision } from '../../app/services/api';

// Types
interface Candidate {
  match_id: string;
  candidate_name: string;
  job_title: string;
  l1_status: string | null;
  l2_status: string | null;
  hiring_decision: string | null;
  match_score: number | null;
  experience_years?: number;
}

type ColumnType = 'L1 Screen' | 'L2 Technical' | 'Selected';

export function PMPipeline() {
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('jobId');

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchPMInterviews(jobId || undefined);
      setCandidates(data);
    } catch (err) {
      console.error('Failed to load pipeline data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Close menu when clicking outside
    const handleClickOutside = () => setActiveMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Determine which column a candidate belongs to
  const getColumn = (c: Candidate): ColumnType | 'Rejected' => {
    const decision = c.hiring_decision?.toLowerCase();
    if (decision === 'rejected') return 'Rejected';
    if (decision === 'hired') return 'Selected';
    if (c.l1_status === 'cleared') return 'L2 Technical';
    return 'L1 Screen';
  };

  const handleAction = async (e: React.MouseEvent, matchId: string, action: 'next' | 'reject', currentCol: ColumnType) => {
    e.stopPropagation();
    setActiveMenu(null);
    try {
      if (action === 'reject') {
        await updateHiringDecision(matchId, 'rejected');
      } else if (action === 'next') {
        if (currentCol === 'L1 Screen') {
          await scheduleInterview(matchId, 'L1', 'cleared');
          await scheduleInterview(matchId, 'L2', 'scheduled');
        } else if (currentCol === 'L2 Technical') {
          await updateHiringDecision(matchId, 'hired');
        }
      }
      await loadData();
    } catch (error) {
      console.error('Action failed', error);
    }
  };

  const onDragStart = (e: React.DragEvent, matchId: string, sourceCol: ColumnType) => {
    e.dataTransfer.setData('matchId', matchId);
    e.dataTransfer.setData('sourceCol', sourceCol);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = async (e: React.DragEvent, targetCol: ColumnType) => {
    const matchId = e.dataTransfer.getData('matchId');
    const sourceCol = e.dataTransfer.getData('sourceCol') as ColumnType;
    if (!matchId || sourceCol === targetCol) return;

    try {
      if (targetCol === 'L2 Technical') {
        await scheduleInterview(matchId, 'L1', 'cleared');
        await scheduleInterview(matchId, 'L2', 'scheduled');
      } else if (targetCol === 'Selected') {
        await updateHiringDecision(matchId, 'hired');
      } else if (targetCol === 'L1 Screen') {
        // Resetting back to L1
        await scheduleInterview(matchId, 'L1', 'scheduled');
        await updateHiringDecision(matchId, 'pending');
      }
      await loadData();
    } catch (error) {
      console.error('Drag and drop failed', error);
    }
  };

  const columns: { id: ColumnType; title: string }[] = [
    { id: 'L1 Screen', title: 'L1 Screen' },
    { id: 'L2 Technical', title: 'L2 Technical' },
    { id: 'Selected', title: 'Selected' },
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-[#0f172a]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb] dark:bg-[#0f172a] p-8 font-inter">
      {/* Kanban Board Area */}
      <div className="flex flex-row gap-6 h-full items-start">
        {columns.map((col) => {
          const colCandidates = candidates.filter((c) => getColumn(c) === col.id);
          
          return (
            <div
              key={col.id}
              className="flex-1 bg-slate-100/50 dark:bg-white/5 rounded-2xl p-4 min-h-[70vh] border border-slate-200 dark:border-slate-800"
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, col.id)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-6 px-2">
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                  {col.title}
                </h2>
                <span className="bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                  {colCandidates.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="space-y-4">
                {colCandidates.map((candidate) => (
                  <div
                    key={candidate.match_id}
                    draggable
                    onDragStart={(e) => onDragStart(e, candidate.match_id, col.id)}
                    className="relative bg-white dark:bg-[#1e293b] p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                          {candidate.candidate_name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {candidate.job_title}
                          {candidate.experience_years !== undefined && (
                            <>
                              <span className="mx-1.5 opacity-50">•</span>
                              {candidate.experience_years} Yrs
                            </>
                          )}
                        </p>
                      </div>

                      {/* Three Dots Menu */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenu(activeMenu === candidate.match_id ? null : candidate.match_id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {activeMenu === candidate.match_id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 z-50">
                            {col.id !== 'Selected' && (
                              <button
                                onClick={(e) => handleAction(e, candidate.match_id, 'next', col.id)}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                              >
                                Move to next stage
                              </button>
                            )}
                            <button
                              onClick={(e) => handleAction(e, candidate.match_id, 'reject', col.id)}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Match Score Badge */}
                    <div className="flex items-center mt-4">
                      <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-100 dark:border-blue-500/20">
                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                          {candidate.match_score ? `${Math.round(candidate.match_score)}% Match` : 'No Score'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {colCandidates.length === 0 && (
                  <div className="text-center py-10 text-slate-400 dark:text-slate-600 text-sm border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    Drop candidates here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
