
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
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        setIsLoading(false);
        setPlanId(null);
        setPermissions(null);
        setRetryCount(0); // Reset retry count on logout
      } else {
        // When a new user logs in, reset state and start fetching
        setIsLoading(true);
        setRetryCount(0);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchPlan = useCallback(async () => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    try {
      const accessInfo = await getUserAccessInfo({ actor: currentUser.uid });
      
      if (accessInfo) {
        setPlanId(accessInfo.planId);
        setPermissions(accessInfo.permissions);
        setIsLoading(false);
        setRetryCount(0); // Success, so reset retry count
      } else if (retryCount < 10) { // If accessInfo is null, it means user doc is not ready. Retry.
        console.log(`User data not ready, retrying... Attempt ${retryCount + 1}`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, 3000); // Wait 3 seconds before retrying
      } else {
        // Stop retrying after 10 attempts and show an error state
        console.error("Failed to fetch plan info after multiple retries.");
        setIsLoading(false);
        // Fallback to a safe state, maybe show an error in the UI
        setPlanId('free');
        setPermissions({ qoroCrm: false, qoroPulse: false, qoroTask: false, qoroFinance: false });
      }
    } catch (error) {
      console.error("Failed to fetch plan info:", error);
      setIsLoading(false);
      // Fallback to a safe state on error
      setPlanId('free');
      setPermissions({ qoroCrm: true, qoroPulse: false, qoroTask: true, qoroFinance: false });
    }
  }, [currentUser, retryCount]);


  useEffect(() => {
    fetchPlan();
  }, [currentUser, retryCount, fetchPlan]);


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
