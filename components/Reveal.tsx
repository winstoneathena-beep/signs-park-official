"use client";

import { motion, type HTMLMotionProps } from "motion/react";

export function Reveal({
  delay = 0,
  y = 24,
  once = true,
  children,
  ...rest
}: HTMLMotionProps<"div"> & { delay?: number; y?: number; once?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once, margin: "-10%" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
