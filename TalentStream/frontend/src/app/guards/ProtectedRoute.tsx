import { useAuth } from '../services/auth/AuthProvider';
import { canAccess, ROLE_CONFIG } from '../constants/roles';
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { UserRole } from '../services/context/AuthContext';

interface ProtectedRouteProps {
  route: string;
  children: ReactNode;
}

export default function ProtectedRoute({ route, children }: ProtectedRouteProps) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (!canAccess(user.role, route)) {
    const defaultRoute = ROLE_CONFIG[user.role as UserRole].defaultRoute;
    return <Navigate to={defaultRoute} replace />;
  }

  return <>{children}</>;
}
