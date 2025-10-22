
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserAccessInfo } from '@/ai/flows/user-management';
import { UserAccessInfo } from '@/ai/schemas';

type PlanContextType = {
  planId: 'free' | 'growth' | 'performance' | null;
  permissions: UserAccessInfo['permissions'] | null;
  role: 'admin' | 'member' | null;
  isLoading: boolean;
  error: string | null;
};

const PlanContext = createContext<PlanContextType>({
  planId: null,
  permissions: null,
  role: null,
  isLoading: true,
  error: null,
});

export const PlanProvider = ({ children }: { children: React.ReactNode }) => {
  const [planId, setPlanId] = useState<'free' | 'growth' | 'performance' | null>(null);
  const [permissions, setPermissions] = useState<UserAccessInfo['permissions'] | null>(null);
  const [role, setRole] = useState<'admin' | 'member' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
        setIsLoading(false);
        setPlanId(null);
        setPermissions(null);
        setRole(null);
        setError(null);
      }
    });
    return () => unsubscribe();
  }, []);
  
  const fetchPlan = useCallback(async (user: FirebaseUser) => {
    let isMounted = true;
    let attempts = 0;
    const maxAttempts = 10;
    const delay = 3000;

    const attemptFetch = async () => {
        if (!isMounted) return;

        try {
            const accessInfo = await getUserAccessInfo({ actor: user.uid });
            if (accessInfo) {
                if (isMounted) {
                    setPlanId(accessInfo.planId);
                    setPermissions(accessInfo.permissions);
                    setRole(accessInfo.role);
                    setError(null);
                    setIsLoading(false);
                }
            } else {
                throw new Error("User data not ready");
            }
        } catch (err) {
            if (isMounted && attempts < maxAttempts) {
                attempts++;
                console.log(`User data not ready, retrying... Attempt ${attempts}`);
                setTimeout(attemptFetch, delay);
            } else if (isMounted) {
                console.error("Failed to fetch plan info after multiple retries.");
                setError("USER_DATA_NOT_FOUND");
                setIsLoading(false);
            }
        }
    };

    if (user) {
        setIsLoading(true);
        attemptFetch();
    } else {
        setIsLoading(false);
    }
    
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      const cleanup = fetchPlan(currentUser);
      return () => {
        if (typeof cleanup === 'function') {
          cleanup();
        }
      };
    }
  }, [currentUser, fetchPlan]);


  return (
    <PlanContext.Provider value={{ planId, permissions, role, isLoading, error }}>
      {children}
    </PlanContext.Provider>
  );
};

export const usePlan = () => {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
};
