import { createContext, useContext, useState, type ReactNode } from "react";

interface LeadFormContextType {
  isOpen: boolean;
  openLeadForm: () => void;
  closeLeadForm: () => void;
}

const LeadFormContext = createContext<LeadFormContextType | null>(null);

export function LeadFormProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <LeadFormContext.Provider
      value={{
        isOpen,
        openLeadForm: () => setIsOpen(true),
        closeLeadForm: () => setIsOpen(false),
      }}
    >
      {children}
    </LeadFormContext.Provider>
  );
}

export function useLeadForm() {
  const ctx = useContext(LeadFormContext);
  if (!ctx) throw new Error("useLeadForm must be used within LeadFormProvider");
  return ctx;
}
