import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme') as Theme;
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);

    // Also inject/remove a style tag with light-mode overrides so
    // hardcoded Tailwind JIT classes (bg-[#151B28], text-white, etc.)
    // get overridden without touching every component.
    const STYLE_ID = 'talentstream-light-mode-overrides';
    let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null;

    if (theme === 'light') {
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = STYLE_ID;
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = `
        /* ── Backgrounds ── */
        .light { background-color: #f0f4ff; color: #0f172a; }
        .light main, .light [role="main"] { background-color: #f0f4ff; }

        /* Surface layers */
        .light .bg-\\[\\#0A0E17\\],
        .light .bg-\\[\\#0a0e17\\],
        .light .bg-\\[\\#060912\\] { background-color: #f8faff !important; }

        .light .bg-\\[\\#151B28\\],
        .light .bg-\\[\\#151b28\\],
        .light .bg-\\[\\#0D1117\\],
        .light .bg-\\[\\#0d1117\\] { background-color: #ffffff !important; }

        .light .bg-\\[\\#1E2533\\],
        .light .bg-\\[\\#1e2533\\],
        .light .bg-\\[\\#131B28\\],
        .light .bg-\\[\\#131b28\\] { background-color: #eef2ff !important; }

        /* Border overrides */
        .light .border-white\\/5,
        .light .border-white\\/10 { border-color: #e2e8f0 !important; }

        .light .border-\\[\\#1E2533\\],
        .light .border-\\[\\#1e2533\\] { border-color: #e2e8f0 !important; }

        .light .divide-white\\/5 > * + * { border-color: #e2e8f0 !important; }

        /* ── Text ── */
        .light .text-white { color: #0f172a !important; }
        .light .text-\\[\\#94A3B8\\],
        .light .text-\\[\\#94a3b8\\],
        .light .text-\\[\\#64748B\\],
        .light .text-\\[\\#64748b\\] { color: #475569 !important; }

        /* Preserve colors for colored badges/icons */
        .light .text-emerald-400,
        .light .text-emerald-500 { color: #059669 !important; }
        .light .text-rose-400,
        .light .text-rose-500 { color: #e11d48 !important; }
        .light .text-indigo-400,
        .light .text-\\[\\#6366F1\\],
        .light .text-\\[\\#6366f1\\] { color: #4338ca !important; }

        /* ── Sidebar ── */
        .light aside {
          background-color: #ffffff !important;
          border-color: #e2e8f0 !important;
          box-shadow: 4px 0 20px rgba(15, 23, 42, 0.06);
        }

        /* ── Cards ── */
        .light .glass-card {
          background-color: #ffffff !important;
          border-color: #e2e8f0 !important;
          box-shadow: 0 2px 12px rgba(15, 23, 42, 0.06) !important;
        }

        /* ── Inputs ── */
        .light input:not([type="checkbox"]):not([type="radio"]),
        .light textarea,
        .light select {
          background-color: #f8faff !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }
        .light input::placeholder,
        .light textarea::placeholder { color: #94a3b8 !important; }

        /* ── Buttons: text on dark primary buttons keeps white ── */
        .light .bg-talentstream-primary,
        .light .bg-indigo-600,
        .light .bg-indigo-500,
        .light .bg-emerald-500,
        .light .bg-rose-600 { color: #ffffff !important; }

        /* ── Chart gradients: make visible on light bg ── */
        .light .from-talentstream-primary\\/60 { --tw-gradient-from: rgba(67,56,202,0.5) !important; }
        .light .from-talentstream-primary\\/20 { --tw-gradient-from: rgba(67,56,202,0.2) !important; }
        .light .to-talentstream-primary\\/10  { --tw-gradient-to:   rgba(67,56,202,0.05) !important; }
        .light .to-talentstream-tertiary\\/10 { --tw-gradient-to:   rgba(5,150,105,0.08) !important; }

        /* ── Hover states ── */
        .light .hover\\:bg-white\\/5:hover  { background-color: rgba(15,23,42,0.05) !important; }
        .light .hover\\:bg-white\\/10:hover { background-color: rgba(15,23,42,0.08) !important; }

        /* ── SIDEBAR: Active tab — strongly visible in light mode ── */
        .light aside a.bg-talentstream-primary\\/10,
        .light aside .bg-talentstream-primary\\/10 {
          background-color: #4338ca !important;
          color: #ffffff !important;
        }
        .light aside a.bg-talentstream-primary\\/10 svg,
        .light aside .bg-talentstream-primary\\/10 svg {
          color: #ffffff !important;
        }

        /* ── REPORTS PAGE: Fix washed-out text ── */
        /* Remove the /60, /20 opacity on text that hides content */
        .light .opacity-60 { opacity: 1 !important; }
        .light .opacity-70 { opacity: 1 !important; }
        .light .opacity-40 { opacity: 0.7 !important; }

        /* Skill density track bg (was nearly invisible) */
        .light .bg-talentstream-surface-highest\\/20 {
          background-color: #e2e8f0 !important;
        }

        /* Chart tooltip in reports */
        .light .bg-\\[\\#151B28\\].border-white\\/10 {
          background-color: #1e293b !important;
          border-color: #334155 !important;
          color: #ffffff !important;
        }

        /* "Powered by TalentStream..." faded text — boost it a little */
        .light .text-talentstream-on-surface-variant\\/20 {
          color: #94a3b8 !important;
        }
        .light .text-talentstream-on-surface-variant\\/60 {
          color: #475569 !important;
        }
      `;
    } else {
      // Remove light mode overrides on switch to dark
      if (styleEl) {
        styleEl.textContent = '';
      }
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
