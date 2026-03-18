import { motion } from "framer-motion";

export default function EarlyAccessForm() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 20 }}
      className="w-full"
    >
      <form
        onSubmit={(e) => e.preventDefault()}
        className="mt-8 flex items-center bg-[#1a1a1a] border border-white/15 rounded-full p-1.5 pl-3 sm:pl-4 w-fit mx-auto"
      >
        <input
          type="email"
          placeholder="seuemail@suaclinica.com.br"
          aria-label="Seu e-mail"
          className="bg-transparent text-white placeholder-white/50 outline-none px-2 py-2.5 font-manrope font-medium text-xs sm:text-sm w-auto min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:rounded-full"
          size={26}
        />
        <button
          type="submit"
          className="bg-[#FAFAFA] text-[#171719] rounded-full px-4 py-2.5 sm:px-5 sm:py-3 font-manrope font-medium text-xs sm:text-sm whitespace-nowrap cursor-pointer hover:bg-white transition-colors shrink-0"
        >
          Solicitar acesso
        </button>
      </form>
    </motion.div>
  );
}
