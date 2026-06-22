import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Briefcase, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  ChevronRight,
  Shield,
  Target,
  Mail,
  UserPlus,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { listProjects, createProject, listProjectManagers, onboardManager, Project } from '../../app/services/api';

const ProjectManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'projects' | 'managers'>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showManagerModal, setShowManagerModal] = useState(false);
  
  // Form States
  const [newProject, setNewProject] = useState({ name: '', code: '', manager_id: '' });
  const [newManager, setNewManager] = useState({ name: '', email: '', username: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pData, mData] = await Promise.all([listProjects(), listProjectManagers()]);
      setProjects(pData);
      setManagers(mData);
    } catch (err) {
      console.error("Failed to load project data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProject(newProject);
      setShowProjectModal(false);
      setNewProject({ name: '', code: '', manager_id: '' });
      loadData();
    } catch (err) {
      alert("Error creating project. Check if code is unique.");
    }
  };

  const handleOnboardManager = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onboardManager(newManager);
      setShowManagerModal(false);
      setNewManager({ name: '', email: '', username: '' });
      loadData();
    } catch (err) {
      alert("Error onboarding manager.");
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-manrope font-black text-slate-900 dark:text-white tracking-tight">Demand Orchestration</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">Manage project delivery units and project manager onboarding.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowManagerModal(true)}
            className="px-5 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/10 transition-all flex items-center gap-2 shadow-sm"
          >
            <UserPlus className="w-4 h-4 text-talentstream-primary" /> Onboard Manager
          </button>
          <button 
            onClick={() => setShowProjectModal(true)}
            className="px-5 py-3 bg-talentstream-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 shadow-lg shadow-talentstream-primary/20"
          >
            <Plus className="w-4 h-4" /> New Project
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-white/5 rounded-[22px] w-fit">
        {[
          { id: 'projects', label: 'Projects', icon: Briefcase },
          { id: 'managers', label: 'Managers', icon: Users },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
              activeTab === tab.id 
                ? 'bg-white dark:bg-white/10 text-talentstream-primary shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-talentstream-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeTab === 'projects' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <motion.div 
                layout
                key={project.id}
                className="group p-6 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[32px] hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/20 transition-all duration-500 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                   <Layers className="w-24 h-24 text-talentstream-primary" />
                </div>
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-6">
                    <div className="px-3 py-1.5 bg-indigo-50 dark:bg-talentstream-primary/10 border border-indigo-100 dark:border-talentstream-primary/20 rounded-xl text-[10px] font-black text-talentstream-primary uppercase tracking-widest">
                      {project.code}
                    </div>
                    <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{project.name}</h3>
                  
                  <div className="mt-auto pt-6 border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-talentstream-primary/10 flex items-center justify-center text-[10px] font-black text-talentstream-primary">
                        {project.manager_name ? project.manager_name.charAt(0) : '?'}
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Lead</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {project.manager_name || 'Unassigned'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-talentstream-primary transform group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[40px] overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-50 dark:border-white/5">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Manager</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Identity</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                {managers.map((mgr) => (
                  <tr key={mgr.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-white/10 flex items-center justify-center text-talentstream-primary font-black shadow-sm group-hover:scale-110 transition-transform">
                          {mgr.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white">{mgr.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">@{mgr.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                         <Mail className="w-3.5 h-3.5" />
                         <span className="text-sm font-medium">{mgr.email}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white dark:hover:bg-white/10 transition-all">
                        Edit Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showProjectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowProjectModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden"
            >
              <div className="p-10">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Create New Project</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-8">Define a new project unit and assign a lead manager.</p>
                
                <form onSubmit={handleCreateProject} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Project Name</label>
                    <input 
                      required
                      value={newProject.name}
                      onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                      placeholder="e.g. TalentStream 2.0"
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-talentstream-primary/20 outline-none transition-all font-medium"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Project Code</label>
                      <input 
                        required
                        value={newProject.code}
                        onChange={(e) => setNewProject({...newProject, code: e.target.value})}
                        placeholder="TS-2024"
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-talentstream-primary/20 outline-none transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Manager</label>
                      <select 
                        value={newProject.manager_id}
                        onChange={(e) => setNewProject({...newProject, manager_id: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-talentstream-primary/20 outline-none transition-all font-medium appearance-none"
                      >
                        <option value="">Select Manager</option>
                        {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                  </div>
                  
                  <div className="pt-4 flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => setShowProjectModal(false)}
                      className="flex-1 py-4 bg-slate-50 dark:bg-white/5 text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-[2] py-4 bg-talentstream-primary text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-talentstream-primary/20 hover:scale-[1.02] transition-all"
                    >
                      Initialize Project
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {showManagerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowManagerModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden"
            >
              <div className="p-10">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Onboard Manager</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-8">Provision a new account with Project Manager credentials.</p>
                
                <form onSubmit={handleOnboardManager} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                    <input 
                      required
                      value={newManager.name}
                      onChange={(e) => setNewManager({...newManager, name: e.target.value})}
                      placeholder="Alex Johnson"
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-talentstream-primary/20 outline-none transition-all font-medium"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                    <input 
                      required
                      type="email"
                      value={newManager.email}
                      onChange={(e) => setNewManager({...newManager, email: e.target.value})}
                      placeholder="alex@talentstream.com"
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-talentstream-primary/20 outline-none transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                    <input 
                      required
                      value={newManager.username}
                      onChange={(e) => setNewManager({...newManager, username: e.target.value})}
                      placeholder="alex.j"
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-talentstream-primary/20 outline-none transition-all font-medium"
                    />
                  </div>
                  
                  <div className="pt-4 flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => setShowManagerModal(false)}
                      className="flex-1 py-4 bg-slate-50 dark:bg-white/5 text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-[2] py-4 bg-talentstream-primary text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-talentstream-primary/20 hover:scale-[1.02] transition-all"
                    >
                      Confirm Onboarding
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectManagement;
