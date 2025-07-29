'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronDown, LogOut, RefreshCw, Settings, User } from 'lucide-react';
import { signOut } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Link from 'next/link';

interface UserProfile {
  name: string;
  organizationName: string;
}

export function Header() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchUserProfile = useCallback(async (user: FirebaseUser) => {
    setIsLoading(true);
    try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            throw new Error("Documento do usuário não encontrado no Firestore.");
        }
        
        const userData = userDoc.data();
        const orgId = userData.organizationId;

        if (!orgId) {
            throw new Error("Usuário não tem um ID de organização.");
        }

        const orgDocRef = doc(db, 'organizations', orgId);
        const orgDoc = await getDoc(orgDocRef);
        
        if (!orgDoc.exists()) {
            throw new Error("Documento da organização não encontrado.");
        }
        
        setUserProfile({
            name: userData.name || 'Usuário',
            organizationName: orgDoc.data()?.name || 'Organização',
        });

    } catch (error) {
        console.error("Falha ao buscar perfil do usuário:", error);
        setUserProfile(null); 
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserProfile(user);
      } else {
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

  return (
    <header className="bg-white shadow-neumorphism border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
             <Link href="/dashboard">
                <h1 className="text-2xl font-bold text-black cursor-pointer">Qoro</h1>
             </Link>
          </div>

          <div className="flex items-center space-x-4">
            <button
              className="text-gray-500 hover:text-gray-700 p-2 rounded-xl hover:shadow-neumorphism-inset transition-all duration-300"
              title="Recarregar página"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            
            <Link href="/dashboard/settings" className="text-gray-500 hover:text-gray-700 p-2 rounded-xl hover:shadow-neumorphism-inset transition-all duration-300" title="Configurações">
                <Settings className="w-5 h-5" />
            </Link>

            <div className="relative" ref={menuRef}>
              <button
                onClick={toggleMenu}
                className="flex items-center text-gray-500 hover:text-gray-700 p-2 rounded-xl hover:shadow-neumorphism-inset transition-all duration-300"
                title="Menu do usuário"
              >
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>

              {isClient && menuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-neumorphism border border-gray-200 z-50">
                    {isLoading ? (
                        <div className="p-4 text-center text-sm text-gray-500">Carregando...</div>
                    ) : userProfile ? (
                        <>
                            <div className="p-4 border-b border-gray-200">
                                <div className="flex items-center">
                                <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                                    <User className="w-6 h-6 text-gray-600" />
                                </div>
                                <div className="ml-3 overflow-hidden">
                                    <p className="font-medium text-gray-900 truncate">
                                    {userProfile.name}
                                    </p>
                                    <p className="text-sm text-gray-600 truncate">
                                    {userProfile.organizationName}
                                    </p>
                                </div>
                                </div>
                            </div>
                            <div className="py-2">
                                <button
                                onClick={handleSignOut}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                                >
                                <LogOut className="w-4 h-4 mr-3" />
                                Sair da Conta
                                </button>
                            </div>
                        </>
                    ) : (
                         <div className="p-4 text-center">
                            <p className="text-sm text-gray-700 mb-2">Não foi possível carregar o perfil.</p>
                            <button
                                onClick={handleSignOut}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                                >
                                <LogOut className="w-4 h-4 mr-3" />
                                Sair e tentar novamente
                            </button>
                         </div>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
