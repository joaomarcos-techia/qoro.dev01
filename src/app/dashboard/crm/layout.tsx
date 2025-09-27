
'use client';

// This layout is now simplified to just render children.
// The main DashboardLayout handles the sidebar and overall page structure.
export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
