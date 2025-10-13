
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
        setIsLoading(true); // Start loading when user is detected
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
    
    // This function will now be called repeatedly until it gets data.
    try {
      const accessInfo = await getUserAccessInfo({ actor: currentUser.uid });
      
      if (accessInfo) {
        setPlanId(accessInfo.planId);
        setPermissions(accessInfo.permissions);
        setIsLoading(false);
      } else {
        // If accessInfo is null, it means the user doc is not ready.
        // We will retry after a short delay.
        setTimeout(fetchPlan, 3000);
      }
    } catch (error) {
      console.error("Failed to fetch plan info, retrying:", error);
      setTimeout(fetchPlan, 3000); // Also retry on error
    }
  }, [currentUser]);


  useEffect(() => {
    if (currentUser) {
        fetchPlan();
    }
  }, [currentUser, fetchPlan]);


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
