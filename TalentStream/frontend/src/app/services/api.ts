import axios from 'axios';

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const BASE = isLocalhost 
  ? 'http://localhost:8000/api/v1' 
  : `${window.location.protocol}//${window.location.hostname}:8000/api/v1`;

// ── Shared axios instance ────────────────────────────────────────────────────
export const api = axios.create({ baseURL: BASE });

// Inject token from localStorage if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ts_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Types ────────────────────────────────────────────────────────────────────
export interface PGMAnalytics {
  jobs: {
    total: number;
    open: number;
    in_review: number;
    closed: number;
    fulfillment_rate: number;
  };
  candidates: { total: number };
  matches: {
    total: number;
    shortlisted: number;
    rejected: number;
    pending: number;
    avg_score: number;
  };
  departments: { name: string; total: number; filled: number; rate: number }[];
  project_managers: { id: string; name: string; email: string; job_count: number }[];
  top_roles: { role: string; count: number }[];
  recent_activity: {
    id: string;
    full_id: string;
    title: string;
    department: string;
    role_category: string;
    status: string;
    pm_name?: string;
    pm_id?: string;
    created_at: string;
  }[];
}

export interface Job {
  id: string;
  title: string;
  department: string | null;
  role_category: string;
  status: string;
  project_manager_id?: string;
  creator_id?: string;
  created_at: string;
  created_by_email?: string;
  match_count?: number;
  num_resources?: number;
  fulfilled_count?: number;
  matching_status?: string;
  top_k?: number;
  project_name?: string | null;
  project_code?: string | null;
  min_experience_years?: number | null;
}

export type JobRequest = Job;

export interface Candidate {
  id: string;
  employee_id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  skills: string;
  experience_years: number;
  resume_url: string;
  has_embedding: boolean;
  created_at: string;
  primary_skills?: string;
  secondary_skills?: string;
  role_category?: string;
  overall_summary?: string;
  project_summary?: string;
}

export interface RMGAnalytics {
  total_talent: number;
  bench: number;
  allocated: number;
  earmarked: number;
  bench_capacity: number;
  match_rate: number;
  time_to_allocate: number;
  skill_distribution: Array<{ name: string; percentage: number }>;
}

export interface VPInsights {
  totalJDs: number;
  openJDs: number;
  closedJDs: number;
  hiringSuccessRate: number;
  avgTimeToHire: number;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  manager_id: string | null;
  manager_name: string | null;
  created_at: string;
}

export interface ConsolidatedProjectDemand {
  project_id: string;
  project_name: string;
  project_code: string;
  manager_id: string | null;
  manager_name: string | null;
  jds: {
    id: string;
    title: string;
    status: string;
    match_count: number;
    role_category: string;
    created_at: string;
  }[];
}

// ── API functions ─────────────────────────────────────────────────────────────

// Project & Demand Orchestration
export const listProjects = (): Promise<Project[]> =>
  api.get('/projects').then((r) => r.data);

export const createProject = (data: { name: string; code: string; manager_id?: string }): Promise<Project> =>
  api.post('/projects', data).then((r) => r.data);

export const listProjectManagers = (): Promise<{ id: string; name: string; email: string }[]> =>
  api.get('/managers').then((r) => r.data);

export const fetchConsolidatedDemand = (): Promise<ConsolidatedProjectDemand[]> =>
  api.get('/rmg/consolidated-demand').then((r) => r.data);

export interface JobDemand {
  id: string;
  title: string;
  department: string | null;
  role_category: string;
  status: string;
  pm_id: string | null;
  pm_name: string;
  pm_email: string | null;
  match_count: number;
  hired_count: number;
  num_resources: number;
  top_k: number;
  matching_status: string | null;
  created_at: string;
  project_name?: string | null;
  project_code?: string | null;
}

export const fetchAllJobDemands = (): Promise<JobDemand[]> =>
  api.get('/rmg/all-job-demands').then((r) => r.data);


export const onboardManager = (data: { name: string; email: string; username: string }): Promise<any> =>
  api.post('/admin/users', { ...data, role: 'Project_Mgr' }).then((r) => r.data);

// Shared Uplink Services
export const uploadJD = (file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/jobs/upload-jd', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);
};

export const uploadResume = (file: File, name: string, roleCategory: string): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', name);
  formData.append('role_category', roleCategory);
  return api.post('/candidates/upload-resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);
};

// PGM Strategic Services
// PGM Analytics removed as per request


export const fetchPMs = (): Promise<{ id: string; name: string; email: string }[]> =>
  api.get('/pgm/project-managers').then((r) => r.data);

