
import { auth } from '@/lib/firebase';
import { listConversations } from '@/ai/flows/pulse-flow';
import { Conversation } from '@/ai/schemas';
import { SidebarContent } from './_components/SidebarContent';
import { Header } from '@/components/dashboard/Header';

// This layout is now specific to the Pulse module and creates a
// dedicated, full-screen chat interface like ChatGPT.

export default async function PulseModuleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = auth.currentUser;
  let conversations: Conversation[] = [];
  let error: string | null = null;

  // This logic remains on the server to fetch data initially.
  if (currentUser) {
    try {
      const convos = await listConversations({ actor: currentUser.uid });
      conversations = [...convos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      console.error("Failed to fetch conversations in Pulse layout:", err);
      error = "Não foi possível carregar o histórico de conversas.";
    }
  } else {
    error = "Usuário não autenticado.";
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
       {/* We can still use the main header for consistency */}
      <Header />
      <div className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden">
        {/* Dedicated Sidebar for Pulse */}
        <aside className="w-72 bg-gray-50 flex-shrink-0 flex flex-col p-4 shadow-neumorphism-right border-r border-gray-200">
           <SidebarContent 
                initialConversations={conversations} 
                initialError={error}
                actorUid={currentUser?.uid || ''}
            />
        </aside>

        {/* Main Chat Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
