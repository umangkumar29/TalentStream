import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './app/services/auth/AuthProvider';
import { ThemeProvider } from './app/services/context/ThemeContext';
import { ROLE_CONFIG } from './app/constants/roles';
import ProtectedRoute from './app/guards/ProtectedRoute';
import LoginPage from './app/components/login/LoginPage';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

// core layout
import { TalentStreamLayout } from './components/talentstream/TalentStreamLayout';

// shared specialized tools
import { TalentStreamJDArchitect } from './components/talentstream/TalentStreamJDArchitect';
import { TalentStreamScheduleInterview } from './components/talentstream/TalentStreamScheduleInterview';

// RMG Modules
import { RMGOverview } from './components/rmg/RMGOverview';
import { RMGMatches } from './components/rmg/RMGMatches';

// PGM Modules
import { PGMDashboard } from './components/pgm/PGMDashboard';
import { PGMMatches } from './components/pgm/PGMMatches';
import { PMManagement } from './components/pgm/PMManagement';

// PM Modules
import { PMDashboard } from './components/pm/PMDashboard';
import { PMTalentPool } from './components/pm/PMTalentPool';
import { PMPipeline } from './components/pm/PMPipeline';

// Admin Modules
import AdminUserManagement from './components/admin/AdminUserManagement';
import AdminRolesPermissions from './components/admin/AdminRolesPermissions';
import ProjectManagement from './components/admin/ProjectManagement';
import AdminAuditLogs from './components/admin/AdminAuditLogs';

// VP Modules
import { VPOrganizationInsights } from './components/vp/VPOrganizationInsights';
import { VPHiringTrends } from './components/vp/VPHiringTrends';
import { VPDepartmentalPerformance } from './components/vp/VPDepartmentalPerformance';

function AppContent() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-talentstream-bg transition-colors duration-500 overflow-hidden">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center relative">
          <Loader2 className="w-16 h-16 text-talentstream-primary mx-auto mb-8 animate-spin" />
          <motion.p 
            animate={{ opacity: [0.4, 0.8, 0.4], letterSpacing: ['0.2em', '0.4em', '0.2em'] }} 
            transition={{ repeat: Infinity, duration: 3 }} 
            className="text-talentstream-primary font-manrope font-black uppercase text-[10px]"
          >
             Synchronizing Talent Pool...
          </motion.p>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-talentstream-primary/10 blur-3xl -z-10" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-talentstream-bg text-talentstream-on-surface transition-colors duration-300 font-inter antialiased selection:bg-talentstream-primary/20">
      <Routes>
        <Route path="/login" element={<LoginWithRedirect />} />
        <Route path="/*" element={<AppShell />} />
      </Routes>
    </div>
  );
}

function AppShell() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  return (
    <TalentStreamLayout>
      <Routes>
          {/* Admin Command Center */}
          <Route path="/admin/user-management" element={<ProtectedRoute route="/admin/user-management"><AdminUserManagement /></ProtectedRoute>} />
          <Route path="/admin/permissions" element={<ProtectedRoute route="/admin/permissions"><AdminRolesPermissions /></ProtectedRoute>} />
          <Route path="/admin/projects" element={<ProtectedRoute route="/admin/projects"><ProjectManagement /></ProtectedRoute>} />
          <Route path="/admin/audit-logs" element={<ProtectedRoute route="/admin/audit-logs"><AdminAuditLogs /></ProtectedRoute>} />

          {/* PGM Command Center */}
          <Route path="/pgm/dashboard" element={<ProtectedRoute route="/pgm/dashboard"><PGMDashboard /></ProtectedRoute>} />
          <Route path="/pgm/matches" element={<ProtectedRoute route="/pgm/dashboard"><PGMMatches /></ProtectedRoute>} />
          <Route path="/pgm/pipeline" element={<ProtectedRoute route="/pgm/dashboard"><PMPipeline /></ProtectedRoute>} />
          <Route path="/pgm/pm-management" element={<ProtectedRoute route="/pgm/pm-management"><PMManagement /></ProtectedRoute>} />


          {/* PM Project Center */}
          <Route path="/pm/dashboard" element={<ProtectedRoute route="/pm/dashboard"><PMDashboard /></ProtectedRoute>} />
          <Route path="/pm/matches" element={<ProtectedRoute route="/pm/dashboard"><PMPipeline /></ProtectedRoute>} />
          <Route path="/pm/talent-pool" element={<ProtectedRoute route="/pm/talent-pool"><PMTalentPool /></ProtectedRoute>} />
          <Route path="/pm/jd-architect" element={<ProtectedRoute route="/pm/jd-architect"><TalentStreamJDArchitect /></ProtectedRoute>} />
          <Route path="/pm/jd-architect/:jobId" element={<ProtectedRoute route="/pm/jd-architect"><TalentStreamJDArchitect /></ProtectedRoute>} />
          <Route path="/interviews" element={<ProtectedRoute route="/interviews"><TalentStreamScheduleInterview /></ProtectedRoute>} />
          
          {/* RMG Resource Management */}
          <Route path="/rmg/overview" element={<ProtectedRoute route="/rmg/overview"><RMGOverview /></ProtectedRoute>} />
          <Route path="/rmg/demand/:jobId/matches" element={<ProtectedRoute route="/rmg/overview"><RMGMatches /></ProtectedRoute>} />
          {/* VP Executive Suite */}
          <Route path="/vp/organization-insights" element={<ProtectedRoute route="/vp/organization-insights"><VPOrganizationInsights /></ProtectedRoute>} />
          <Route path="/vp/hiring-trends" element={<ProtectedRoute route="/vp/hiring-trends"><VPHiringTrends /></ProtectedRoute>} />
          <Route path="/vp/departmental-performance" element={<ProtectedRoute route="/vp/departmental-performance"><VPDepartmentalPerformance /></ProtectedRoute>} />

          {/* Fallback to default route based on role */}
          <Route path="*" element={<Navigate to={ROLE_CONFIG[user.role]?.defaultRoute || '/login'} replace />} />
      </Routes>
    </TalentStreamLayout>
  );
}

function LoginWithRedirect() {
  const { user } = useAuth();
  if (user) return <Navigate to={ROLE_CONFIG[user.role]?.defaultRoute || '/dashboard'} replace />;
  return <LoginPage />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