// PM Pipeline Services
export const fetchJobs = (): Promise<Job[]> =>
  api.get('/jobs').then((r) => r.data);

export const createJob = (data: any): Promise<any> =>
  api.post('/jobs', data).then((r) => r.data);

export const generateJD = (keywords: string): Promise<any> =>
  api.post('/jobs/generate-jd', { keywords }).then((r) => r.data);

export const triggerMatching = (jobId: string): Promise<any> =>
  api.post(`/jobs/${jobId}/match`).then((r) => r.data);

export const reTriggerMatching = (jobId: string): Promise<any> =>
  api.post(`/jobs/${jobId}/retrigger`).then((r) => r.data);

export const pollJobResults = (jobId: string): Promise<{ total_expected: number, total_processed: number, is_complete: boolean, results: any[] }> =>
  api.get(`/jobs/${jobId}/results`).then((r) => r.data);

export const updateMatchStatus = (matchId: string, status: 'shortlisted' | 'rejected' | 'pending'): Promise<any> =>
  api.patch(`/matches/${matchId}/status`, { status }).then((r) => r.data);

export const fetchPMJobs = (): Promise<Job[]> =>
  api.get('/pm/jobs').then((r) => r.data);

export const fetchPMMatches = (): Promise<any[]> =>
  api.get('/pm/matches').then((r) => r.data);

export const assignJobToPM = (jobId: string, pmId: string | null): Promise<any> =>
  api.patch(`/jobs/${jobId}/assign`, { project_manager_id: pmId });

export const updateJobStatus = (jobId: string, status: string): Promise<any> =>
  api.patch(`/pm/jobs/${jobId}/status`, { status });

export const deleteJob = (jobId: string): Promise<any> =>
  api.delete(`/jobs/${jobId}`);

export const updateJob = (jobId: string, data: Partial<Job>): Promise<any> =>
  api.patch(`/jobs/${jobId}`, data);

export const getJob = (jobId: string): Promise<Job & { description: string, num_resources: number, top_k: number }> =>
  api.get(`/jobs/${jobId}`).then((r) => r.data);

export const scheduleInterview = (matchId: string, stage: string, status: string, date?: string): Promise<any> =>
  api.post('/pm/interviews/schedule', { match_id: matchId, stage, status, date });

export const updateHiringDecision = (matchId: string, decision: string, metadata?: any): Promise<any> =>
  api.patch('/pm/matches/decision', { match_id: matchId, decision, ...metadata }).then((r) => r.data);

export const fetchPMInterviews = (jobId?: string): Promise<any[]> =>
  api.get('/pm/interviews', { params: { job_id: jobId } }).then((r) => r.data);

// RMG Resource Services
export const listCandidates = (params?: { search?: string, status_filter?: string, skip?: number, limit?: number, role_category?: string }): Promise<Candidate[]> =>
  api.get('/candidates', { params }).then((r) => r.data);

export const deleteCandidate = (candidateId: string): Promise<any> =>
  api.delete(`/candidates/${candidateId}`);

export const updateCandidate = (id: string, data: { 
  name?: string; 
  employee_id?: string;
  email?: string; 
  phone?: string;
  skills?: string;
  status?: string; 
}): Promise<any> => 
  api.patch(`/candidates/${id}`, data);

// RMG Resource Services
export const fetchRMGAnalytics = (): Promise<RMGAnalytics> =>
  api.get('/analytics/rmg').then((r) => r.data);


// VP Executive Services
export const fetchVPInsights = (): Promise<VPInsights> =>
  api.get('/analytics/vp/insights').then((r) => r.data);

export const fetchVPHiringTrends = (): Promise<any[]> =>
  api.get('/analytics/vp/trends').then((r) => r.data);

export const fetchVPDeptPerformance = (): Promise<any[]> =>
  api.get('/analytics/vp/departments').then((r) => r.data);

// Admin Orchestration Services
export const listUsers = (): Promise<any[]> =>
  api.get('/admin/users').then((r) => r.data);

export const createUser = (userData: any): Promise<any> =>
  api.post('/admin/users', userData).then((r) => r.data);

export const updateUser = (userId: string, userData: any): Promise<any> =>
  api.patch(`/admin/users/${userId}`, userData).then((r) => r.data);

export const deleteUser = (userId: string): Promise<any> =>
  api.delete(`/admin/users/${userId}`).then((r) => r.data);

export const fetchAuditLogs = (): Promise<any[]> =>
  api.get('/admin/audit-logs').then((r) => r.data);

export default api;
