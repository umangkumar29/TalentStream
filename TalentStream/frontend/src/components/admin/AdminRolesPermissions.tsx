import React, { useState } from 'react';
import { 
  Shield, ShieldCheck, ShieldAlert, 
  ChevronDown, ChevronUp, Save, 
  Settings, UserPlus, FileText, 
  Eye, CornerDownRight, Zap, Info,
  AlertTriangle, ChevronRight,
  ZapOff
} from 'lucide-react';
import { RoleDefinition } from './types';

interface AdminRolesPermissionsProps {
  roles?: RoleDefinition[];
  auditHealth?: number;
}

const DEFAULT_ROLES: RoleDefinition[] = [
  { 
    id: 'admin', 
    name: 'Superuser Admin', 
    description: 'Full system access and security configuration',
    icon: Shield,
    permissions: [
      { id: '1', name: 'Can Create Users', description: 'Add new employees and external partners', isEnabled: true },
      { id: '2', name: 'Can View Org Insights', description: 'Access global hiring and retention heatmaps', isEnabled: true },
      { id: '3', name: 'Can Manage JDs', description: 'Create and modify AI-generated job specs', isEnabled: true },
      { id: '4', name: 'Bypass Approval Gates', description: 'Authorize offers without second-tier signoff', isEnabled: true }
    ]
  },
  { 
    id: 'vp', 
    name: 'VP Executive', 
    description: 'Executive reporting and high-level strategy visibility',
    icon: Eye,
    permissions: [
       { id: '5', name: 'Global Financial View', description: 'Access organization-wide payroll and budget data', isEnabled: true },
       { id: '6', name: 'Strategic Forecasting', description: 'View 12-month projected hiring needs', isEnabled: false }
    ]
  },
  { 
    id: 'pgm', 
    name: 'Program Manager', 
    description: 'Oversee multiple recruitment pipelines and projects',
    icon: Settings,
    permissions: []
  },
  { 
    id: 'pm', 
    name: 'Project Manager', 
    description: 'Day-to-day candidate management and hiring',
    icon: ShieldCheck,
    permissions: []
  },
  { 
    id: 'rmg', 
    name: 'RMG Portal', 
    description: 'Tactical resource management and bench allocation',
    icon: UserPlus,
    permissions: []
  }
];

