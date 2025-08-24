
'use client';

// This layout is now simplified to just render children, as the main
// dashboard layout handles the sidebar and overall page structure.
export default function PulseConversationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
