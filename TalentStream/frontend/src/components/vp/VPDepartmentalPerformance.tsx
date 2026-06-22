import React from 'react';
import { 
  BarChart3, 
  Target, 
  Clock, 
  Plus,
  ArrowRight,
  ChevronDown,
  ShieldCheck,
  Zap,
  Activity,
  Layers
} from 'lucide-react';
import { motion } from 'framer-motion';
import { DeptPerformance } from './types';
import { fetchVPDeptPerformance } from '../../app/services/api';

export const VPDepartmentalPerformance: React.FC = () => {
  const [departments, setDepartments] = React.useState<DeptPerformance[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchVPDeptPerformance().catch(() => [
          { department: 'Data Science', totalJDs: 24, filled: 18, pending: 6, healthIndex: 85, status: 'Stable' as const },
          { department: 'Product Management', totalJDs: 12, filled: 9, pending: 3, healthIndex: 75, status: 'On Track' as const },
          { department: 'Sales Operations', totalJDs: 45, filled: 12, pending: 33, healthIndex: 35, status: 'Warning' as const },
          { department: 'Cyber Security', totalJDs: 8, filled: 8, pending: 0, healthIndex: 100, status: 'Stable' as const },
        ]);
        setDepartments(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);
  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Search & Actions Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
           {['By Department', 'By PGM', 'By Location'].map(tab => (
             <button key={tab} className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${tab === 'By Department' ? 'bg-talentstream-primary text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
               {tab}
             </button>
           ))}
        </div>
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
             <span className="text-[10px] font-bold text-slate-500 uppercase">Quarter Q3</span>
             <ChevronDown className="w-3 h-3 text-slate-500" />
           </div>
           <button className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-500 hover:text-white">
             <Activity className="w-4 h-4" />
           </button>
        </div>
      </div>

      <header className="space-y-1">
        <h1 className="text-3xl font-manrope font-extrabold text-white tracking-tight uppercase">Departmental <span className="text-talentstream-primary">Performance</span></h1>
        <p className="text-slate-500 font-medium text-xs">Real-time breakdown of acquisition performance across global operational units.</p>
      </header>

      {/* Performers - Compact Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         {[
           { label: 'AI Engineering', value: '42 Positions Filled', icon: Zap, sub: '94% Fill Velocity', tag: 'TOP PERFORMER', color: 'text-emerald-400' },
           { label: 'Product Design', value: '18 New Hires', icon: Layers, sub: '88% Match Rate', tag: 'ACTIVE', color: 'text-indigo-400' },
           { label: 'Cloud Infrastructure', value: '31 Total Active JDs', icon: Activity, sub: 'Pending Review: 12', tag: 'HIGH VOLUME', color: 'text-blue-400' },
         ].map((performer, i) => (
           <div key={i} className="bg-[#151b28] border border-white/5 p-6 rounded-2xl group hover:bg-white/[0.02] transition-colors overflow-hidden">
             <div className="flex justify-between items-start mb-6">
               <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-500">
                  <performer.icon className="w-5 h-5" />
               </div>
               <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded bg-black/40 ${performer.tag === 'TOP PERFORMER' ? 'text-emerald-500' : 'text-slate-500'}`}>
                 {performer.tag}
               </span>
             </div>
             <div>
                <h4 className="text-base font-extrabold text-white mb-0.5 tracking-tight group-hover:text-talentstream-primary transition-colors uppercase">{performer.label}</h4>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider mb-2 opacity-60">{performer.sub}</p>
                <p className="text-2xl font-black text-white/40 tracking-tighter uppercase">{performer.value.split(' ')[0]} <span className="text-xs text-slate-600 font-bold uppercase">{performer.value.split(' ').slice(1).join(' ')}</span></p>
             </div>
           </div>
         ))}
      </div>

      {/* Matrix Table - Compact */}
      <div className="bg-[#151b28] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
         <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Performance Matrix</h3>
            <button className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
               Export Intelligence CSV
            </button>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/[0.02] text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">
                  <th className="px-8 py-5">Department</th>
                  <th className="px-8 py-5 text-center">Open JDs</th>
                  <th className="px-8 py-5 text-center">Filled</th>
                  <th className="px-8 py-5 text-center">Pending</th>
                  <th className="px-8 py-5">Health Index</th>
                  <th className="px-8 py-5 text-right">Metric</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {departments.map((dept, i) => (
                  <motion.tr 
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-white/[0.01] transition-colors group cursor-default"
                  >
                    <td className="px-8 py-5 font-manrope font-extrabold text-white uppercase text-sm tracking-tight">{dept.department}</td>
                    <td className="px-8 py-5 text-center text-sm font-black text-white/30">{dept.totalJDs}</td>
                    <td className="px-8 py-5 text-center text-sm font-black text-white/70">{dept.filled}</td>
                    <td className="px-8 py-5 text-center text-sm font-black text-white/30">{dept.pending}</td>
                    <td className="px-8 py-5">
                       <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-1000 ${
                            dept.healthIndex > 70 ? 'bg-emerald-500' : 
                            dept.healthIndex > 40 ? 'bg-indigo-500' : 'bg-rose-500'
                          }`} style={{ width: `${dept.healthIndex}%` }} />
                       </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                       <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {[1,2,3].map(j => (
                            <div key={j} className="w-1.5 h-4 bg-white/10 rounded-full" />
                          ))}
                          <div className="w-1.5 h-4 bg-talentstream-primary rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                       </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
         </div>
         <div className="px-8 py-4 bg-white/[0.01] border-t border-white/5 flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
               Showing 5 of {departments.length} global business units
            </p>
         </div>
      </div>
    </div>
  );
};
