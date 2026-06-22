import { UserRole } from '@/app/services/context/AuthContext';

// ─── What each role can access ────────────────────────────────────────────────

export interface RoleConfig {
  label: string;
  allowedRoutes: string[];
  defaultRoute: string;
  description: string;
  color: string;
  emoji: string;
}

export const ROLE_CONFIG: Record<UserRole, RoleConfig> = {
  Admin: {
    label: 'Superuser Admin',
    allowedRoutes: [
      '/admin/user-management', 
      '/admin/permissions', 
      '/admin/audit-logs'
    ],
    defaultRoute: '/admin/user-management',
    description: 'System-wide identity orchestration and security audit logs.',
    color: 'text-indigo-400',
    emoji: '🔑',
  },
  VP: {
    label: 'VP Executive',
    allowedRoutes: [
      '/vp/organization-insights', 
      '/vp/hiring-trends', 
      '/vp/departmental-performance'
    ],
    defaultRoute: '/vp/organization-insights',
    description: 'High-level reporting & monitoring hiring trends.',
    color: 'text-purple-400',
    emoji: '📊',
  },
  Program_Mgr: {
    label: 'Program Manager',
    allowedRoutes: ['/pgm/dashboard', '/pgm/pm-management', '/pgm/analytics', '/pm/jd-architect', '/interviews'],
    defaultRoute: '/pgm/dashboard',
    description: 'Departmental oversight & high-priority JD management.',
    color: 'text-blue-400',
    emoji: '🗂️',
  },
  Project_Mgr: {
    label: 'Project Manager',
    allowedRoutes: ['/pm/dashboard', '/pm/talent-pool', '/pm/pipeline', '/pm/jd-architect', '/pm/analytics', '/interviews'],
    defaultRoute: '/pm/dashboard',
    description: 'Direct hiring pipeline management & match verification.',
    color: 'text-emerald-400',
    emoji: '📋',
  },
  RMG: {
    label: 'RMG',
    allowedRoutes: ['/rmg/overview', '/rmg/resource-pool'],
    defaultRoute: '/rmg/overview',
    description: 'Resource management & bulk candidate indexing.',
    color: 'text-yellow-400',
    emoji: '👥',
  },
};

export function canAccess(role: UserRole, route: string): boolean {
  // Use .some and .startsWith for easier sub-route handling
  return ROLE_CONFIG[role].allowedRoutes.some(r => route === r || route.startsWith(r + '/'));
}
