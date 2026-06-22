import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Shield, Activity, 
  Search, Filter, Edit2, Trash2, 
  Clock, Loader2, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { listUsers, createUser, deleteUser, fetchAuditLogs } from '../../app/services/api';

interface Identity {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  syncDate?: string;
}

export const AdminUserManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<Identity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await listUsers();
      // transform backend user to identity if needed, or assume match
      setUsers(data || []);
    } catch (err) {
      console.error("Identity synchronization failure:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (userId: string) => {
    if (!window.confirm("Confirm user deletion?")) return;
    try {
      setIsSyncing(true);
      await deleteUser(userId);
      await loadData();
    } catch (err) {
      console.error("Deletion failed:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredUsers = users.filter(user => 
    (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.role?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2 uppercase">User <span className="text-indigo-400">Management</span></h1>
          <p className="text-slate-400 max-w-2xl text-lg font-medium leading-relaxed">
            Oversee secure access protocols and user lifecycles across the TalentStream platform.
          </p>
        </div>
        <button className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-500 shadow-xl shadow-indigo-600/20 active:scale-95 border border-indigo-400/20 group">
          <UserPlus size={20} className="group-hover:rotate-12 transition-transform" />
          Create New User
        </button>
      </div>

      {/* KPI Stats - Dynamic */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Users', value: users.length, icon: Users, color: 'blue', trend: 'Live' },
          { label: 'Active Sessions', value: users.filter(u => u.status === 'active').length, icon: Activity, color: 'emerald', trend: 'Secure' },
          { label: 'System Access', value: 'High', icon: Shield, color: 'indigo', trend: 'Verified' },
          { label: 'Sync Status', value: isSyncing ? 'Syncing' : 'Idle', icon: Clock, color: 'slate', trend: '100%' },
        ].map((kpi, i) => (
          <div key={i} className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 p-8 rounded-[2rem] group hover:border-white/20 transition-all duration-700">
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 rounded-2xl bg-white/5 text-slate-400 group-hover:text-white transition-colors">
                <kpi.icon size={28} />
              </div>
              <span className="text-[10px] font-black px-3 py-1.5 rounded-full tracking-widest uppercase bg-black/40 text-slate-600">
                {kpi.trend}
              </span>
            </div>
            <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2 opacity-60">{kpi.label}</h3>
            <div className="text-4xl font-extrabold text-white tracking-tighter">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* User Directory */}
      <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-white/[0.02]">
        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 bg-white/[0.02]">
          <div className="relative w-full md:w-[28rem] group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={20} />
            <input 
              type="text"
              placeholder="Search secure directory..."
              className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white text-sm font-medium focus:outline-none focus:border-indigo-500/40 placeholder:text-slate-600 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={loadData} className="p-4 bg-white/5 border border-white/10 rounded-2xl text-slate-500 hover:text-white group">
            <Activity className={`w-5 h-5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto overflow-y-auto max-h-[500px] custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/20 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5">
                <th className="px-10 py-6">User</th>
                <th className="px-10 py-6">Mission Role</th>
                <th className="px-10 py-6">Last Sync</th>
                <th className="px-10 py-6">Protocol Status</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-24 text-center">
                       <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto mb-4" />
                       <p className="text-[10px] font-black text-slate-600 tracking-widest uppercase">Fetching Directory...</p>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-24 text-center">
                       <Database className="w-12 h-12 text-slate-800 mx-auto mb-4 opacity-20" />
                       <p className="text-[11px] font-black text-slate-700 tracking-[0.2em] uppercase">No identity nodes matched search</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, idx) => (
                    <motion.tr 
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-white/[0.02] transition-all group"
                    >
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-slate-500 group-hover:text-white transition-all shadow-inner overflow-hidden">
                             <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${user.email}`} alt="" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors uppercase">{user.name || 'Anonymous'}</p>
                            <p className="text-[10px] text-slate-500 font-medium tracking-tight whitespace-nowrap">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <span className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-xs text-slate-500 font-bold uppercase whitespace-nowrap">
                        {user.syncDate || 'Oct 24, 2023'}
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`} />
                          <span className={`text-[10px] font-black uppercase tracking-widest ${user.status === 'active' ? 'text-emerald-500' : 'text-slate-600'}`}>
                            {user.status === 'active' ? 'Verified' : 'Cold'}
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                          <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-slate-500 hover:text-white transition-all">
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(user.id)}
                            className="p-3 bg-white/5 border border-white/10 rounded-xl text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUserManagement;
