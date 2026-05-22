import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const Tooltip = ({ text, children }: { text: string; children: React.ReactNode }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="absolute z-[100] bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-xl pointer-events-none"
            style={{
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <p className="text-[11px] leading-relaxed font-medium" style={{ color: 'var(--color-text-body)' }}>{text}</p>
            <div
              className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-8 border-transparent"
              style={{ borderTopColor: 'var(--color-border)' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
