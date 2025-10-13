
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronDown, LogOut, RefreshCw, Settings, User } from 'lucide-react';
import { signOut } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserProfile } from '@/ai/flows/user-management';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';

interface UserProfile {
  name: string;
  organizationName: string;
}

export function Header() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchUserProfile = useCallback(async (user: FirebaseUser) => {
    setIsLoading(true);
    setError(null);
    try {
        const profile = await getUserProfile({ actor: user.uid });
        // Only set profile if it's not null (i.e., user doc is ready)
        if (profile) {
            setUserProfile(profile);
        } else {
            // If profile is null, it might be syncing. Don't set an error yet.
            // The loading state will remain true, driven by the context.
            return;
        }
    } catch (err) {
        console.error("Falha ao buscar perfil do usuário:", err);
        setError("Não foi possível carregar os dados do perfil.");
        setUserProfile(null); 
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchUserProfile(user);
      } else {
        setCurrentUser(null);
        setIsLoading(false);
        setUserProfile(null);
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router, fetchUserProfile]);


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
    // Show loading if the initial fetch is happening or if the profile is still null (pending sync)
    if (isLoading || !userProfile) {
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
    <header className="bg-card border-b border-border sticky top-0 z-40">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
             <Link href="/dashboard" className="cursor-pointer">
                <Logo />
             </Link>
          </div>

          <div className="flex items-center space-x-4">
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
                <ChevronDown className="w-4 h-4 ml-1" />
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
