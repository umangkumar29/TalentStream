import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Fingerprint, 
  Shield, 
  Zap, 
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../services/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
        if (email === 'rmg@kpit.com' && password === 'rmg') {
            await handleDemoLogin('RMG');
        } else if (email === 'pm@kpit.com' && password === 'pm') {
            await handleDemoLogin('Program_Mgr');
        } else if (email && password) {
            await login({ username: email, password: password });
            navigate('/dashboard');
        } else {
            // Default Demo Bypass for development
            handleDemoLogin('Admin');
        }
    } catch (err: any) {
        setError(err.response?.data?.detail || 'Authentication failed. Neural Link severed.');
        setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role: string) => {
    setIsLoading(true);
    let roleName = role;
    let demoEmail = `${role.toLowerCase()}@talentstream.ai`;
    if (role === 'Program_Mgr') roleName = 'PM User';
    if (role === 'Project_Mgr') roleName = 'PM User';
    if (role === 'Admin') roleName = 'Admin User';
    if (role === 'RMG') roleName = 'RMG User';
    if (role === 'VP') roleName = 'VP User';

    // Standard UUIDs for demo roles to satisfy database UUID types
    const DEMO_IDS: Record<string, string> = {
      'Admin': '00000000-0000-4000-8000-000000000001',
      'VP': '00000000-0000-4000-8000-000000000002',
      'Program_Mgr': '00000000-0000-4000-8000-000000000003',
      'Project_Mgr': '00000000-0000-4000-8000-000000000004',
      'RMG': '00000000-0000-4000-8000-000000000005'
    };

    try {
      await login({ 
        demoUser: { 
          id: DEMO_IDS[role] || role, 
          email: demoEmail, 
          name: roleName, 
          role: role as any 
        } 
      });
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#03070C] font-inter selection:bg-indigo-500/30 overflow-hidden">
      
      {/* Left Branding Side (Neural Intelligence Panel) */}
      <div className="hidden lg:flex w-[55%] relative flex-col justify-between p-20 overflow-hidden bg-[#0F172A]">
         {/* Adaptive Neural Background */}
            {/* High-End Tech Background Image */}
            <div className="absolute inset-0 z-0">
              <img 
                alt="TalentStream Neural Architecture" 
                className="w-full h-full object-cover opacity-40 mix-blend-screen" 
                src="/bg-intelligence.png"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#060e20]/90 via-[#060e20]/60 to-transparent mix-blend-multiply" />
            </div>
            <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-indigo-500/10 blur-[100px] rounded-full" />
            {/* Added subtle bottom glow in blue */}
            <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-blue-600/10 blur-[100px] rounded-full" />
         

         {/* Intelligence Refined Tag (Subtle) */}
         <div className="relative z-10">
            <div className="inline-flex items-center gap-2.5 px-3 py-1 bg-indigo-500/5 border border-indigo-500/10 rounded-full">
               <Zap className="w-2.5 h-2.5 text-indigo-400 opacity-80" />
               <span className="text-[9px] font-bold text-indigo-300 uppercase tracking-[0.2em] opacity-90">Intelligence Refined</span>
            </div>
         </div>

         {/* Core Slogan (Refined Proportions) */}
         <div className="relative z-10 max-w-xl space-y-8">
            <motion.div 
               initial={{ opacity: 0, y: 15 }}
               animate={{ opacity: 1, y: 0 }}
               className="space-y-4"
            >
               <h1 className="text-6xl xl:text-7xl font-manrope font-extrabold text-slate-50 leading-[1.05] tracking-tight">
                  Experience the<br />
                  <span className="text-slate-50 italic font-extrabold -tracking-widest">TalentStream</span><br />
                  Precision<span className="text-indigo-400 font-black">.</span>
               </h1>
            </motion.div>
            <motion.p 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.2 }}
               className="text-base text-slate-400 font-medium leading-relaxed max-w-md opacity-90"
            >
               Navigate the elite landscape of talent acquisition with TalentStream—where artificial intelligence meets executive human intuition.
            </motion.p>

            {/* Visual Stats (Balanced) - Removed Green, using Indigo/Blue */}
            <div className="flex items-center gap-12 pt-6">
               <div className="space-y-1">
                  <div className="text-3xl font-extrabold text-indigo-400 tracking-tight">99.8%</div>
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Match Accuracy</div>
               </div>
               <div className="w-px h-10 bg-white/10" />
               <div className="space-y-1">
                  <div className="text-3xl font-extrabold text-slate-50 tracking-tight">0.4s</div>
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Latency Response</div>
               </div>
            </div>
         </div>

         {/* Left Footer */}
         <div className="relative z-10 text-[9px] font-bold text-slate-600 uppercase tracking-widest opacity-80">
            TalentStream Architecture V4.0
         </div>
      </div>

      {/* Right Login Side (The Executive Console) */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center items-center p-8 relative overflow-hidden border-l transition-colors duration-300" style={{ backgroundColor: 'var(--talentstream-bg)', borderColor: 'var(--talentstream-outline-variant)' }}>
         
         {/* Subtle Header */}
         <div className="absolute top-16 text-center space-y-2">
            <div className="text-sm font-black text-indigo-400 tracking-[0.4em] uppercase">TALENTSTREAM</div>
            <div className="text-[9px] font-bold text-slate-500 tracking-[0.2em] uppercase">Intelligence Platform</div>
         </div>

         <div className="w-full max-w-md space-y-10">
            
            {/* Glass Login Card */}
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="rounded-[32px] p-10 shadow-2xl relative overflow-hidden transition-colors duration-300"
               style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', borderWidth: '1px' }}
            >
               {/* Fixed the subtle glow inside the card to be pure blue/indigo */}
               <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />

               <div className="space-y-2 mb-10 relative z-10">
                  <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>Welcome Back</h2>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Access your executive talent console.</p>
               </div>

               <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                  {error && (
                     <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-semibold">
                        {error}
                     </div>
                  )}

                  <div className="space-y-2.5">
                     <label className="text-[10px] font-bold uppercase tracking-[0.2em] pl-1" style={{ color: 'var(--text-muted)' }}>Email ID</label>
                     <div className="relative group/field">
                        <input 
                           type="email" 
                           placeholder="name@talentstream.ai" 
                           className="w-full rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:border-indigo-500/50 transition-all placeholder-slate-400/50"
                           style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)', borderWidth: '1px' }}
                           onChange={(e) => setEmail(e.target.value)}
                           value={email}
                        />
                        <Fingerprint className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within/field:text-indigo-500 transition-colors" />
                     </div>
                  </div>

                  <div className="space-y-2.5">
                     <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>Password</label>
                     </div>
                     <div className="relative group/field">
                        <input 
                           type="password" 
                           placeholder="••••••••••••" 
                           className="w-full rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:border-indigo-500/50 transition-all placeholder-slate-400/50"
                           style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)', borderWidth: '1px' }}
                           onChange={(e) => setPassword(e.target.value)}
                           value={password}
                        />
                        <Shield className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within/field:text-indigo-500 transition-colors" />
                     </div>
                  </div>

                  <div className="flex items-center gap-3 px-1 pt-2">
                     <input type="checkbox" className="w-4 h-4 rounded-md border-slate-300 text-indigo-500 focus:ring-indigo-500" id="persist" />
                     <label htmlFor="persist" className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Save password</label>
                  </div>

                  <button 
                     type="submit"
                     disabled={isLoading}
                     style={{
                        background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)'
                     }}
                     className="w-full mt-2 py-4 rounded-xl text-[13px] font-black uppercase tracking-[0.2em] text-white shadow-[0_4px_20px_rgba(79,70,229,0.2)] hover:scale-[1.02] transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                  >
                     {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                     ) : (
                        <>
                           Login
                           <ArrowRight className="w-4 h-4" />
                        </>
                     )}
                  </button>
               </form>
            </motion.div>

         </div>

         {/* Compact Footer */}
         <div className="absolute bottom-10 flex flex-col items-center gap-6 w-full">
            <div className="flex gap-10 opacity-50">
               <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                  <ShieldCheck className="w-3.5 h-3.5" /> ISO 27001
               </div>
               <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                  <ShieldCheck className="w-3.5 h-3.5" /> SOC2 Compliant
               </div>
            </div>
            <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
               © 2026 TalentStream.
            </div>
         </div>

      </div>

    </div>
  );
}
