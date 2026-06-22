import React, { useState } from 'react';
import { Cpu, Sun, Moon, LogOut, User } from 'lucide-react';
import { useAuth } from '../../app/services/auth/AuthProvider';
import { useTheme } from '../../app/services/context/ThemeContext';

export const TalentStreamHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header 
      className="h-14 border-b flex items-center justify-between px-8 sticky top-0 z-[100] backdrop-blur-md transition-all duration-300 shadow-sm"
      style={{ 
        backgroundColor: 'var(--talentstream-surface)', 
        borderColor: 'var(--talentstream-outline-variant)' 
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded bg-talentstream-primary flex items-center justify-center shadow-lg shadow-talentstream-primary/20">
          <Cpu className="w-4 h-4 text-white" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-2xl font-inter font-black tracking-tighter leading-none" style={{ color: 'var(--talentstream-on-surface)' }}>
            Talent<span className="text-indigo-600 dark:text-indigo-400">Stream</span>
          </h1>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300 hover:opacity-70 group"
          style={{ borderColor: 'var(--talentstream-outline-variant)', color: 'var(--talentstream-on-surface)' }}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          <span className="font-manrope font-bold text-[10px] uppercase tracking-wider transition-colors">
            {theme === 'dark' ? 'Light' : 'Dark'}
          </span>
        </button>

        <div className="w-[1px] h-6 bg-white/10 mx-2" />

        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all text-indigo-400 focus:outline-none"
          >
            <User className="w-4 h-4" />
          </button>
          
          {profileOpen && (
            <div 
              className="absolute right-0 mt-3 w-48 rounded-xl border shadow-2xl py-1 z-50 transition-colors duration-300"
              style={{ backgroundColor: 'var(--talentstream-surface)', borderColor: 'var(--card-border)' }}
            >
               <div 
                 className="px-4 py-2 border-b mb-1"
                 style={{ borderColor: 'var(--card-border)' }}
               >
                 <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{user?.name || 'Executive User'}</div>
                 <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{user?.email || 'admin@talentstream.ai'}</div>
               </div>
               <button
                 onClick={logout}
                 className="w-full flex items-center gap-2 px-4 py-2 text-rose-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-xs font-bold"
               >
                 <LogOut className="w-3.5 h-3.5" />
                 Sign Out
               </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
