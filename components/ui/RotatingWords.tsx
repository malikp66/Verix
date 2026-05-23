'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface RotatingWordsProps {
  words: string[];
  interval?: number;
  className?: string;
}

export function RotatingWords({ words, interval = 2800, className }: RotatingWordsProps) {
  const [index, setIndex] = useState(0);

  const longestWord = Math.max(...words.map(w => w.length));

  useEffect(() => {
    const id = setInterval(() => setIndex((prev) => (prev + 1) % words.length), interval);
    return () => clearInterval(id);
  }, [words.length, interval]);

  return (
    <span
      className={`relative inline-block h-[1.35em] overflow-hidden align-baseline pb-0.5 whitespace-nowrap ${className ?? ''}`}
      style={{ minWidth: `${longestWord + 2}ch` }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          initial={{ y: 24, opacity: 0, filter: 'blur(6px)' }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: -24, opacity: 0, filter: 'blur(6px)' }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="absolute left-0 top-0 bg-gradient-to-r from-emerald-400/85 to-cyan-400/85 text-transparent bg-clip-text"
          style={{ textShadow: '0 0 20px rgba(52,211,153,0.15)' }}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
