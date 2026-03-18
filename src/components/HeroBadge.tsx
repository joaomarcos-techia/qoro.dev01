import { motion } from "framer-motion";
import { IconSparkles } from "@tabler/icons-react";

export default function HeroBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 backdrop-blur-sm"
    >
      <IconSparkles size={14} className="text-primary-light" />
      <span className="font-inter font-medium text-xs sm:text-sm text-white/60 tracking-wide">
        IA para Saúde
      </span>
    </motion.div>
  );
}
