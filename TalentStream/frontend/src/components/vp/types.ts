export interface VPInsights {
  totalJDs: number;
  openJDs: number;
  closedJDs: number;
  hiringSuccessRate: number;
  avgTimeToHire: number;
}

export interface HiringTrendData {
  month: string;
  openJDs: number;
  closedJDs: number;
  hiringRate: number;
  delta: 'up' | 'down' | 'neutral';
}

export interface DeptPerformance {
  department: string;
  totalJDs: number;
  filled: number;
  pending: number;
  healthIndex: number; // 0-100
  status: 'Critical' | 'Stable' | 'On Track' | 'Warning';
}

export interface VPDashboardData {
  insights: VPInsights;
  trends: HiringTrendData[];
  departments: DeptPerformance[];
}
