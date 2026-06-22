import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  UploadCloud, 
  Calendar, 
  Mic, 
  Paperclip, 
  AlertTriangle, 
  Loader2,
  CheckCircle2,
  ArrowLeft,
  Lightbulb,
  Briefcase,
  Users,
  Clock,
  User,
  ShieldCheck,
  FileText,
  Info,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../app/services/auth/AuthProvider';
import { useNavigate, useParams } from 'react-router-dom';
import { createJob, uploadJD, generateJD, getJob, updateJob } from '../../app/services/api';

export const TalentStreamJDArchitect: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { jobId } = useParams<{ jobId: string }>();
  
  const [formData, setFormData] = useState({
    title: '',
    min_experience: '',
    duration: '6 Months',
    start_date: '',
    num_resources: '1',
    top_k_multiplier: 3,
  });
  
  const [isDurationFocused, setIsDurationFocused] = useState(false);
  const durationOptions = ["3 Months", "6 Months", "12 Months", "1 Year", "Long Term", "Contract Based"];
  
  const [keywords, setKeywords] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; message: string; title: string }>({ 
    open: false, 
    message: '', 
    title: 'Verification Required' 
  });

  React.useEffect(() => {
    if (jobId) {
      const loadJob = async () => {
        try {
          const job = await getJob(jobId);
          setFormData({
            title: job.title,
            min_experience: String(job.num_resources || ''), // Using num_resources as fallback since API doesn't return min_experience reliably yet
            duration: '6 Months', 
            start_date: '', 
            num_resources: String(job.num_resources || 1),
            top_k_multiplier: job.top_k ? Math.max(1, Math.min(5, Math.round(job.top_k / (job.num_resources || 1)))) : 3,
          });
          setKeywords(job.description);
        } catch (err) {
          console.error("Failed to fetch job", err);
          setModal({ open: true, message: "Critical link failure. Failed to retrieve job data.", title: "Fetch Error" });
        }
      };
      loadJob();
    }
  }, [jobId]);

  const handleGenerate = async () => {
    if (!keywords) return;
    setIsGenerating(true);
    try {
      const data = await generateJD(keywords);
      if (data.jd) {
        setKeywords(data.jd);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    
    setIsUploading(true);
    try {
      const data = await uploadJD(file);
      setFormData(prev => ({ ...prev, title: data.title || prev.title }));
      setKeywords(data.description + '\n\nRequirements:\n- ' + data.requirements.join('\n- '));
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFinalize = async () => {
    if (!formData.title || !keywords) {
      setModal({ 
        open: true, 
        message: "Please ensure Title and Description are correctly populated.", 
        title: "Incomplete Description" 
      });
      return;
    }
    
    setIsSaving(true);
    try {
      const numResources = parseInt(formData.num_resources) || 1;
      const payload = {
        title: formData.title,
        description: keywords,
        min_experience_years: formData.min_experience ? parseFloat(formData.min_experience) : undefined,
        top_k: formData.top_k_multiplier * numResources,
        num_resources: numResources
      };

      if (jobId) {
        await updateJob(jobId, payload);
      } else {
        await createJob(payload);
      }
      
      setSavedSuccess(true);
      setTimeout(() => {
        navigate('/pm/dashboard');
      }, 2000);
    } catch (err) {
      console.error(err);
      setModal({ 
        open: true, 
        message: "Link severed. The system was unable to register the job description at this time.", 
        title: "Registration Error" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = formData.title.trim() !== '' && 
                      formData.min_experience !== '' && 
                      formData.duration.trim() !== '' && 
                      formData.start_date !== '' && 
                      formData.num_resources !== '' && 
                      keywords.trim() !== '';

  return (
    <div className="min-h-screen bg-[var(--talentstream-bg)] text-[var(--text-primary)] font-inter py-10 px-4 transition-colors duration-300">
      <div className="max-w-[1000px] w-full mx-auto bg-[var(--talentstream-surface)] border border-[var(--card-border)] rounded-[20px] shadow-lg flex flex-col overflow-hidden transition-colors duration-300">
        
        {/* Header Section */}
        <div className="px-8 pt-8 pb-6 bg-[var(--talentstream-surface)] flex justify-between items-start">
            <div className="flex gap-4">
              <button onClick={() => navigate('/pm/dashboard')} className="mt-1 w-8 h-8 rounded-full border border-[var(--card-border)] bg-[var(--talentstream-surface)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--talentstream-surface-low)] transition-colors shrink-0 shadow-sm">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-[32px] font-extrabold tracking-tight text-[var(--text-primary)] leading-none">
                    {jobId ? 'Edit' : 'Create'} Job Description
                  </h1>
                  {savedSuccess && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-1 text-[#10B981] font-bold bg-emerald-500/10 border border-[#10B981]/20 px-2.5 py-0.5 rounded-full text-[11px]">
                      <CheckCircle2 className="w-3 h-3" /> Saved
                    </motion.div>
                  )}
                </div>
                <p className="text-[14px] text-[var(--text-secondary)] mt-2 font-medium leading-tight">
                  Define the core requirements for your next talent hire.
                </p>
              </div>
            </div>

            <div className="bg-emerald-500/10 border border-[#10B981]/20 rounded-xl p-3 max-w-xs flex gap-3 shrink-0 shadow-sm hidden md:flex">
              <Lightbulb className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[11px] font-bold text-[#10B981] uppercase tracking-widest mb-1">AI Tip</h4>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-medium">Be specific about must-have skills, tools, and domain expertise to improve candidate quality.</p>
              </div>
            </div>
        </div>

        <hr className="border-[var(--card-border)]" />

        {/* Form Grid */}
        <div className="px-8 py-8 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6">
            {/* Row 1 */}
            <div>
              <label className="block text-[13px] font-bold text-[var(--text-primary)] mb-1.5">Job Title <span className="text-rose-500">*</span></label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input 
                  type="text" 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. Senior Backend Engineer"
                  className="w-full h-[48px] pl-10 pr-4 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[14px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-[13px] font-bold text-[var(--text-primary)] mb-1.5">Min. Experience (Years) <span className="text-rose-500">*</span></label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input 
                  type="number"
                  min="0" step="0.5"
                  value={formData.min_experience}
                  onChange={e => setFormData({...formData, min_experience: e.target.value})}
                  placeholder="e.g. 3"
                  className="w-full h-[48px] pl-10 pr-4 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[14px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-[13px] font-bold text-[var(--text-primary)] mb-1.5">Project Duration <span className="text-rose-500">*</span></label>
              <div 
                className="relative"
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setIsDurationFocused(false);
                  }
                }}
              >
                <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input 
                  type="text"
                  value={formData.duration}
                  onChange={e => setFormData({...formData, duration: e.target.value})}
                  onFocus={() => setIsDurationFocused(true)}
                  placeholder="e.g. 6 Months"
                  className="w-full h-[48px] pl-10 pr-10 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[14px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                />
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                
                {isDurationFocused && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--talentstream-surface)] border border-[var(--card-border)] rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto py-1">
                    {durationOptions.filter(o => o.toLowerCase().includes(formData.duration.toLowerCase())).length > 0 ? (
                      durationOptions.filter(o => o.toLowerCase().includes(formData.duration.toLowerCase())).map(opt => (
                        <div 
                          key={opt}
                          className="px-4 py-2.5 text-[14px] font-medium text-[var(--text-primary)] hover:bg-[var(--talentstream-surface-low)] hover:text-indigo-500 cursor-pointer transition-colors"
                          onMouseDown={(e) => { e.preventDefault(); setFormData({...formData, duration: opt}); setIsDurationFocused(false); }}
                        >
                          {opt}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-2.5 text-[14px] font-medium text-[var(--text-muted)] italic">Press enter to use custom value</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Row 2 */}
            <div>
              <label className="block text-[13px] font-bold text-[var(--text-primary)] mb-1.5">Desired Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input 
                  type="date"
                  value={formData.start_date}
                  onChange={e => setFormData({...formData, start_date: e.target.value})}
                  className="w-full h-[48px] pl-10 pr-4 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[14px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none font-medium [&::-webkit-calendar-picker-indicator]:dark:invert"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[var(--text-primary)] mb-1.5">Number of Resources <span className="text-rose-500">*</span></label>
              <div className="relative">
                <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input 
                  type="number"
                  min="1"
                  value={formData.num_resources}
                  onChange={e => setFormData({...formData, num_resources: e.target.value})}
                  className="w-full h-[48px] pl-10 pr-4 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[14px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                />
              </div>
            </div>

            <div className="pb-4">
              <div className="flex items-center gap-1.5 group relative mb-1.5">
                <label className="block text-[13px] font-bold text-[var(--text-primary)]">Pipeline Multiplier</label>
                <Info className="w-4 h-4 text-[var(--text-muted)] cursor-help hover:text-indigo-500 transition-colors" />
                <div className="absolute bottom-full left-0 mb-2 w-[280px] bg-[var(--talentstream-surface)] border border-[var(--card-border)] text-[var(--text-secondary)] text-[12px] font-medium p-4 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none text-left">
                  <p className="mb-2">Select how many candidates the AI should shortlist relative to your open positions.</p>
                  <p className="mb-2 text-[#10B981] font-bold bg-emerald-500/10 p-3 rounded-lg border border-[#10B981]/20">Recommended:<br/><span className="text-[var(--text-secondary)] font-medium">A 2x–3x multiplier ensures a healthy interview pipeline.</span></p>
                  <div className="absolute -bottom-1.5 left-6 w-3 h-3 bg-[var(--talentstream-surface)] border-b border-r border-[var(--card-border)] rotate-45" />
                </div>
              </div>
              <div className="flex items-center gap-4 h-[48px]">
                <div className="flex-1 relative flex items-center mb-1">
                  <input 
                    type="range" 
                    min="1" 
                    max="5" 
                    step="1"
                    value={formData.top_k_multiplier}
                    onChange={e => setFormData({...formData, top_k_multiplier: parseInt(e.target.value)})}
                    style={{ background: `linear-gradient(to right, #4f46e5 ${((formData.top_k_multiplier - 1) / 4) * 100}%, rgba(99, 102, 241, 0.2) ${((formData.top_k_multiplier - 1) / 4) * 100}%)` }}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer outline-none hover:opacity-90 transition-all custom-slider"
                  />
                  <div className="absolute -bottom-5 w-full flex justify-between text-[10px] font-extrabold text-[var(--text-muted)] px-0.5">
                    <span className={formData.top_k_multiplier === 1 ? 'text-indigo-500' : ''}>1x</span>
                    <span className={formData.top_k_multiplier === 2 ? 'text-indigo-500' : ''}>2x</span>
                    <span className={formData.top_k_multiplier === 3 ? 'text-indigo-500' : ''}>3x</span>
                    <span className={formData.top_k_multiplier === 4 ? 'text-indigo-500' : ''}>4x</span>
                    <span className={formData.top_k_multiplier === 5 ? 'text-indigo-500' : ''}>5x</span>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center border border-[var(--card-border)] bg-[var(--talentstream-surface-low)] rounded-xl w-[80px] h-[48px] shrink-0 relative overflow-hidden group">
                  <span className="text-[16px] font-extrabold text-[var(--text-primary)] leading-none mt-1">{formData.top_k_multiplier * (parseInt(formData.num_resources) || 1)}</span>
                  <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5 transition-colors">Total</span>
                  <div className="absolute top-0 right-0 bg-indigo-500/20 text-indigo-500 text-[9px] font-bold px-1.5 py-0.5 rounded-bl-lg">
                    {formData.top_k_multiplier}x
                  </div>
                </div>
              </div>
            </div>
        </div>

        <hr className="border-[var(--card-border)]" />

        {/* Job Description Area */}
        <div className="px-8 py-8 flex flex-col gap-4">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[13px] font-bold text-[var(--text-primary)]">Job Description <span className="text-rose-500">*</span></label>
              <span className="text-[11px] font-medium text-[var(--text-muted)]">{keywords.length} / 5000</span>
            </div>
            <textarea 
              value={keywords}
              onChange={e => setKeywords(e.target.value)}
              placeholder="Paste JD or describe requirements... (e.g. Expertise in Python, AWS Cloud, and agile leadership)"
              className="w-full min-h-[240px] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl p-5 text-[14px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-y font-medium leading-relaxed custom-scrollbar"
            />

            {/* Upload vs Generate Side-by-Side */}
            <div className="relative mt-4 mb-2">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-dashed border-[var(--card-border)]" />
                </div>
                <div className="relative flex justify-center">
                    <span className="bg-[var(--talentstream-surface)] px-4 text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest">or streamline with AI</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-auto md:h-[72px]">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.docx,.txt" />
              <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="h-[72px] md:h-full border border-dashed border-indigo-500/40 bg-indigo-500/5 hover:bg-indigo-500/10 rounded-xl flex items-center gap-4 px-5 transition-all"
              >
                  <div className="w-10 h-10 rounded-full bg-[var(--talentstream-surface)] border border-indigo-500/20 flex items-center justify-center text-indigo-500 shadow-sm shrink-0">
                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                  </div>
                  <div className="text-left flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[13px] font-bold text-[var(--text-primary)]">{isUploading ? 'Extracting...' : 'Upload Existing JD'}</h4>
                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">PDF, DOCX</span>
                      </div>
                    <p className="text-[11px] text-[var(--text-secondary)] font-medium">Sync PDF content to form</p>
                  </div>
              </button>

              <button 
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="h-[72px] md:h-full bg-indigo-600 hover:bg-indigo-500 rounded-xl flex items-center gap-4 px-5 transition-all shadow-md"
              >
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="text-[13px] font-bold text-white leading-tight mb-0.5">{isGenerating ? 'Synthesizing...' : 'Generate with AI'}</h4>
                    <p className="text-[11px] text-white/80 font-medium leading-tight">Create a job description using AI</p>
                  </div>
              </button>
            </div>
        </div>

        <hr className="border-[var(--card-border)]" />

        {/* Integrated Footer */}
        <div className="px-8 py-5 bg-[var(--talentstream-surface-low)] flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0 rounded-b-[20px]">
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[13px] font-medium">Your data is secure and confidential.</span>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={() => navigate('/pm/dashboard')}
              className="flex-1 md:flex-none h-[44px] px-6 rounded-xl border border-[var(--card-border)] bg-[var(--talentstream-surface)] text-[13px] font-bold text-[var(--text-primary)] hover:bg-[var(--talentstream-surface-high)] transition-colors shadow-sm"
            >
              Cancel
            </button>
            <div className="relative group flex-1 md:flex-none">
              <button 
                onClick={handleFinalize}
                disabled={isSaving || !isFormValid}
                className={`w-full md:w-auto h-[44px] px-8 rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${!isFormValid ? 'bg-[var(--talentstream-surface-high)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--card-border)]' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'}`}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isSaving ? (jobId ? 'Updating...' : 'Processing...') : (jobId ? 'Save Changes' : 'Finalize & Create Job')}
              </button>
              {!isFormValid && (
                <div className="absolute bottom-full right-0 mb-3 w-max bg-[var(--text-primary)] text-[var(--talentstream-surface)] text-[12px] font-medium px-4 py-2.5 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                  Complete all required fields to create a job demand.
                  <div className="absolute -bottom-1.5 right-10 w-3 h-3 bg-[var(--text-primary)] rotate-45" />
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            onClick={() => setModal({ ...modal, open: false })}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-md bg-[var(--talentstream-surface)] border border-[var(--card-border)] rounded-[24px] p-8 shadow-2xl overflow-hidden"
          >
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-rose-500/10 flex items-center justify-center mb-5 border border-rose-500/20">
                <AlertTriangle className="w-7 h-7 text-rose-500" />
              </div>
              <h3 className="text-[20px] font-extrabold text-[var(--text-primary)] mb-2">
                {modal.title}
              </h3>
              <p className="text-[14px] text-[var(--text-secondary)] font-medium leading-relaxed mb-8">
                {modal.message}
              </p>
              <button 
                onClick={() => setModal({ ...modal, open: false })}
                className="w-full h-[48px] bg-[var(--text-primary)] hover:opacity-90 rounded-xl text-[var(--talentstream-surface)] font-bold text-[13px] transition-all"
              >
                Acknowledged
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