const AdminRolesPermissions: React.FC<AdminRolesPermissionsProps> = ({
  roles = DEFAULT_ROLES,
  auditHealth = 98.4
}) => {
  const [expandedRole, setExpandedRole] = useState<string | null>('admin');

  return (
    <div className="p-8 space-y-10 animate-in slide-in-from-bottom-10 duration-1000">
      <div className="flex flex-col gap-3">
        <h1 className="text-5xl font-black text-white tracking-tighter uppercase mb-2">Protocol Architecture</h1>
        <p className="text-slate-400 max-w-2xl text-xl font-medium leading-relaxed opacity-80">
          Define and govern access control across the enterprise. Adjust granular permissions for intelligence modules and system coordination.
        </p>
      </div>

      <div className="space-y-6">
        {roles.map((role) => (
          <div key={role.id} className={`bg-slate-900/40 backdrop-blur-3xl border transition-all duration-700 rounded-[2.5rem] overflow-hidden ${expandedRole === role.id ? 'border-indigo-500/40 shadow-2xl shadow-indigo-500/10 ring-1 ring-indigo-500/20' : 'border-white/5 hover:border-white/10 shadow-xl'}`}>
            <button 
              onClick={() => setExpandedRole(expandedRole === role.id ? null : role.id)}
              className="w-full flex items-center justify-between p-10 hover:bg-white/[0.02] transition-all group"
            >
              <div className="flex items-center gap-8">
                <div className={`p-6 rounded-[1.75rem] transition-all duration-700 shadow-2xl ${expandedRole === role.id ? 'bg-indigo-600 text-white translate-y-[-4px] rotate-1 shadow-indigo-500/40' : 'bg-slate-800 text-slate-400 group-hover:scale-105'}`}>
                  <role.icon size={32} strokeWidth={2.5} />
                </div>
                <div className="text-left">
                  <h3 className="text-2xl font-black text-white tracking-tighter uppercase mb-1">{role.name}</h3>
                  <p className="text-slate-500 font-medium opacity-80">{role.description}</p>
                </div>
              </div>
              <div className={`p-4 rounded-full bg-slate-800/40 text-slate-500 transition-all duration-500 ${expandedRole === role.id ? 'rotate-180 bg-indigo-500/10 text-indigo-400' : 'group-hover:translate-x-1'}`}>
                 <ChevronDown size={24} />
              </div>
            </button>

            {expandedRole === role.id && (
              <div className="p-12 pt-0 animate-in fade-in zoom-in-95 duration-500">
                {role.permissions.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                      {role.permissions.map((perm) => (
                        <div key={perm.id} className="flex items-center justify-between p-8 bg-black/20 rounded-[2rem] border border-white/5 group/perm hover:border-indigo-500/30 transition-all hover:bg-indigo-500/[0.02] relative overflow-hidden ring-1 ring-white/[0.02]">
                          <div className="flex-1 pr-6 relative z-10">
                            <div className="text-white text-lg font-black tracking-tight mb-2 group-hover/perm:text-indigo-400 transition-colors uppercase">{perm.name}</div>
                            <div className="text-slate-500 text-sm font-medium leading-relaxed opacity-80">{perm.description}</div>
                          </div>
                          <div className={`w-16 h-8 rounded-full relative transition-all duration-500 group-hover/perm:scale-110 cursor-pointer p-1.5 ${perm.isEnabled ? 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-slate-800 shadow-inner'}`}>
                            <div className={`h-full aspect-square bg-white rounded-full transition-all duration-500 shadow-xl ${perm.isEnabled ? 'translate-x-8' : 'translate-x-0'}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-12 flex justify-end gap-4">
                       <button className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] transition-all duration-500 shadow-2xl shadow-indigo-600/30 active:scale-95 group/save overflow-hidden relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover/save:translate-x-[100%] transition-transform duration-1000" />
                          <Save size={20} className="relative z-10" />
                          <span className="relative z-10">Sync Configuration</span>
                       </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-16 bg-black/20 rounded-[2rem] border border-dashed border-white/10">
                     <AlertTriangle size={48} className="text-slate-700 mx-auto mb-4" />
                     <p className="text-slate-500 font-black uppercase tracking-widest text-xs">No specialized modules active</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-10">
        <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 p-12 rounded-[3.5rem] relative overflow-hidden group shadow-2xl ring-1 ring-white/[0.02]">
          <div className="absolute top-0 right-0 p-12 text-indigo-500/10 scale-[2] group-hover:rotate-[-5deg] transition-transform duration-1000">
            <Zap size={120} fill="currentColor" strokeWidth={0} />
          </div>
          <div className="flex items-center gap-4 text-indigo-400 text-xs font-black uppercase tracking-[0.3em] mb-8 relative z-10">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 ring-1 ring-indigo-500/20 shadow-lg shadow-indigo-500/5">
               <Zap size={20} className="animate-pulse" />
            </div>
             AI Policy Guard Active
          </div>
          <p className="text-slate-400 text-lg font-medium leading-[2] mb-8 relative z-10 max-w-lg opacity-90">
            The curator has detected that the <span className="text-white font-black underline decoration-indigo-500/50 underline-offset-4">RMG</span> role has significant overlapping permissions with <span className="text-white font-black underline decoration-emerald-500/50 underline-offset-4">PM</span>. We recommend consolidating these encryption layers to reduce identity entropy.
          </p>
          <button className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400 hover:text-indigo-300 flex items-center gap-3 group/btn relative z-10 bg-indigo-500/5 py-4 px-8 rounded-2xl hover:bg-indigo-500/10 border border-indigo-500/20 transition-all">
            Initiate Optimization <ChevronRight size={18} className="group-hover/btn:translate-x-2 transition-transform duration-500" />
          </button>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 p-12 rounded-[3.5rem] flex items-center gap-12 shadow-2xl ring-1 ring-white/[0.02] relative group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
          <div className="flex flex-col items-center relative z-10 shrink-0">
            <div className="relative">
              <div className="text-[3.5rem] font-black text-white mb-2 leading-none drop-shadow-2xl">{auditHealth}%</div>
              <div className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.2)] ring-1 ring-emerald-500/40">
                <Shield size={16} className="text-emerald-400" />
              </div>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-[0.4em] font-black opacity-60">Security Core</div>
          </div>
          <div className="flex-1 relative z-10">
             <div className="h-4 w-full bg-black/40 rounded-full mb-6 overflow-hidden shadow-inner p-1 border border-white/5">
                <div className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-500 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.3)] group-hover:w-[102%] transition-all duration-1000" style={{ width: `${auditHealth}%` }} />
             </div>
             <p className="text-slate-500 text-sm font-semibold leading-relaxed opacity-70">Permission compliance across all active roles and intelligence endpoints is at stable equilibrium. No critical cryptographic vulnerabilities detected in the last scan.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRolesPermissions;
