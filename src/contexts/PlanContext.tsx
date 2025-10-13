
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserAccessInfo } from '@/ai/flows/user-management';
import { UserAccessInfo } from '@/ai/schemas';

type PlanContextType = {
  planId: 'free' | 'growth' | 'performance' | null;
  permissions: UserAccessInfo['permissions'] | null;
  isLoading: boolean;
};

const PlanContext = createContext<PlanContextType | null>(null);

export const PlanProvider = ({ children }: { children: React.ReactNode }) => {
  const [planId, setPlanId] = useState<'free' | 'growth' | 'performance' | null>(null);
  const [permissions, setPermissions] = useState<UserAccessInfo['permissions'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setIsLoading(true); 
      } else {
        setCurrentUser(null);
        setIsLoading(false);
        setPlanId(null);
        setPermissions(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchPlan = useCallback(async () => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }
  
    setIsLoading(true);
    let attempts = 0;
    const maxAttempts = 10;
    const delay = 3000;
  
    const attemptFetch = async () => {
      try {
        const accessInfo = await getUserAccessInfo({ actor: currentUser.uid });
        if (accessInfo) {
          setPlanId(accessInfo.planId);
          setPermissions(accessInfo.permissions);
          setIsLoading(false);
        } else {
          // Lança erro para acionar a lógica de retentativa
          throw new Error('User data not ready');
        }
      } catch (error) {
        attempts++;
        if (attempts < maxAttempts) {
          console.log(`User data not ready, retrying... Attempt ${attempts}`);
          setTimeout(attemptFetch, delay);
        } else {
          console.error('Failed to fetch plan info after multiple retries.');
          setIsLoading(false); 
        }
      }
    };
    
    attemptFetch();
  }, [currentUser]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);


  return (
    <PlanContext.Provider value={{ planId, permissions, isLoading }}>
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
