import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { TalentStreamHeader } from './TalentStreamHeader';

export const TalentStreamLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen text-talentstream-on-surface transition-colors duration-300" style={{ backgroundColor: 'var(--talentstream-bg)' }}>
      <TalentStreamHeader />

      <main className="flex-1 overflow-x-hidden relative">
        <div className="p-4 md:p-6 lg:p-8 max-w-[1440px] mx-auto min-h-[calc(100vh-64px)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
