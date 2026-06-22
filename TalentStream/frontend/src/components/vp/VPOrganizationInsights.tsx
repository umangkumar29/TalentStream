import React from 'react';
import { 
  BarChart3, 
  Target, 
  Clock, 
  LayoutDashboard,
  Filter,
  ArrowRight,
  ChevronDown,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { VPInsights, DeptPerformance } from './types';
import { fetchVPInsights, fetchVPDeptPerformance } from '../../app/services/api';

interface Props {
  insights?: VPInsights;
  deptHealth?: DeptPerformance[];
}

export const VPOrganizationInsights: React.FC = () => {
  const [insights, setInsights] = React.useState<VPInsights>({
    totalJDs: 0,
    openJDs: 0,
    closedJDs: 0,
    hiringSuccessRate: 0,
    avgTimeToHire: 0
  });
  const [deptHealth, setDeptHealth] = React.useState<DeptPerformance[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      try {
        const [stats, healthy] = await Promise.all([
          fetchVPInsights().catch(() => ({ totalJDs: 1482, openJDs: 412, closedJDs: 1070, hiringSuccessRate: 85.4, avgTimeToHire: 18.5 })),
          fetchVPDeptPerformance().catch(() => [
            { department: 'Engineering', totalJDs: 124, filled: 98, pending: 26, healthIndex: 85, status: 'Critical' as const },
            { department: 'Operations', totalJDs: 215, filled: 190, pending: 25, healthIndex: 88, status: 'On Track' as const },
          ])
        ]);
        setInsights(stats);
        setDeptHealth(healthy);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);
  return (
    <div className="space-y-6">
      {/* Search & Actions Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
           {['Overview', 'Strategy', 'Admin Control'].map(tab => (
             <button key={tab} className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${tab === 'Overview' ? 'bg-talentstream-primary text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
               {tab}
             </button>
           ))}
        </div>
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
             <span className="text-[10px] font-bold text-slate-500 uppercase">PGMs</span>
             <ChevronDown className="w-3 h-3 text-slate-500" />
           </div>
           <button className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-500 hover:text-white">
             <Filter className="w-4 h-4" />
           </button>
        </div>
      </div>

      <header className="space-y-1">
        <h1 className="text-3xl font-manrope font-extrabold text-white tracking-tight uppercase">Organization <span className="text-talentstream-primary">Insights</span></h1>
        <p className="text-slate-500 font-medium text-xs">Global operations and workforce intelligence Overview</p>
      </header>

      {/* Main KPI Grid - Compact */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         {[
           { label: 'Total JDs', value: insights.totalJDs, icon: LayoutDashboard, sub: '+12% vs LY', color: 'text-white' },
           { label: 'Open vs Closed', value: `${insights.openJDs} / ${insights.closedJDs}`, icon: BarChart3, sub: 'Ratio 1:2.6', color: 'text-emerald-400' },
           { label: 'Success Rate', value: `${insights.hiringSuccessRate}%`, icon: Target, sub: 'Optimal Range Reached', color: 'text-indigo-400' },
           { label: 'Avg Time to Hire', value: `${insights.avgTimeToHire} Days`, icon: Clock, sub: '-2 Days vs Target', color: 'text-amber-400' },
         ].map((stat, i) => (
           <div key={i} className="bg-[#151b28] border border-white/5 p-5 rounded-2xl group hover:bg-white/[0.02] transition-colors relative overflow-hidden">
             <div className="absolute top-0 right-0 w-20 h-20 bg-white/[0.01] -z-10 translate-x-8 -translate-y-8 rotate-45" />
             <div className="flex justify-between items-start mb-4">
               <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-500">
                  <stat.icon className="w-5 h-5" />
               </div>
               <span className="text-[8px] font-bold text-slate-600 bg-white/5 px-2 py-0.5 rounded tracking-widest">LIVE</span>
             </div>
             <div>
                <h3 className={`text-2xl font-manrope font-extrabold ${stat.color} mb-0.5 tracking-tighter`}>{stat.value}</h3>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-2">{stat.label}</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase opacity-60">{stat.sub}</p>
             </div>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">
         {/* Hiring Trends Chart Placeholder */}
         <div className="lg:col-span-7 bg-[#151b28] border border-white/5 p-6 rounded-2xl space-y-8">
            <div className="flex items-center justify-between">
               <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Hiring Trends</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Monthly recruitment velocity across all regions</p>
               </div>
               <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                     <div className="w-2 h-2 rounded-full bg-indigo-500" /> Open JDs
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500">
                     <div className="w-2 h-2 rounded-full bg-emerald-500" /> Closed JDs
                  </div>
               </div>
            </div>
            
            <div className="h-64 flex items-end justify-between px-4 gap-4">
               {[
                 { month: 'JAN', open: 60, closed: 40 },
                 { month: 'FEB', open: 45, closed: 55 },
                 { month: 'MAR', open: 80, closed: 70 },
                 { month: 'APR', open: 50, closed: 60 },
                 { month: 'MAY', open: 75, closed: 85 },
                 { month: 'JUN', open: 90, closed: 95 },
               ].map((bar, i) => (
                 <div key={i} className="flex-1 flex flex-col items-center gap-4 h-full">
                    <div className="w-full flex-1 flex gap-1 items-end bg-white/5 rounded-t-lg p-1 overflow-hidden">
                       <div className="flex-1 bg-indigo-500/40 rounded-sm" style={{ height: `${bar.open}%` }} />
                       <div className="flex-1 bg-emerald-500 rounded-sm" style={{ height: `${bar.closed}%` }} />
                    </div>
                    <span className="text-[9px] font-bold text-slate-600 tracking-tighter uppercase">{bar.month}</span>
                 </div>
               ))}
            </div>
         </div>

         {/* Departmental Health - Compact */}
         <div className="lg:col-span-5 bg-[#151b28] border border-white/5 p-6 rounded-2xl flex flex-col justify-between">
            <div>
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Departmental Health</h3>
                  <button className="text-[9px] font-bold text-indigo-400 hover:text-white transition-colors uppercase tracking-widest">View All</button>
               </div>
               
               <div className="space-y-6">
                  {deptHealth.map((dept, i) => (
                    <div key={i} className="flex items-center justify-between group cursor-default">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-white transition-colors">
                             <ShieldCheck className="w-5 h-5" />
                          </div>
                          <div>
                             <h4 className="text-xs font-bold text-white group-hover:text-talentstream-primary transition-colors">{dept.department}</h4>
                             <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">{dept.filled} Out of {dept.totalJDs} Filled</p>
                          </div>
                       </div>
                       <span className={`px-3 py-1 rounded text-[8px] font-black uppercase tracking-[0.2em] border ${
                         dept.status === 'Critical' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                         dept.status === 'Stable' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                         dept.status === 'Warning' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                         'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                       }`}>
                         {dept.status}
                       </span>
                    </div>
                  ))}
               </div>
            </div>

            <button className="w-full mt-10 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white hover:bg-white/10 transition-all uppercase tracking-[0.3em] flex items-center justify-center gap-3 group">
               Generate System Report <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
         </div>
      </div>
    </div>
  );
};
