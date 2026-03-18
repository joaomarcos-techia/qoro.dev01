import { motion } from "framer-motion";

interface SectionBadgeProps {
  children: React.ReactNode;
}

export default function SectionBadge({ children }: SectionBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm"
    >
      <span className="text-xs font-semibold tracking-wide uppercase text-white/50 font-inter">
        {children}
      </span>
    </motion.div>
  );
}
