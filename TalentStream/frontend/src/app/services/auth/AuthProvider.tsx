import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import keycloak from './keycloak';
import { UserRole, AuthUser } from '../context/AuthContext';
import { ROLE_CONFIG } from '../../constants/roles';
import axios from 'axios';

// ── Settings ──────────────────────────────────────────────────────────────────
const AUTH_ENABLED = import.meta.env.VITE_AUTH_ENABLED === 'true';
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_URL = import.meta.env.VITE_API_BASE_URL || (isLocalhost 
  ? 'http://localhost:8000/api/v1' 
  : `${window.location.protocol}//${window.location.hostname}:8000/api/v1`);

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: { username?: string; password?: string; demoUser?: AuthUser }) => Promise<void>;
  logout: () => void;
  authEnabled: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. App Init: Local Token Check OR Keycloak Start
  useEffect(() => {
    const initAuth = async () => {
      // Priority A: Check Local Storage for valid session
      const savedToken = localStorage.getItem('ts_token');
      const savedUser = localStorage.getItem('ts_user');
      
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        setIsLoading(false);
        return;
      }

      // Priority B: If SSO Enabled, start Keycloak
      if (AUTH_ENABLED) {
        try {
          const authenticated = await keycloak.init({
            onLoad: 'check-sso',
            checkLoginIframe: false,
            pkceMethod: 'S256',
          });

          if (authenticated && keycloak.tokenParsed) {
            const parsed = keycloak.tokenParsed as any;
            const realmRoles = parsed.realm_access?.roles ?? [];
            const validRoles = Object.keys(ROLE_CONFIG) as UserRole[];
            const matchedRole = validRoles.find((r) => realmRoles.includes(r));

            if (matchedRole) {
              const u: AuthUser = {
                id: parsed.sub,
                email: parsed.email ?? '',
                name: parsed.name ?? parsed.preferred_username ?? '',
                role: matchedRole as UserRole,
              };
              setUser(u);
              setToken(keycloak.token ?? null);
            }
          }
        } catch (err) {
          console.error('[Auth] SSO Init failed:', err);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // 2. Login Method: Federated (Local or Demo)
  const login = async ({ username, password, demoUser }: { username?: string; password?: string; demoUser?: AuthUser }) => {
    setError(null);
    setIsLoading(true);

    try {
      // A. Demo Bridge
      if (demoUser) {
        setUser(demoUser);
        setToken('demo-mode-token');
        localStorage.setItem('ts_user', JSON.stringify(demoUser));
        localStorage.setItem('ts_token', 'demo-mode-token');
        return;
      }

      // B. Local Auth Pipeline
      if (username && password) {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        const res = await axios.post(`${API_URL}/login`, formData);
        const { access_token, user: userData } = res.data;

        setUser(userData);
        setToken(access_token);
        localStorage.setItem('ts_token', access_token);
        localStorage.setItem('ts_user', JSON.stringify(userData));
        return;
      }
    } catch (err: any) {
        setError(err.response?.data?.detail || 'Authentication failed. Vector link severed.');
        throw err;
    } finally {
        setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('ts_token');
    localStorage.removeItem('ts_user');
    if (AUTH_ENABLED && keycloak.authenticated) {
      keycloak.logout({ redirectUri: window.location.origin + '/login' });
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, logout, authEnabled: AUTH_ENABLED, error }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
