import React from 'react';
import { 
  History, 
  ArrowUpRight, 
  ArrowDownRight, 
  FileText,
  Filter,
  ChevronDown,
  LayoutGrid,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { HiringTrendData } from './types';
import { fetchVPHiringTrends } from '../../app/services/api';

interface Props {
  trends?: HiringTrendData[];
}

export const VPHiringTrends: React.FC = () => {
  const [trends, setTrends] = React.useState<HiringTrendData[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchVPHiringTrends().catch(() => [
          { month: 'June 2024', openJDs: 114, closedJDs: 82, hiringRate: 71.9, delta: 'up' as const },
          { month: 'May 2024', openJDs: 119, closedJDs: 76, hiringRate: 63.8, delta: 'down' as const },
        ]);
        setTrends(data);
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
           {['Monthly', 'Quarterly', 'Annual'].map(tab => (
             <button key={tab} className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${tab === 'Monthly' ? 'bg-talentstream-primary text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
               {tab}
             </button>
           ))}
        </div>
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
             <span className="text-[10px] font-bold text-slate-500 uppercase">Year 2024</span>
             <ChevronDown className="w-3 h-3 text-slate-500" />
           </div>
           <button className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-500 hover:text-white">
             <Filter className="w-4 h-4" />
           </button>
        </div>
      </div>

      <header className="space-y-1">
        <h1 className="text-3xl font-manrope font-extrabold text-white tracking-tight uppercase">Hiring <span className="text-talentstream-primary">Trends</span></h1>
        <p className="text-slate-500 font-medium text-xs">Monthly recruitment velocity across all regions and business units</p>
      </header>

      {/* Main Trends Table - Compact */}
      <div className="bg-[#151b28] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
         <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Trend Matrix</h3>
            <div className="flex items-center gap-4">
               <button className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Export CSV
               </button>
            </div>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/[0.02] text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">
                  <th className="px-8 py-6">Reporting Month</th>
                  <th className="px-8 py-6">Open JDs</th>
                  <th className="px-8 py-6">Closed JDs</th>
                  <th className="px-8 py-6">Hiring Rate</th>
                  <th className="px-8 py-6 text-right">Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {trends.map((trend, i) => (
                  <motion.tr 
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-white/[0.01] transition-colors group cursor-default"
                  >
                    <td className="px-8 py-6 font-manrope font-black text-white uppercase text-base">{trend.month}</td>
                    <td className="px-8 py-6">
                       <span className="text-base text-white/50 font-bold">{trend.openJDs}</span>
                       <span className={`ml-2 text-[9px] font-black uppercase ${trend.delta === 'down' ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {trend.delta === 'up' ? '+4%' : trend.delta === 'down' ? '-4%' : '+2%'}
                       </span>
                    </td>
                    <td className="px-8 py-6">
                       <p className="text-base text-white/70 font-bold">{trend.closedJDs}</p>
                    </td>
                    <td className="px-8 py-6">
                       <span className={`px-4 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${trend.hiringRate > 70 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/10' : 'bg-slate-500/10 text-slate-500 border-slate-500/10'}`}>
                          {trend.hiringRate}%
                       </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex justify-end pr-2">
                          {trend.delta === 'up' ? (
                            <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                          ) : trend.delta === 'down' ? (
                            <ArrowDownRight className="w-5 h-5 text-rose-500" />
                          ) : (
                            <div className="w-5 h-0.5 bg-slate-700/50 rounded-full" />
                          )}
                       </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
         </div>
         <div className="px-8 py-6 bg-white/[0.01] border-t border-white/5 flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
               Showing last 6 months of intelligence metadata
            </p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-10">
         <div className="bg-[#151b28] border border-white/5 p-6 rounded-2xl flex items-center gap-6 group hover:bg-white/[0.02] transition-colors">
            <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
               <History className="w-5 h-5" />
            </div>
            <div>
               <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-0.5">Historical Baseline</h4>
               <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Calculated across 4.2k nodes</p>
            </div>
         </div>
         <div className="bg-[#151b28] border border-white/5 p-6 rounded-2xl flex items-center gap-6 group hover:bg-white/[0.02] transition-colors">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
               <Zap className="w-5 h-5" />
            </div>
            <div>
               <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-0.5">Velocity Target</h4>
               <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Achieved 92% of KPI Threshold</p>
            </div>
         </div>
      </div>
    </div>
  );
};
