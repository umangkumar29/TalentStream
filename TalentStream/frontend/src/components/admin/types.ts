import { LucideIcon } from 'lucide-react';

export interface UserIdentity {
  id: string;
  name: string;
  email: string;
  role: string;
  syncDate: string;
  status: 'active' | 'inactive';
  avatar?: string;
}

export interface KPIStats {
  label: string;
  value: string;
  trend: string;
  icon: LucideIcon;
  color: string;
}

export interface AuditLog {
  id: string;
  action: string;
  user: { name: string; avatar?: string };
  timestamp: string;
  details: string;
  status: 'success' | 'failure';
  icon: LucideIcon;
}

export interface RolePermission {
  id: string;
  name: string;
  description: string;
  isEnabled: boolean;
}

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  permissions: RolePermission[];
}

export interface AdminDashboardData {
  users: UserIdentity[];
  kpis: KPIStats[];
  auditLogs: AuditLog[];
  roles: RoleDefinition[];
  insights: {
    rmgPmTrend: number;
    pgmVpTrend: number;
    securityPosture: number;
    systemPrecision: string;
    lastBackup: string;
  };
}
