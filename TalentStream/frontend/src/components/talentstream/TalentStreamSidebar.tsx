import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  LogOut,
  Cpu,
  BarChart3,
  Layers,
  Calendar,
  Zap,
  UserCheck,
  Shield,
  ShieldCheck,
  Users,
  Activity,
  FileText,
  Sun,
  Moon,
  type LucideIcon
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../../app/services/auth/AuthProvider';
import { useTheme } from '../../app/services/context/ThemeContext';
import { UserRole } from '../../app/services/context/AuthContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
  roles: UserRole[];
}

const allNavItems: NavItem[] = [
  // Admin Items (Exclusive)
  { icon: Users, label: 'User Management', path: '/admin/user-management', roles: ['Admin'] },
  { icon: Layers, label: 'Project Orchestration', path: '/admin/projects', roles: ['Admin'] },
  { icon: Shield, label: 'Roles & Permissions', path: '/admin/permissions', roles: ['Admin'] },
  { icon: Activity, label: 'Audit Logs', path: '/admin/audit-logs', roles: ['Admin'] },
  
  // PGM Items
  { icon: LayoutDashboard, label: 'PGM Dashboard', path: '/pgm/dashboard', roles: ['Program_Mgr', 'Project_Mgr'] },
  { icon: Layers, label: 'PM Management', path: '/pgm/pm-management', roles: ['Program_Mgr', 'Project_Mgr'] },
  
  // PM Items
  { icon: LayoutDashboard, label: 'PM Dashboard', path: '/pm/dashboard', roles: ['Project_Mgr'] },
  { icon: Users, label: 'Talent Pool', path: '/pm/talent-pool', roles: ['Project_Mgr'] },
  { icon: Cpu, label: 'JD Architect', path: '/pm/jd-architect', roles: ['Project_Mgr'] },
  
  // RMG Items
  { icon: LayoutDashboard, label: 'RMG Overview', path: '/rmg/overview', roles: ['RMG'] },
  
  // VP Items
  { icon: LayoutDashboard, label: 'Organization Insights', path: '/vp/organization-insights', roles: ['VP'] },
  { icon: BarChart3, label: 'Hiring Trends', path: '/vp/hiring-trends', roles: ['VP'] },
  { icon: Activity, label: 'Dept Performance', path: '/vp/departmental-performance', roles: ['VP'] },
  
  // Shared Items (Exclude Admin for focus)
  { icon: Calendar, label: 'Interviews', path: '/interviews', roles: ['Program_Mgr'] },
];

export const TalentStreamSidebar: React.FC = () => {
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // STRICT FILTERING: Only show items explicitly tagged for the user's role
  const navItems = user ? allNavItems.filter(item => item.roles.includes(user.role)) : [];

  return (
    <aside className="w-72 h-screen fixed left-0 top-0 border-r flex flex-col z-50 transition-all duration-300"
      style={{ backgroundColor: 'var(--talentstream-surface-low)', borderColor: 'var(--talentstream-outline-variant)' }}>
      
      {/* Brand Identity */}
      <div className="p-10 pb-12">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-talentstream-primary flex items-center justify-center shadow-lg shadow-talentstream-primary/20">
              <Cpu className="w-5 h-5 text-talentstream-bg" />
            </div>
            <h1 className="text-xl font-manrope font-extrabold tracking-tight uppercase" style={{ color: 'var(--talentstream-on-surface)' }}>
              TalentStream<span className="text-talentstream-primary">Elite</span>
            </h1>
          </div>
          <p className="text-[10px] uppercase tracking-[0.3em] font-manrope font-black pl-11 opacity-50" style={{ color: 'var(--talentstream-on-surface-variant)' }}>
            System Orchestrator
          </p>
        </div>
      </div>

      {/* Focused Navigation */}
      <nav className="flex-1 px-6 space-y-2 overflow-y-auto custom-scrollbar relative z-10">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-500 relative group",
              isActive ? "bg-talentstream-primary text-talentstream-bg shadow-lg shadow-talentstream-primary/20" : "hover:bg-white/5 text-slate-400 hover:text-white"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn(
                  "w-5 h-5 transition-transform duration-500 group-hover:scale-110",
                  isActive ? "text-talentstream-bg" : "text-slate-500 group-hover:text-white"
                )} />
                <span className="font-manrope font-bold text-[11px] uppercase tracking-wider">
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-white rounded-l-full" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer Actions */}
      <div className="p-8 mt-auto space-y-3 border-t bg-black/10" style={{ borderColor: 'var(--talentstream-outline-variant)' }}>
        <button
          onClick={toggleTheme}
          className="flex items-center gap-4 px-5 py-3 w-full rounded-xl border transition-all duration-300 hover:bg-white/5 group"
          style={{ borderColor: 'var(--talentstream-outline-variant)', color: 'var(--talentstream-on-surface-variant)' }}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-400" />}
          <span className="font-manrope font-extrabold text-[10px] uppercase tracking-wider group-hover:text-white transition-colors">
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>

        <button
          onClick={logout}
          className="flex items-center gap-4 px-5 py-3 w-full text-rose-500/70 hover:text-rose-400 hover:bg-rose-500/5 transition-all duration-300 group rounded-xl border border-transparent hover:border-rose-500/20"
        >
          <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          <span className="font-manrope font-extrabold text-[10px] uppercase tracking-wider">Logout</span>
        </button>
      </div>
    </aside>
  );
};
