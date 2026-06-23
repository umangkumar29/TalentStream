import React, { useState, useEffect } from 'react';
import { Cpu, Sun, Moon, LogOut, User, Bell, CheckCheck, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../../app/services/auth/AuthProvider';
import { useTheme } from '../../app/services/context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead, AppNotification } from '../../app/services/api';
import { motion, AnimatePresence } from 'framer-motion';

// ── Notification Bell Component ──────────────────────────────────────────────
const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const loadNotifications = async () => {
    try {
      const data = await fetchNotifications(false, user?.role);
      setNotifications(data);
    } catch (err) {
      console.error('[Notifications] Failed to fetch:', err);
    }
  };

  // Initial load + polling every 30s
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [user?.role]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleNotificationClick = async (notif: AppNotification) => {
    // Mark as read
    if (!notif.is_read) {
      try {
        await markNotificationRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
      } catch (err) {
        console.error('[Notifications] Failed to mark read:', err);
      }
    }

    // Navigate based on notification type
    if (notif.type === 'job_fulfilled' && notif.metadata_json) {
      try {
        const meta = JSON.parse(notif.metadata_json);
        if (meta.job_id) {
          setIsOpen(false);
          navigate(`/rmg/demand/${meta.job_id}/matches`);
        }
      } catch {
        // ignore parse errors
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead(user?.role);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('[Notifications] Failed to mark all read:', err);
    }
  };

  const timeAgo = (dateStr: string | null): string => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) loadNotifications(); }}
        className="relative flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all text-indigo-400 focus:outline-none"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 border-2 border-white dark:border-[#0f172a] shadow-sm"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-3 w-[360px] max-h-[420px] rounded-2xl border shadow-2xl z-[200] overflow-hidden flex flex-col"
            style={{ backgroundColor: 'var(--talentstream-surface)', borderColor: 'var(--card-border)' }}
          >
            {/* Header */}
            <div
              className="px-4 py-3 border-b flex items-center justify-between shrink-0"
              style={{ borderColor: 'var(--card-border)' }}
            >
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                    {unreadCount} NEW
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 px-2 py-1 text-[9px] font-bold text-indigo-500 hover:bg-indigo-500/10 rounded-md transition-colors uppercase tracking-wider"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3 h-3" /> Read All
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Bell className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No notifications yet</p>
                </div>
              ) : (
                <div className="py-1">
                  {notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`w-full text-left px-4 py-3 transition-all border-b last:border-b-0 group flex items-start gap-3 ${
                        notif.is_read
                          ? 'opacity-60 hover:opacity-80 hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                          : 'bg-indigo-500/[0.03] hover:bg-indigo-500/[0.06]'
                      }`}
                      style={{ borderColor: 'var(--card-border)' }}
                    >
                      {/* Indicator dot */}
                      <div className="pt-1 shrink-0">
                        <div
                          className={`w-2 h-2 rounded-full transition-colors ${
                            notif.is_read ? 'bg-slate-300 dark:bg-slate-700' : 'bg-emerald-500 shadow-sm shadow-emerald-500/40'
                          }`}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                            {notif.title}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0">
                            {timeAgo(notif.created_at)}
                          </span>
                        </div>
                        <p className="text-xs font-semibold leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                          {notif.message}
                        </p>
                        {notif.type === 'job_fulfilled' && (
                          <div className="mt-1.5 flex items-center gap-1 text-[9px] font-bold text-indigo-500 uppercase tracking-widest group-hover:underline">
                            Allocate Now <ArrowRight className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Main Header ──────────────────────────────────────────────────────────────
export const TalentStreamHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);

  // Only show notifications for RMG users
  const showNotifications = user?.role === 'RMG';

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

        {/* 🔔 Notification Bell — RMG only */}
        {showNotifications && <NotificationBell />}

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
