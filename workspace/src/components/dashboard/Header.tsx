
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronDown, LogOut, RefreshCw, Settings, User } from 'lucide-react';
import { signOut } from '@/lib/authService';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserProfile } from '@/ai/flows/user-management';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { usePlan } from '@/contexts/PlanContext';

interface UserProfile {
  name: string;
  organizationName: string;
}

export function Header() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { isLoading: isPlanLoading } = usePlan();

  const fetchUserProfile = useCallback(async (user: FirebaseUser) => {
    setIsLoadingProfile(true);
    setError(null);
    try {
        const profile = await getUserProfile({ actor: user.uid });
        if (profile) {
            setUserProfile(profile);
        } else {
            // This case is now handled by the PlanContext polling
            // We just wait for the user data to be available. 
            return; 
        }
    } catch (err) {
        
        setError("Não foi possível carregar os dados do perfil.");
        setUserProfile(null); 
    } finally {
        setIsLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        if (!isPlanLoading) {
            fetchUserProfile(user);
        }
      } else {
        setCurrentUser(null);
        setIsLoadingProfile(false);
        setUserProfile(null);
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router, fetchUserProfile, isPlanLoading]);


  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const renderDropdownContent = () => {
    if (isLoadingProfile || isPlanLoading) {
      return <div className="p-4 text-center text-sm text-muted-foreground">Carregando...</div>;
    }
  
    if (error) {
      return (
        <div className="p-4 text-center">
            <p className="text-sm text-destructive mb-2 font-semibold">{error}</p>
            <p className="text-xs text-muted-foreground mb-3">Isso pode ser um problema de rede temporário.</p>
            <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 flex items-center rounded-md"
                >
                <LogOut className="w-4 h-4 mr-3" />
                Sair e tentar novamente
            </button>
        </div>
      );
    }
    
    if (!userProfile) {
         return <div className="p-4 text-center text-sm text-muted-foreground">Aguardando dados do usuário...</div>;
    }
  
    return (
        <>
          <div className="p-4 border-b border-border">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                <User className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="ml-3 overflow-hidden">
                <p className="font-medium text-foreground truncate">
                  {userProfile.name}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {userProfile.organizationName}
                </p>
              </div>
            </div>
          </div>
          <div className="py-2">
            <button
              onClick={handleSignOut}
              className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 flex items-center"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sair da Conta
            </button>
          </div>
        </>
      );
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-40 h-16">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="cursor-pointer">
              <Logo />
            </Link>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              className="text-muted-foreground hover:text-foreground p-2 rounded-xl hover:bg-secondary transition-all duration-300"
              title="Recarregar página"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            
            <Link href="/dashboard/settings" className="text-muted-foreground hover:text-foreground p-2 rounded-xl hover:bg-secondary transition-all duration-300" title="Configurações">
                <Settings className="w-5 h-5" />
            </Link>

            <div className="relative" ref={menuRef}>
              <button
                onClick={toggleMenu}
                className="flex items-center text-muted-foreground hover:text-foreground p-2 rounded-xl hover:bg-secondary transition-all duration-300"
                title="Menu do usuário"
              >
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
                <ChevronDown className="hidden sm:block w-4 h-4 ml-1" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-card rounded-xl border border-border shadow-2xl z-50">
                    {renderDropdownContent()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
