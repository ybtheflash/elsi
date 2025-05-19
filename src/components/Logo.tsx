"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { PenTip } from "./PenTip";

const ELText = () => (
  <div className="relative w-12 h-12">
    <motion.span className="absolute top-0 left-0 font-brand text-3xl text-primary">
      E
    </motion.span>
    <motion.span className="absolute bottom-0 right-0 font-brand text-3xl text-primary">
      L
    </motion.span>
  </div>
);

export default function Logo() {
  const [showPen, setShowPen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowPen((prev) => !prev);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <AnimatePresence mode="wait">
        {showPen ? (
          <motion.div
            key="pen"
            className="relative"
            initial={{ opacity: 0, scale: 0, rotate: 180, y: 0 }}
            animate={{
              opacity: 1,
              scale: 1.3,
              rotate: 180,
              y: -7, // Added y transform
              transition: {
                type: "spring",
                stiffness: 200,
                damping: 20,
              },
            }}
            exit={{
              opacity: 0,
              scale: 0,
              filter: "blur(10px)",
              transition: { duration: 0.3 },
            }}
          >
            <PenTip />
            {/* Animated Circle */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 48 48"
              style={{
                transform: "scale(1.4)",
              }}
            >
              <motion.circle
                cx="24"
                cy="17"
                r="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-primary"
                initial={{ pathLength: 0, rotate: -90 }}
                animate={{
                  pathLength: 1,
                  transition: {
                    duration: 1,
                    ease: "easeInOut",
                  },
                }}
                style={{
                  rotate: -90,
                  transformOrigin: "center",
                }}
              />
            </svg>
          </motion.div>
        ) : (
          <motion.div
            key="el"
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: 1,
              scale: 1,
              transition: {
                type: "spring",
                stiffness: 200,
                damping: 20,
              },
            }}
            exit={{
              opacity: 0,
              scale: 0,
              filter: "blur(10px)",
              transition: { duration: 0.3 },
            }}
          >
            <ELText />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
